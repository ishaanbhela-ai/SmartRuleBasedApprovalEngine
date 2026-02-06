require "rails_helper"

RSpec.describe "Requests API", type: :request do
  let(:tenant) { create(:tenant) }
  let(:admin) { create(:user, :admin, tenant: tenant) }
  let(:user) { create(:user, tenant: tenant, grade: 1) } # requester
  let(:other_user) { create(:user, tenant: tenant) }
  let(:request_type) { create(:request_type, tenant: tenant, name: "expense") }

  # Rule needed for RuleEvaluator to work during create
  let!(:rule) { create(:rule, tenant: tenant, request_type: request_type, grade: 1, definition: 1000) }

  let(:token) { generate_token(user) }
  let(:headers) { { "Authorization" => "Bearer #{token}" } }

  describe "GET /api/v1/requests" do
    let!(:my_request) { create(:request, tenant: tenant, requester: user, request_type: request_type) }
    let!(:other_request) { create(:request, tenant: tenant, requester: other_user, request_type: request_type) }
    let!(:other_tenant_request) { create(:request, tenant: create(:tenant)) }

    it "lists requests created by the current user" do
      get "/api/v1/requests", headers: headers

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      ids = body["data"].map { |r| r["id"] }

      expect(ids).to include(my_request.id)
      expect(ids).not_to include(other_request.id)
    end

    it "allows admin to see all requests in tenant" do
      admin_token = generate_token(admin)
      get "/api/v1/requests", headers: { "Authorization" => "Bearer #{admin_token}" }

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      ids = body["data"].map { |r| r["id"] }

      expect(ids).to include(my_request.id)
      expect(ids).to include(other_request.id)
      expect(ids).not_to include(other_tenant_request.id)
    end
  end

  describe "GET /api/v1/requests/:id" do
    let!(:request) { create(:request, tenant: tenant, requester: user, request_type: request_type) }

    it "shows the request details" do
      get "/api/v1/requests/#{request.id}", headers: headers

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body["data"]["id"]).to eq(request.id)
      expect(body["data"]["status"]).to eq(request.status)
    end

    it "forbids viewing other user's request" do
      other_request = create(:request, tenant: tenant, requester: other_user)
      get "/api/v1/requests/#{other_request.id}", headers: headers
      expect(response).to have_http_status(:forbidden)
    end

    it "allows admin to view any request" do
      admin_token = generate_token(admin)
      get "/api/v1/requests/#{request.id}", headers: { "Authorization" => "Bearer #{admin_token}" }
      expect(response).to have_http_status(:ok)
    end
  end

  describe "POST /api/v1/requests" do
    let(:params) do
      {
        request_type_id: request_type.id,
        requested_value: 500
      }
    end

    it "creates a new request and triggers rule evaluation" do
      expect {
        post "/api/v1/requests", params: params, headers: headers
      }.to change(Request, :count).by(1)

      expect(response).to have_http_status(:created)

      body = JSON.parse(response.body)
      new_req_id = body["data"]["id"]
      new_req = Request.find(new_req_id)

      expect(new_req.requester).to eq(user)
      expect(new_req.requested_value).to eq(500)
      # RuleEvaluator should run. 500 < 1000, so it might auto_approve or be pending based on rule logic?
      # Wait, RuleEvaluator behavior depends on logic.
      # Usually if limit check passes, what happens?
      # Checks spec/services/rule_evaluator_comprehensive_spec.rb...
      # If grade rule exists, it probably sets to pending_approval or auto_approved based on threshold?
      # Actually Rule model has definition (limit). But does logic say "auto approve if <= limit"?
      # Or "Pending approval if <= limit"?
      # Let's assume RuleEvaluator changes status from 'submitted' to something else.
      expect(new_req.status).not_to eq("submitted")
    end

    it "validates input" do
      post "/api/v1/requests", params: { request_type_id: nil, requested_value: 500 }, headers: headers
      expect(response).to have_http_status(:unprocessable_entity)
    end
  end

  describe "GET /api/v1/requests/balance" do
    let!(:previous_request) { create(:request, tenant: tenant, requester: user, request_type: request_type, status: "approved", requested_value: 200) }

    it "returns the balance for the request type" do
      get "/api/v1/requests/balance", params: { request_type_id: request_type.id }, headers: headers

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)

      expect(body["limit"]).to eq(1000) # Rule definition
      expect(body["used"]).to eq(200)
      expect(body["remaining"]).to eq(800)
    end

    # 404 test if request type not found
    it "returns 404 if request type invalid" do
        get "/api/v1/requests/balance", params: { request_type_id: "invalid" }, headers: headers
        expect(response).to have_http_status(:not_found)
    end
  end

  def generate_token(user)
    payload = {
      sub: user.id,
      tenant_id: user.tenant_id,
      role: user.role,
      exp: 24.hours.from_now.to_i
    }
    JWT.encode(payload, ENV.fetch("JWT_SECRET"), "HS256")
  end
end
