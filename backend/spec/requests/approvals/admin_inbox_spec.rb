require "rails_helper"

RSpec.describe "Approver Inbox Admin Visibility", type: :request do
  let(:tenant) { create(:tenant) }
  let(:admin) { create(:user, :admin, tenant: tenant) }
  # Standard approvers
  let(:approver1) { create(:user, :approver, tenant: tenant) }
  let(:approver2) { create(:user, :approver, tenant: tenant) }

  # Request types
  let(:expense_type) { create(:request_type, tenant: tenant, name: "expense") }
  let(:leave_type) { create(:request_type, tenant: tenant, name: "leave") }

  # Assign approvers (though admin needs none)
  before do
    create(:request_type_approver, request_type: expense_type, user: approver1)
    create(:request_type_approver, request_type: leave_type, user: approver2)
  end

  # Pending requests for different types
  # Rules needed for QuotaCalculator in serializer
  let!(:expense_rule) { create(:rule, tenant: tenant, request_type: expense_type, grade: 1, definition: 10_000) }
  let!(:leave_rule) { create(:rule, tenant: tenant, request_type: leave_type, grade: 1, definition: 10) }

  # Pending requests for different types
  let!(:expense_req) { create(:request, tenant: tenant, request_type: expense_type, status: "pending_approval", requester: create(:user, tenant: tenant, grade: 1)) }
  let!(:leave_req) { create(:request, tenant: tenant, request_type: leave_type, status: "pending_approval", requester: create(:user, tenant: tenant, grade: 1)) }
  let!(:other_tenant_req) { create(:request, tenant: create(:tenant), status: "pending_approval") }
  let!(:approved_req) { create(:request, tenant: tenant, status: "approved") }

  let(:token) { generate_token(admin) }
  let(:headers) { { "Authorization" => "Bearer #{token}" } }

  describe "GET /api/v1/approver/requests" do
    it "shows ALL pending requests to admins regardless of assignment" do
      get "/api/v1/approver/requests", headers: headers

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      ids = body["data"].map { |r| r["id"] }

      # Should see both pending requests
      expect(ids).to include(expense_req.id)
      expect(ids).to include(leave_req.id)

      # Should NOT see approved requests
      expect(ids).not_to include(approved_req.id)

      # Should NOT see other tenant's requests
      expect(ids).not_to include(other_tenant_req.id)

      expect(body["data"].size).to eq(2)
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
