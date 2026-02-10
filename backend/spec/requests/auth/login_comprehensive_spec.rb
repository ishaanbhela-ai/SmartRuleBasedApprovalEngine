require "rails_helper"

RSpec.describe "Auth Login - Comprehensive", type: :request do
  let!(:tenant) { create(:tenant) }
  let!(:user) { create(:user, :admin, tenant: tenant, email: "admin@test.com", password: "SecurePass123") }

  describe "POST /api/v1/login" do
    context "with valid credentials" do
      it "returns jwt token and user data" do
        post "/api/v1/login", params: {
          email: "admin@test.com",
          password: "SecurePass123"
        }

        expect(response).to have_http_status(:ok)

        body = JSON.parse(response.body)

        expect(body["token"]).to be_present
        expect(body["user"]["email"]).to eq("admin@test.com")
        expect(body["user"]["role"]).to eq("admin")
      end

      it "returns a valid JWT token that can be decoded" do
        post "/api/v1/login", params: {
          email: "admin@test.com",
          password: "SecurePass123"
        }

        body = JSON.parse(response.body)
        token = body["token"]

        decoded = JWT.decode(token, ENV.fetch("JWT_SECRET"), true, algorithm: "HS256").first

        expect(decoded["sub"]).to eq(user.id)
        expect(decoded["tenant_id"]).to eq(user.tenant_id)
        expect(decoded["role"]).to eq(user.role)
        expect(decoded["exp"]).to be > Time.now.to_i
      end
    end

    context "with invalid credentials" do
      it "returns unauthorized with wrong password" do
        post "/api/v1/login", params: {
          email: "admin@test.com",
          password: "WrongPassword"
        }

        expect(response).to have_http_status(:unauthorized)

        body = JSON.parse(response.body)
        expect(body["error"]).to eq("Invalid email or password")
      end

      it "returns unauthorized with non-existent email" do
        post "/api/v1/login", params: {
          email: "notfound@test.com",
          password: "SecurePass123"
        }

        expect(response).to have_http_status(:unauthorized)

        body = JSON.parse(response.body)
        expect(body["error"]).to eq("Invalid email or password")
      end

      it "returns unauthorized with case-sensitive email mismatch" do
        post "/api/v1/login", params: {
          email: "ADMIN@TEST.COM",
          password: "SecurePass123"
        }

        expect(response).to have_http_status(:unauthorized)
      end
    end

    context "with missing parameters" do
      it "returns unauthorized when email is missing" do
        post "/api/v1/login", params: {
          password: "SecurePass123"
        }

        expect(response).to have_http_status(:unauthorized)

        body = JSON.parse(response.body)
        expect(body["error"]).to eq("Invalid email or password")
      end

      it "returns unauthorized when password is missing" do
        post "/api/v1/login", params: {
          email: "admin@test.com"
        }

        expect(response).to have_http_status(:unauthorized)

        body = JSON.parse(response.body)
        expect(body["error"]).to eq("Invalid email or password")
      end

      it "returns unauthorized when both email and password are missing" do
        post "/api/v1/login", params: {}

        expect(response).to have_http_status(:unauthorized)

        body = JSON.parse(response.body)
        expect(body["error"]).to eq("Invalid email or password")
      end
    end

    context "with blank parameters" do
      it "returns unauthorized when email is blank" do
        post "/api/v1/login", params: {
          email: "",
          password: "SecurePass123"
        }

        expect(response).to have_http_status(:unauthorized)

        body = JSON.parse(response.body)
        expect(body["error"]).to eq("Invalid email or password")
      end

      it "returns unauthorized when password is blank" do
        post "/api/v1/login", params: {
          email: "admin@test.com",
          password: ""
        }

        expect(response).to have_http_status(:unauthorized)

        body = JSON.parse(response.body)
        expect(body["error"]).to eq("Invalid email or password")
      end

      it "returns unauthorized when both are blank" do
        post "/api/v1/login", params: {
          email: "",
          password: ""
        }

        expect(response).to have_http_status(:unauthorized)

        body = JSON.parse(response.body)
        expect(body["error"]).to eq("Invalid email or password")
      end

      it "returns unauthorized when email is whitespace only" do
        post "/api/v1/login", params: {
          email: "   ",
          password: "SecurePass123"
        }

        expect(response).to have_http_status(:unauthorized)
      end
    end

    context "with soft deleted user" do
      let!(:deleted_user) do
        create(:user, tenant: tenant, email: "deleted@test.com", password: "SecurePass123").tap do |u|
          u.update_column(:deleted_at, Time.current)
        end
      end

      it "returns unauthorized when trying to login as soft deleted user" do
        post "/api/v1/login", params: {
          email: "deleted@test.com",
          password: "SecurePass123"
        }

        expect(response).to have_http_status(:unauthorized)

        body = JSON.parse(response.body)
        expect(body["error"]).to eq("Invalid email or password")
      end

      it "does not expose that the user exists but is deleted" do
        post "/api/v1/login", params: {
          email: "deleted@test.com",
          password: "SecurePass123"
        }

        body = JSON.parse(response.body)
        # Should return same error as non-existent user
        expect(body["error"]).to eq("Invalid email or password")
      end
    end

    context "with SQL injection attempts" do
      it "safely handles SQL injection in email" do
        post "/api/v1/login", params: {
          email: "admin@test.com' OR '1'='1",
          password: "SecurePass123"
        }

        expect(response).to have_http_status(:unauthorized)
      end

      it "safely handles SQL injection in password" do
        post "/api/v1/login", params: {
          email: "admin@test.com",
          password: "' OR '1'='1"
        }

        expect(response).to have_http_status(:unauthorized)
      end
    end

    context "with special characters" do
      let!(:special_user) do
        create(:user, tenant: tenant, email: "user+test@example.com", password: 'P@ssw0rd!Special')
      end

      it "handles email with special characters" do
        post "/api/v1/login", params: {
          email: "user+test@example.com",
          password: 'P@ssw0rd!Special'
        }

        expect(response).to have_http_status(:ok)
      end

      it "handles password with special characters" do
        post "/api/v1/login", params: {
          email: "user+test@example.com",
          password: 'P@ssw0rd!Special'
        }

        body = JSON.parse(response.body)
        expect(body["token"]).to be_present
      end
    end

    context "with rate limiting concerns" do
      it "allows multiple failed login attempts (no rate limiting implemented)" do
        5.times do
          post "/api/v1/login", params: {
            email: "admin@test.com",
            password: "WrongPassword"
          }

          expect(response).to have_http_status(:unauthorized)
        end
      end
    end

    context "with different user roles" do
      let!(:approver_user) { create(:user, :approver, tenant: tenant, email: "approver@test.com", password: "ApproverPass") }
      let!(:regular_user) { create(:user, tenant: tenant, email: "user@test.com", password: "UserPass") }

      it "allows admin login" do
        post "/api/v1/login", params: {
          email: "admin@test.com",
          password: "SecurePass123"
        }

        expect(response).to have_http_status(:ok)
        body = JSON.parse(response.body)
        expect(body["user"]["role"]).to eq("admin")
      end

      it "allows approver login" do
        post "/api/v1/login", params: {
          email: "approver@test.com",
          password: "ApproverPass"
        }

        expect(response).to have_http_status(:ok)
        body = JSON.parse(response.body)
        expect(body["user"]["role"]).to eq("approver")
      end

      it "allows regular user login" do
        post "/api/v1/login", params: {
          email: "user@test.com",
          password: "UserPass"
        }

        expect(response).to have_http_status(:ok)
        body = JSON.parse(response.body)
        expect(body["user"]["role"]).to eq("user")
      end
    end

    context "with malformed requests" do
      it "handles nil params gracefully" do
        post "/api/v1/login"

        expect(response).to have_http_status(:unauthorized)
      end

      it "handles extra unexpected parameters" do
        post "/api/v1/login", params: {
          email: "admin@test.com",
          password: "SecurePass123",
          extra_param: "malicious_value",
          another_param: "test"
        }

        expect(response).to have_http_status(:ok)
        # Should still work, ignoring extra params
      end
    end

    context "token expiry validation" do
      it "generates token with future expiry time" do
        post "/api/v1/login", params: {
          email: "admin@test.com",
          password: "SecurePass123"
        }

        body = JSON.parse(response.body)
        token = body["token"]

        decoded = JWT.decode(token, ENV.fetch("JWT_SECRET"), true, algorithm: "HS256").first

        # Token should expire in the future
        expect(decoded["exp"]).to be > Time.now.to_i
        # Token should expire within expected timeframe (e.g., 24 hours)
        expect(decoded["exp"]).to be <= (Time.now + 25.hours).to_i
      end
    end

    context "with concurrent login attempts" do
      it "handles multiple simultaneous logins for same user" do
        threads = 3.times.map do
          Thread.new do
            post "/api/v1/login", params: {
              email: "admin@test.com",
              password: "SecurePass123"
            }
            response.status
          end
        end

        results = threads.map(&:value)
        expect(results).to all(eq(200))
      end
    end
  end
end
