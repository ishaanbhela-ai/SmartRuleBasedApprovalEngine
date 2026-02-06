require "rails_helper"

RSpec.describe "Request Creation", type: :request do
  let!(:tenant) { create(:tenant) }
  let!(:user) { create(:user, tenant: tenant) }
  let!(:request_type) { create(:request_type, tenant: tenant) }
  let!(:rule) { create(:rule, :grade_1, tenant: tenant, request_type: request_type) }

  let(:token) do
    payload = {
      sub: user.id,
      tenant_id: user.tenant_id,
      role: user.role,
      exp: 24.hours.from_now.to_i
    }
    JWT.encode(payload, ENV.fetch("JWT_SECRET"), "HS256")
  end

  let(:headers) do
    {
      "Authorization" => "Bearer #{token}"
    }
  end

  describe "POST /api/v1/requests" do
    context "when within quota" do
      it "auto approves the request" do
        post "/api/v1/requests",
             params: {
               request_type_id: request_type.id,
               requested_value: 2_000
             },
             headers: headers

        expect(response).to have_http_status(:created)

        body = JSON.parse(response.body)

        expect(body["data"]["status"]).to eq("auto_approved")

        request = Request.last

        approval = Approval.find_by(request: request)

        expect(approval).to be_present
        expect(approval.action).to eq("approved")
      end
    end

    context "when exceeding quota" do
      it "routes to pending approval" do
        post "/api/v1/requests",
             params: {
               request_type_id: request_type.id,
               requested_value: 20_000
             },
             headers: headers

        expect(response).to have_http_status(:created)

        body = JSON.parse(response.body)

        expect(body["data"]["status"]).to eq("pending_approval")

        approval = Approval.find_by(request: Request.last)

        expect(approval).to be_nil
      end
    end

    context "without auth token" do
      it "returns unauthorized" do
        post "/api/v1/requests",
             params: {
               request_type_id: request_type.id,
               requested_value: 1_000
             }

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end
