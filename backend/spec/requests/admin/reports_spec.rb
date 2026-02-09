require "rails_helper"

RSpec.describe "Admin Reports API", type: :request do
  let(:tenant) { create(:tenant) }
  let(:admin) { create(:user, :admin, tenant: tenant) }
  let(:user) { create(:user, tenant: tenant) }
  let(:token) { generate_token(admin) }
  let(:headers) { { "Authorization" => "Bearer #{token}" } }

  describe "GET /api/v1/admin/reports/summary" do
    context "when authenticated as admin" do
      before do
        # Setup data
        expense_type = create(:request_type, tenant: tenant, name: "expense")
        leave_type = create(:request_type, tenant: tenant, name: "leave")

        create(:request, tenant: tenant, request_type: expense_type, status: "approved")
        create(:request, tenant: tenant, request_type: expense_type, status: "pending_approval")
        create(:request, tenant: tenant, request_type: leave_type, status: "rejected")

        # Create approval records for decision breakdown
        rule = create(:rule, tenant: tenant, request_type: expense_type, grade: 1, definition: 1000)
        req = create(:request, tenant: tenant, request_type: expense_type)
        create(:approval, request: req, tenant: tenant, action: "approved", rule: rule)

        # Data from other tenant
        other_tenant = create(:tenant)
        create(:request, tenant: other_tenant)
      end

      it "returns the summary report" do
        get "/api/v1/admin/reports/summary", headers: headers

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)

        expect(json.keys).to contain_exactly(
          "total_requests",
          "status_breakdown",
          "request_type_breakdown",
          "decision_breakdown",
          "total_rules"
        )

        expect(json["total_requests"]).to eq(4) # 3 from setup + 1 associated with approval
        expect(json["status_breakdown"]["approved"]).to eq(1)
        expect(json["status_breakdown"]["pending_approval"]).to eq(1)
        expect(json["status_breakdown"]["rejected"]).to eq(1)
        expect(json["status_breakdown"]["submitted"]).to eq(1)

        expect(json["request_type_breakdown"]["expense"]).to eq(3)
        expect(json["request_type_breakdown"]["leave"]).to eq(1)

        expect(json["decision_breakdown"]["approved"]).to eq(1)

        expect(json["total_rules"]).to eq(1)
      end
    end

    context "when authenticated as non-admin" do
      let(:token) { generate_token(user) }

      it "returns forbidden" do
        get "/api/v1/admin/reports/summary", headers: headers
        expect(response).to have_http_status(:forbidden)
      end
    end

    context "when unauthenticated" do
      it "returns unauthorized" do
        get "/api/v1/admin/reports/summary"
        expect(response).to have_http_status(:unauthorized)
      end
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
