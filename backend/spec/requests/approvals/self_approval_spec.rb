require "rails_helper"

RSpec.describe "Self Approval Prevention", type: :request do
  let!(:tenant) { create(:tenant) }

  let!(:approver) { create(:user, :approver, tenant: tenant, email: "approver@test.com") }

  let!(:request_type) { create(:request_type, tenant: tenant) }

  before do
    create(:request_type_approver, request_type: request_type, user: approver)
  end

  let!(:rule) { create(:rule, :grade_2, tenant: tenant, request_type: request_type, definition: 1_000) }

  let!(:self_request) { create(:request, tenant: tenant, requester: approver, request_type: request_type, requested_value: 5_000, status: "pending_approval") }

  let(:token) do
    payload = {
      sub: approver.id,
      tenant_id: approver.tenant_id,
      role: approver.role,
      exp: 24.hours.from_now.to_i
    }
    JWT.encode(payload, ENV.fetch("JWT_SECRET"), "HS256")
  end
  let(:headers) do
    {
      "Authorization" => "Bearer #{token}"
    }
  end

  it "prevents approver from approving own request" do
    patch "/api/v1/approver/requests/#{self_request.id}",
          params: {
            action_type: "approved",
            reason: "Self approval attempt"
          },
          headers: headers

    expect(response).to have_http_status(:unprocessable_entity)

    body = JSON.parse(response.body)

    expect(body["error"]).to eq("Self approval not allowed")

    self_request.reload
    expect(self_request.status).to eq("pending_approval")
  end
end
