require "rails_helper"

RSpec.describe "Approver Inbox Visibility", type: :request do
  let!(:tenant) { create(:tenant) }

  let!(:approver) do
    create(:user,
      :approver,
      tenant: tenant,
      name: "Approver",
      email: "approver@test.com")
  end

  let!(:other_approver) do
    create(:user,
      :approver,
      tenant: tenant,
      name: "Other Approver",
      email: "other@test.com")
  end

  let!(:employee) do
    create(:user,
      tenant: tenant,
      name: "Employee",
      email: "employee@test.com",
      role: "user",
      grade: 1)
  end

  let!(:expense_type) do
    create(:request_type, tenant: tenant, name: "expense")
  end

  let!(:leave_type) do
    create(:request_type, tenant: tenant, name: "leave")
  end

  let!(:expense_rule) do
    create(:rule,
      tenant: tenant,
      request_type: expense_type,
      grade: 1,
      definition: 10_000)
  end

  let!(:leave_rule) do
    create(:rule,
      tenant: tenant,
      request_type: leave_type,
      grade: 1,
      definition: 10)
  end

  before do
    # Assign approver only to expense
    create(:request_type_approver,
      request_type: expense_type,
      user: approver)
  end

  let!(:expense_request) do
    create(:request,
      tenant: tenant,
      requester: employee,
      request_type: expense_type,
      requested_value: 5_000,
      status: "pending_approval")
  end

  let!(:leave_request) do
    create(:request,
      tenant: tenant,
      requester: employee,
      request_type: leave_type,
      requested_value: 5,
      status: "pending_approval")
  end

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

  it "shows only assigned request type requests" do
    get "/api/v1/approver/requests",
        headers: headers

    expect(response).to have_http_status(:ok)

    body = JSON.parse(response.body)

    expect(body["data"].size).to eq(1)
    expect(body["data"][0]["id"]).to eq(expense_request.id)
  end
end
