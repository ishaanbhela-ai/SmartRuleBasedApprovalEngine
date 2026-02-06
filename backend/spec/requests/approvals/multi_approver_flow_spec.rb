require "rails_helper"

RSpec.describe "Multi Approver Flow", type: :request do
  let!(:tenant) { create(:tenant) }
  let!(:user) { create(:user, tenant: tenant, email: "employee@test.com") }
  let!(:approver1) { create(:user, :approver, tenant: tenant, name: "Approver One", email: "approver1@test.com") }
  let!(:approver2) { create(:user, :approver, tenant: tenant, name: "Approver Two", email: "approver2@test.com") }
  let!(:request_type) { create(:request_type, tenant: tenant) }
  let!(:rule) { create(:rule, :grade_1, tenant: tenant, request_type: request_type, definition: 1_000) }

  before do
    create(:request_type_approver, request_type: request_type, user: approver1)
    create(:request_type_approver, request_type: request_type, user: approver2)
  end

  let(:user_token) do
    payload = {
      sub: user.id,
      tenant_id: user.tenant_id,
      role: user.role,
      exp: 24.hours.from_now.to_i
    }
    JWT.encode(payload, ENV.fetch("JWT_SECRET"), "HS256")
  end

  let(:approver1_token) do
    payload = {
      sub: approver1.id,
      tenant_id: approver1.tenant_id,
      role: approver1.role,
      exp: 24.hours.from_now.to_i
    }
    JWT.encode(payload, ENV.fetch("JWT_SECRET"), "HS256")
  end

  let(:approver2_token) do
    payload = {
      sub: approver2.id,
      tenant_id: approver2.tenant_id,
      role: approver2.role,
      exp: 24.hours.from_now.to_i
    }
    JWT.encode(payload, ENV.fetch("JWT_SECRET"), "HS256")
  end

  describe "approval workflow" do
    it "allows first approver to approve and blocks second" do
      # User submits over-limit request
      post "/api/v1/requests",
           params: {
             request_type_id: request_type.id,
             requested_value: 5_000
           },
           headers: { "Authorization" => "Bearer #{user_token}" }

      request_record = Request.last

      expect(request_record.status).to eq("pending_approval")

      # Both approvers see request
      get "/api/v1/approver/requests",
          headers: { "Authorization" => "Bearer #{approver1_token}" }

      body1 = JSON.parse(response.body)
      expect(body1["data"].size).to eq(1)

      get "/api/v1/approver/requests",
          headers: { "Authorization" => "Bearer #{approver2_token}" }

      body2 = JSON.parse(response.body)
      expect(body2["data"].size).to eq(1)

      # First approver approves
      patch "/api/v1/approver/requests/#{request_record.id}",
            params: {
              action_type: "approved",
              reason: "Looks valid"
            },
            headers: { "Authorization" => "Bearer #{approver1_token}" }

      expect(response).to have_http_status(:ok)

      request_record.reload
      expect(request_record.status).to eq("approved")

      # Second approver can no longer see it
      get "/api/v1/approver/requests",
          headers: { "Authorization" => "Bearer #{approver2_token}" }

      body3 = JSON.parse(response.body)
      expect(body3["data"].size).to eq(0)
    end
  end
end
