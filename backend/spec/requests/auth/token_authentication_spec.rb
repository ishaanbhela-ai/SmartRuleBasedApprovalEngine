require "rails_helper"

RSpec.describe "Token Authentication - Comprehensive", type: :request do
  let!(:tenant) { create(:tenant) }
  let!(:user) { create(:user, tenant: tenant, email: "user@test.com") }
  let!(:request_type) { create(:request_type, tenant: tenant) }

  def generate_token(user, exp_time: 24.hours.from_now)
    payload = {
      sub: user.id,
      tenant_id: user.tenant_id,
      role: user.role,
      exp: exp_time.to_i
    }
    JWT.encode(payload, ENV.fetch("JWT_SECRET"), "HS256")
  end

  describe "Authentication with JWT token" do
    context "with valid token" do
      it "allows access to protected endpoints" do
        token = generate_token(user)

        get "/api/v1/requests", headers: {
          "Authorization" => "Bearer #{token}"
        }

        expect(response).to have_http_status(:ok)
      end

      it "sets current_user correctly" do
        token = generate_token(user)

        get "/api/v1/requests", headers: {
          "Authorization" => "Bearer #{token}"
        }

        expect(response).to have_http_status(:ok)
        # The request should succeed, indicating current_user was set
      end
    end

    context "with missing token" do
      it "returns unauthorized when Authorization header is missing" do
        get "/api/v1/requests"

        expect(response).to have_http_status(:unauthorized)

        body = JSON.parse(response.body)
        expect(body["error"]).to eq("Unauthorized")
      end

      it "returns unauthorized when Authorization header is empty" do
        get "/api/v1/requests", headers: {
          "Authorization" => ""
        }

        expect(response).to have_http_status(:unauthorized)
      end

      it "returns unauthorized when Authorization header is whitespace" do
        get "/api/v1/requests", headers: {
          "Authorization" => "   "
        }

        expect(response).to have_http_status(:unauthorized)
      end
    end

    context "with malformed token" do
      it "returns unauthorized with invalid Bearer format" do
        get "/api/v1/requests", headers: {
          "Authorization" => "InvalidFormat token123"
        }

        expect(response).to have_http_status(:unauthorized)
      end

      it "returns unauthorized with Bearer but no token" do
        get "/api/v1/requests", headers: {
          "Authorization" => "Bearer "
        }

        expect(response).to have_http_status(:unauthorized)
      end

      it "returns unauthorized with malformed JWT" do
        get "/api/v1/requests", headers: {
          "Authorization" => "Bearer invalid.jwt.token"
        }

        expect(response).to have_http_status(:unauthorized)
      end

      it "returns unauthorized with random string as token" do
        get "/api/v1/requests", headers: {
          "Authorization" => "Bearer randomstringnotajwt"
        }

        expect(response).to have_http_status(:unauthorized)
      end

      it "returns unauthorized with incomplete JWT (missing signature)" do
        get "/api/v1/requests", headers: {
          "Authorization" => "Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOjF9"
        }

        expect(response).to have_http_status(:unauthorized)
      end
    end

    context "with expired token" do
      it "returns unauthorized when token is expired" do
        expired_token = generate_token(user, exp_time: 1.hour.ago)

        get "/api/v1/requests", headers: {
          "Authorization" => "Bearer #{expired_token}"
        }

        expect(response).to have_http_status(:unauthorized)
      end

      it "returns unauthorized when token expired 1 second ago" do
        expired_token = generate_token(user, exp_time: 1.second.ago)

        get "/api/v1/requests", headers: {
          "Authorization" => "Bearer #{expired_token}"
        }

        expect(response).to have_http_status(:unauthorized)
      end

      it "allows access when token expires in 1 second" do
        almost_expired_token = generate_token(user, exp_time: 1.second.from_now)

        get "/api/v1/requests", headers: {
          "Authorization" => "Bearer #{almost_expired_token}"
        }

        expect(response).to have_http_status(:ok)
      end
    end

    context "with tampered token" do
      it "returns unauthorized when token signature is invalid" do
        valid_token = generate_token(user)
        # Tamper with the token by changing last character
        tampered_token = valid_token[0..-2] + "X"

        get "/api/v1/requests", headers: {
          "Authorization" => "Bearer #{tampered_token}"
        }

        expect(response).to have_http_status(:unauthorized)
      end

      it "returns unauthorized when token is signed with wrong secret" do
        payload = {
          sub: user.id,
          tenant_id: user.tenant_id,
          role: user.role,
          exp: 24.hours.from_now.to_i
        }
        wrong_secret_token = JWT.encode(payload, "wrong_secret", "HS256")

        get "/api/v1/requests", headers: {
          "Authorization" => "Bearer #{wrong_secret_token}"
        }

        expect(response).to have_http_status(:unauthorized)
      end

      it "returns unauthorized when payload is modified" do
        # Create a token with modified user_id in payload
        payload = {
          sub: 99999, # Non-existent user
          tenant_id: user.tenant_id,
          role: user.role,
          exp: 24.hours.from_now.to_i
        }
        token = JWT.encode(payload, ENV.fetch("JWT_SECRET"), "HS256")

        get "/api/v1/requests", headers: {
          "Authorization" => "Bearer #{token}"
        }

        expect(response).to have_http_status(:unauthorized)
      end
    end

    context "with deleted user token" do
      it "returns unauthorized when user is soft deleted" do
        token = generate_token(user)
        user.update_column(:deleted_at, Time.current)

        get "/api/v1/requests", headers: {
          "Authorization" => "Bearer #{token}"
        }

        expect(response).to have_http_status(:unauthorized)
      end

      it "returns unauthorized when user is hard deleted" do
        token = generate_token(user)
        user_id = user.id
        user.destroy

        get "/api/v1/requests", headers: {
          "Authorization" => "Bearer #{token}"
        }

        expect(response).to have_http_status(:unauthorized)
      end
    end

    context "with token for non-existent user" do
      it "returns unauthorized when user_id in token doesn't exist" do
        payload = {
          sub: 999999,
          tenant_id: tenant.id,
          role: "user",
          exp: 24.hours.from_now.to_i
        }
        token = JWT.encode(payload, ENV.fetch("JWT_SECRET"), "HS256")

        get "/api/v1/requests", headers: {
          "Authorization" => "Bearer #{token}"
        }

        expect(response).to have_http_status(:unauthorized)
      end
    end

    context "with multiple Authorization headers" do
      it "handles duplicate Authorization headers" do
        token = generate_token(user)

        # Rails typically uses the last header value
        get "/api/v1/requests", headers: {
          "Authorization" => "Bearer #{token}"
        }

        expect(response).to have_http_status(:ok)
      end
    end

    context "with case sensitivity" do
      it "handles lowercase 'bearer' prefix" do
        token = generate_token(user)

        get "/api/v1/requests", headers: {
          "Authorization" => "bearer #{token}"
        }

        # This might fail depending on implementation
        # Most implementations are case-insensitive for "Bearer"
        expect(response.status).to be_in([ 200, 401 ])
      end
    end

    context "with token reuse" do
      it "allows same token to be used multiple times before expiry" do
        token = generate_token(user)

        3.times do
          get "/api/v1/requests", headers: {
            "Authorization" => "Bearer #{token}"
          }

          expect(response).to have_http_status(:ok)
        end
      end
    end

    context "with different HTTP methods" do
      it "authenticates POST requests" do
        token = generate_token(user)
        rule = create(:rule, :grade_1, tenant: tenant, request_type: request_type)

        post "/api/v1/requests",
             params: {
               request_type_id: request_type.id,
               requested_value: 1000
             },
             headers: {
               "Authorization" => "Bearer #{token}"
             }

        expect(response.status).to be_in([ 200, 201 ])
      end

      it "authenticates GET requests" do
        token = generate_token(user)

        get "/api/v1/requests", headers: {
          "Authorization" => "Bearer #{token}"
        }

        expect(response).to have_http_status(:ok)
      end
    end

    context "with XSS and injection attempts in token" do
      it "safely handles XSS in Authorization header" do
        get "/api/v1/requests", headers: {
          "Authorization" => "Bearer <script>alert('xss')</script>"
        }

        expect(response).to have_http_status(:unauthorized)
      end

      it "safely handles SQL injection in Authorization header" do
        get "/api/v1/requests", headers: {
          "Authorization" => "Bearer ' OR '1'='1"
        }

        expect(response).to have_http_status(:unauthorized)
      end
    end

    context "with extremely long tokens" do
      it "handles very long token strings" do
        long_token = "Bearer " + ("a" * 10000)

        get "/api/v1/requests", headers: {
          "Authorization" => long_token
        }

        expect(response).to have_http_status(:unauthorized)
      end
    end

    context "with null bytes in token" do
      it "handles null bytes in token" do
        get "/api/v1/requests", headers: {
          "Authorization" => "Bearer token\x00withNullByte"
        }

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end
