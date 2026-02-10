require "rails_helper"

RSpec.describe "Rules API", type: :request do
  let(:tenant) { create(:tenant) }
  let(:admin) { create(:user, :admin, tenant: tenant) }
  let(:user) { create(:user, tenant: tenant) }
  let(:token) { generate_token(admin) }
  let(:headers) { { "Authorization" => "Bearer #{token}" } }
  let(:request_type) { create(:request_type, tenant: tenant) }

  describe "GET /api/v1/rules" do
    let!(:rule1) { create(:rule, tenant: tenant, request_type: request_type, grade: 1, definition: 1000) }
    let!(:rule2) { create(:rule, tenant: tenant, request_type: request_type, grade: 2, definition: 2000) }
    let!(:other_rule) { create(:rule, tenant: create(:tenant), request_type: create(:request_type), grade: 1, definition: 1000) }

    it "lists rules for the tenant" do
      get "/api/v1/rules", headers: headers

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)

      ids = json["data"].map { |r| r["id"] }
      expect(ids).to contain_exactly(rule1.id, rule2.id)
      expect(ids).not_to include(other_rule.id)
    end
  end

  describe "POST /api/v1/rules" do
    let(:valid_params) do
      {
        request_type_id: request_type.id,
        grade: 3,
        definition: 5000
      }
    end

    it "creates a new rule" do
      expect {
        post "/api/v1/rules", params: valid_params, headers: headers
      }.to change(Rule, :count).by(1)

      expect(response).to have_http_status(:created)
      rule = Rule.last
      expect(rule.grade).to eq(3)
      expect(rule.definition).to eq(5000)
    end

    it "validates params" do
      post "/api/v1/rules", params: valid_params.merge(definition: -100), headers: headers
      expect(response).to have_http_status(:unprocessable_entity)
    end

    it "forbids non-admins" do
      user_token = generate_token(user)
      post "/api/v1/rules", params: valid_params, headers: { "Authorization" => "Bearer #{user_token}" }
      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "DELETE /api/v1/rules/:id" do
    let!(:rule) { create(:rule, :grade_1, tenant: tenant, request_type: request_type) }

    it "soft deletes the rule" do
      delete "/api/v1/rules/#{rule.id}", headers: headers

      expect(response).to have_http_status(:ok)
      expect(Rule.find_by(id: rule.id)).to be_nil
      expect(Rule.with_deleted.find(rule.id)).to be_deleted
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
