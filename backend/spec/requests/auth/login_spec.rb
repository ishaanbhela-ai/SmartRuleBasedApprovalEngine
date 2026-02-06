require "rails_helper"

RSpec.describe "Auth Login", type: :request do
  let!(:tenant) { create(:tenant) }
  let!(:user) { create(:user, :admin, tenant: tenant, email: "admin@test.com") }

  describe "POST /api/v1/login" do
    context "with valid credentials" do
      it "returns jwt token and user data" do
        post "/api/v1/login", params: {
          email: "admin@test.com",
          password: "password123"
        }

        expect(response).to have_http_status(:ok)

        body = JSON.parse(response.body)

        expect(body["token"]).to be_present
        expect(body["user"]["email"]).to eq("admin@test.com")
      end
    end

    context "with invalid password" do
      it "returns unauthorized error" do
        post "/api/v1/login", params: {
          email: "admin@test.com",
          password: "wrongpassword"
        }

        expect(response).to have_http_status(:unauthorized)

        body = JSON.parse(response.body)

        expect(body["error"]).to eq("Invalid email or password")
      end
    end

    context "with non-existent email" do
      it "returns unauthorized error" do
        post "/api/v1/login", params: {
          email: "notfound@test.com",
          password: "password123"
        }

        expect(response).to have_http_status(:unauthorized)

        body = JSON.parse(response.body)

        expect(body["error"]).to eq("Invalid email or password")
      end
    end
  end
end
