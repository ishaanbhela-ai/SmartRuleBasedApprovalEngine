require "rails_helper"

RSpec.describe "Users Pagination", type: :request do
  let!(:tenant) { create(:tenant) }

  let!(:admin) { create(:user, :admin, tenant: tenant, email: "admin@test.com") }

  let(:token) do
    payload = {
      sub: admin.id,
      tenant_id: admin.tenant_id,
      role: admin.role,
      exp: 24.hours.from_now.to_i
    }
    JWT.encode(payload, ENV.fetch("JWT_SECRET"), "HS256")
  end

  let(:headers) do
    { "Authorization" => "Bearer #{token}" }
  end

  before do
    # Create 25 users
    25.times do |i|
      create(:user, tenant: tenant, name: "User #{i}", email: "user#{i}@test.com")
    end
  end

  describe "GET /api/v1/users" do
    it "returns default paginated response" do
      get "/api/v1/users", headers: headers

      expect(response).to have_http_status(:ok)

      body = JSON.parse(response.body)

      expect(body["data"].size).to eq(10) # default per_page

      expect(body["meta"]).to include(
        "page",
        "per_page",
        "total_pages",
        "total_count"
      )
    end

    it "respects custom per_page" do
      get "/api/v1/users?per_page=5", headers: headers

      body = JSON.parse(response.body)

      expect(body["data"].size).to eq(5)
      expect(body["meta"]["per_page"]).to eq(5)
    end

    it "returns second page correctly" do
      get "/api/v1/users?page=2&per_page=10", headers: headers

      body = JSON.parse(response.body)

      expect(body["data"].size).to eq(10)
      expect(body["meta"]["page"]).to eq(2)
    end

    it "calculates total pages correctly" do
      get "/api/v1/users?per_page=10", headers: headers

      body = JSON.parse(response.body)

      expect(body["meta"]["total_pages"]).to eq(3)
      expect(body["meta"]["total_count"]).to eq(26)
    end
  end
end
