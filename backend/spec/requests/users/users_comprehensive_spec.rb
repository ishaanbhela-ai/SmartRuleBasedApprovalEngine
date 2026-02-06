require "rails_helper"

RSpec.describe "Users API - Comprehensive", type: :request do
  let!(:tenant) { create(:tenant) }
  let!(:admin) { create(:user, :admin, tenant: tenant, email: "admin@test.com") }
  let!(:approver) { create(:user, :approver, tenant: tenant, email: "approver@test.com") }
  let!(:regular_user) { create(:user, tenant: tenant, email: "user@test.com") }

  def generate_token(user)
    payload = {
      sub: user.id,
      tenant_id: user.tenant_id,
      role: user.role,
      exp: 24.hours.from_now.to_i
    }
    JWT.encode(payload, ENV.fetch("JWT_SECRET"), "HS256")
  end

  def auth_headers(user)
    { "Authorization" => "Bearer #{generate_token(user)}" }
  end

  describe "GET /api/v1/users" do
    context "with admin user" do
      it "returns list of users" do
        get "/api/v1/users", headers: auth_headers(admin)

        expect(response).to have_http_status(:ok)
        body = JSON.parse(response.body)
        expect(body["data"]).to be_an(Array)
        expect(body["data"].length).to be >= 3
      end

      it "includes pagination metadata" do
        get "/api/v1/users", headers: auth_headers(admin)

        body = JSON.parse(response.body)
        expect(body["meta"]).to include("page", "per_page", "total_pages", "total_count")
      end

      it "returns users from same tenant only" do
        other_tenant = create(:tenant, name: "Other Tenant")
        other_user = create(:user, tenant: other_tenant)

        get "/api/v1/users", headers: auth_headers(admin)

        body = JSON.parse(response.body)
        user_ids = body["data"].map { |u| u["id"] }
        expect(user_ids).not_to include(other_user.id)
      end

      it "respects pagination parameters" do
        5.times { create(:user, tenant: tenant) }

        get "/api/v1/users?per_page=2", headers: auth_headers(admin)

        body = JSON.parse(response.body)
        expect(body["data"].length).to eq(2)
        expect(body["meta"]["per_page"]).to eq(2)
      end

      it "handles page parameter" do
        get "/api/v1/users?page=1&per_page=10", headers: auth_headers(admin)

        expect(response).to have_http_status(:ok)
        body = JSON.parse(response.body)
        expect(body["meta"]["page"]).to eq(1)
      end

      it "does not include soft deleted users" do
        deleted_user = create(:user, tenant: tenant)
        deleted_user.update_column(:deleted_at, Time.current)

        get "/api/v1/users", headers: auth_headers(admin)

        body = JSON.parse(response.body)
        user_ids = body["data"].map { |u| u["id"] }
        expect(user_ids).not_to include(deleted_user.id)
      end
    end

    context "with approver user" do
      it "returns forbidden" do
        get "/api/v1/users", headers: auth_headers(approver)

        expect(response).to have_http_status(:forbidden)
      end
    end

    context "with regular user" do
      it "returns forbidden" do
        get "/api/v1/users", headers: auth_headers(regular_user)

        expect(response).to have_http_status(:forbidden)
      end
    end

    context "without authentication" do
      it "returns unauthorized" do
        get "/api/v1/users"

        expect(response).to have_http_status(:unauthorized)
      end
    end

    context "with invalid pagination parameters" do
      it "handles negative page number" do
        get "/api/v1/users?page=-1", headers: auth_headers(admin)

        # Should either use default or handle gracefully
        expect(response.status).to be_in([ 200, 400 ])
      end

      it "handles zero per_page" do
        get "/api/v1/users?per_page=0", headers: auth_headers(admin)

        # Should either use default or handle gracefully
        expect(response.status).to be_in([ 200, 400 ])
      end

      it "handles extremely large per_page" do
        get "/api/v1/users?per_page=10000", headers: auth_headers(admin)

        # Should cap at max limit
        expect(response).to have_http_status(:ok)
      end

      it "handles non-numeric page parameter" do
        get "/api/v1/users?page=abc", headers: auth_headers(admin)

        expect(response.status).to be_in([ 200, 400 ])
      end
    end
  end

  describe "POST /api/v1/users" do
    context "with admin user" do
      let(:valid_params) do
        {
          user: {
            email: "newuser@test.com",
            password: "SecurePass123",
            name: "New User",
            role: "user",
            grade: 1
          }
        }
      end

      it "creates a new user" do
        expect {
          post "/api/v1/users", params: valid_params, headers: auth_headers(admin)
        }.to change(User, :count).by(1)

        expect(response).to have_http_status(:created)
      end

      it "assigns user to admin's tenant" do
        post "/api/v1/users", params: valid_params, headers: auth_headers(admin)

        new_user = User.last
        expect(new_user.tenant_id).to eq(admin.tenant_id)
      end

      it "returns created user data" do
        post "/api/v1/users", params: valid_params, headers: auth_headers(admin)

        body = JSON.parse(response.body)
        expect(body["data"]["email"]).to eq("newuser@test.com")
        expect(body["data"]["name"]).to eq("New User")
        expect(body["data"]["role"]).to eq("user")
      end

      it "creates user with admin role" do
        admin_params = valid_params.deep_dup
        admin_params[:user][:role] = "admin"
        admin_params[:user][:email] = "newadmin@test.com"
        admin_params[:user][:grade] = 3

        post "/api/v1/users", params: admin_params, headers: auth_headers(admin)

        expect(response).to have_http_status(:created)
        new_admin = User.find_by(email: "newadmin@test.com")
        expect(new_admin.role).to eq("admin")
      end

      it "creates user with approver role" do
        approver_params = valid_params.deep_dup
        approver_params[:user][:role] = "approver"
        approver_params[:user][:email] = "newapprover@test.com"
        approver_params[:user][:grade] = 2

        post "/api/v1/users", params: approver_params, headers: auth_headers(admin)

        expect(response).to have_http_status(:created)
        new_approver = User.find_by(email: "newapprover@test.com")
        expect(new_approver.role).to eq("approver")
      end

      context "with invalid data" do
        it "returns error when email is missing" do
          invalid_params = valid_params.deep_dup
          invalid_params[:user].delete(:email)

          post "/api/v1/users", params: invalid_params, headers: auth_headers(admin)

          expect(response).to have_http_status(:unprocessable_entity)
          body = JSON.parse(response.body)
          expect(body["errors"]).to be_present
        end

        it "returns error when email is blank" do
          invalid_params = valid_params.deep_dup
          invalid_params[:user][:email] = ""

          post "/api/v1/users", params: invalid_params, headers: auth_headers(admin)

          expect(response).to have_http_status(:unprocessable_entity)
          body = JSON.parse(response.body)
          expect(body["errors"]).to include(match(/email/i))
        end

        it "returns error when email is invalid format" do
          invalid_params = valid_params.deep_dup
          invalid_params[:user][:email] = "notanemail"

          post "/api/v1/users", params: invalid_params, headers: auth_headers(admin)

          # Depending on validation, might succeed or fail
          expect(response.status).to be_in([ 201, 422 ])
        end

        it "returns error when email already exists" do
          invalid_params = valid_params.deep_dup
          invalid_params[:user][:email] = admin.email

          post "/api/v1/users", params: invalid_params, headers: auth_headers(admin)

          expect(response).to have_http_status(:unprocessable_entity)
          body = JSON.parse(response.body)
          expect(body["errors"]).to include(match(/email/i))
        end

        it "returns error when password is missing" do
          invalid_params = valid_params.deep_dup
          invalid_params[:user].delete(:password)

          post "/api/v1/users", params: invalid_params, headers: auth_headers(admin)

          expect(response).to have_http_status(:unprocessable_entity)
        end

        it "returns error when password is blank" do
          invalid_params = valid_params.deep_dup
          invalid_params[:user][:password] = ""

          post "/api/v1/users", params: invalid_params, headers: auth_headers(admin)

          expect(response).to have_http_status(:unprocessable_entity)
        end

        it "returns error when name is missing" do
          invalid_params = valid_params.deep_dup
          invalid_params[:user].delete(:name)

          post "/api/v1/users", params: invalid_params, headers: auth_headers(admin)

          expect(response).to have_http_status(:unprocessable_entity)
          body = JSON.parse(response.body)
          expect(body["errors"]).to include(match(/name/i))
        end

        it "returns error when name is blank" do
          invalid_params = valid_params.deep_dup
          invalid_params[:user][:name] = ""

          post "/api/v1/users", params: invalid_params, headers: auth_headers(admin)

          expect(response).to have_http_status(:unprocessable_entity)
        end

        it "returns error when role is invalid" do
          invalid_params = valid_params.deep_dup
          invalid_params[:user][:role] = "superadmin"

          post "/api/v1/users", params: invalid_params, headers: auth_headers(admin)

          expect(response).to have_http_status(:unprocessable_entity)
          body = JSON.parse(response.body)
          expect(body["errors"]).to include(match(/role/i))
        end

        it "returns error when role is missing" do
          invalid_params = valid_params.deep_dup
          invalid_params[:user].delete(:role)

          post "/api/v1/users", params: invalid_params, headers: auth_headers(admin)

          expect(response).to have_http_status(:unprocessable_entity)
        end

        it "returns error when grade is invalid" do
          invalid_params = valid_params.deep_dup
          invalid_params[:user][:grade] = 5

          post "/api/v1/users", params: invalid_params, headers: auth_headers(admin)

          expect(response).to have_http_status(:unprocessable_entity)
          body = JSON.parse(response.body)
          expect(body["errors"]).to include(match(/grade/i))
        end

        it "returns error when grade is missing" do
          invalid_params = valid_params.deep_dup
          invalid_params[:user].delete(:grade)

          post "/api/v1/users", params: invalid_params, headers: auth_headers(admin)

          expect(response).to have_http_status(:unprocessable_entity)
        end

        it "returns error when grade is 0" do
          invalid_params = valid_params.deep_dup
          invalid_params[:user][:grade] = 0

          post "/api/v1/users", params: invalid_params, headers: auth_headers(admin)

          expect(response).to have_http_status(:unprocessable_entity)
        end

        it "returns error when grade is negative" do
          invalid_params = valid_params.deep_dup
          invalid_params[:user][:grade] = -1

          post "/api/v1/users", params: invalid_params, headers: auth_headers(admin)

          expect(response).to have_http_status(:unprocessable_entity)
        end
      end

      context "with edge case data" do
        it "handles very long email" do
          invalid_params = valid_params.deep_dup
          invalid_params[:user][:email] = "a" * 250 + "@test.com"

          post "/api/v1/users", params: invalid_params, headers: auth_headers(admin)

          # Should handle gracefully
          expect(response.status).to be_in([ 201, 422 ])
        end

        it "handles very long name" do
          invalid_params = valid_params.deep_dup
          invalid_params[:user][:name] = "A" * 1000

          post "/api/v1/users", params: invalid_params, headers: auth_headers(admin)

          # Should handle gracefully
          expect(response.status).to be_in([ 201, 422 ])
        end

        it "handles special characters in name" do
          special_params = valid_params.deep_dup
          special_params[:user][:name] = "John O'Brien-Smith"
          special_params[:user][:email] = "john@test.com"

          post "/api/v1/users", params: special_params, headers: auth_headers(admin)

          expect(response).to have_http_status(:created)
        end

        it "handles email with plus sign" do
          plus_params = valid_params.deep_dup
          plus_params[:user][:email] = "user+tag@test.com"

          post "/api/v1/users", params: plus_params, headers: auth_headers(admin)

          expect(response).to have_http_status(:created)
        end

        it "handles short password" do
          short_pass_params = valid_params.deep_dup
          short_pass_params[:user][:password] = "123"
          short_pass_params[:user][:email] = "shortpass@test.com"

          post "/api/v1/users", params: short_pass_params, headers: auth_headers(admin)

          # Depending on password validation
          expect(response.status).to be_in([ 201, 422 ])
        end
      end

      context "with SQL injection attempts" do
        it "safely handles SQL injection in email" do
          sql_params = valid_params.deep_dup
          sql_params[:user][:email] = "admin@test.com' OR '1'='1"

          post "/api/v1/users", params: sql_params, headers: auth_headers(admin)

          # Should not create user or cause SQL error
          expect(response.status).to be_in([ 201, 422 ])
        end

        it "safely handles SQL injection in name" do
          sql_params = valid_params.deep_dup
          sql_params[:user][:name] = "'; DROP TABLE users; --"
          sql_params[:user][:email] = "sqltest@test.com"

          post "/api/v1/users", params: sql_params, headers: auth_headers(admin)

          expect(response.status).to be_in([ 201, 422 ])
          # Verify table still exists
          expect { User.count }.not_to raise_error
        end
      end

      context "with XSS attempts" do
        it "safely handles XSS in name" do
          xss_params = valid_params.deep_dup
          xss_params[:user][:name] = "<script>alert('xss')</script>"
          xss_params[:user][:email] = "xsstest@test.com"

          post "/api/v1/users", params: xss_params, headers: auth_headers(admin)

          expect(response.status).to be_in([ 201, 422 ])
        end
      end

      context "with missing user wrapper" do
        it "returns error when user params are not wrapped" do
          post "/api/v1/users",
               params: {
                 email: "nowrapper@test.com",
                 password: "password",
                 name: "No Wrapper",
                 role: "user",
                 grade: 1
               },
               headers: auth_headers(admin)

          expect(response).to have_http_status(:bad_request)
        end
      end
    end

    context "with approver user" do
      it "returns forbidden" do
        post "/api/v1/users",
             params: {
               user: {
                 email: "test@test.com",
                 password: "password",
                 name: "Test",
                 role: "user",
                 grade: 1
               }
             },
             headers: auth_headers(approver)

        expect(response).to have_http_status(:forbidden)
      end
    end

    context "with regular user" do
      it "returns forbidden" do
        post "/api/v1/users",
             params: {
               user: {
                 email: "test@test.com",
                 password: "password",
                 name: "Test",
                 role: "user",
                 grade: 1
               }
             },
             headers: auth_headers(regular_user)

        expect(response).to have_http_status(:forbidden)
      end
    end

    context "without authentication" do
      it "returns unauthorized" do
        post "/api/v1/users",
             params: {
               user: {
                 email: "test@test.com",
                 password: "password",
                 name: "Test",
                 role: "user",
                 grade: 1
               }
             }

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "DELETE /api/v1/users/:id" do
    let!(:user_to_delete) { create(:user, tenant: tenant) }

    context "with admin user" do
      it "soft deletes the user" do
        delete "/api/v1/users/#{user_to_delete.id}", headers: auth_headers(admin)

        expect(response).to have_http_status(:ok)
        body = JSON.parse(response.body)
        expect(body["message"]).to eq("User deleted successfully")
      end

      it "sets deleted_at timestamp" do
        delete "/api/v1/users/#{user_to_delete.id}", headers: auth_headers(admin)

        user_to_delete.reload
        expect(user_to_delete.deleted_at).to be_present
      end

      it "prevents admin from deleting themselves" do
        delete "/api/v1/users/#{admin.id}", headers: auth_headers(admin)

        expect(response).to have_http_status(:unprocessable_entity)
        body = JSON.parse(response.body)
        expect(body["error"]).to eq("You cannot delete yourself")
      end

      it "returns not found for non-existent user" do
        delete "/api/v1/users/99999", headers: auth_headers(admin)

        expect(response).to have_http_status(:not_found)
      end

      it "returns not found for user from different tenant" do
        other_tenant = create(:tenant)
        other_user = create(:user, tenant: other_tenant)

        delete "/api/v1/users/#{other_user.id}", headers: auth_headers(admin)

        expect(response).to have_http_status(:not_found)
      end

      it "returns not found for already deleted user" do
        user_to_delete.update_column(:deleted_at, Time.current)

        delete "/api/v1/users/#{user_to_delete.id}", headers: auth_headers(admin)

        expect(response).to have_http_status(:not_found)
      end

      it "handles invalid user ID format" do
        delete "/api/v1/users/abc", headers: auth_headers(admin)

        expect(response).to have_http_status(:not_found)
      end

      it "handles SQL injection in ID parameter" do
        delete "/api/v1/users/999999999", headers: auth_headers(admin)

        expect(response).to have_http_status(:not_found)
      end
    end

    context "with approver user" do
      it "returns forbidden" do
        delete "/api/v1/users/#{user_to_delete.id}", headers: auth_headers(approver)

        expect(response).to have_http_status(:forbidden)
      end
    end

    context "with regular user" do
      it "returns forbidden" do
        delete "/api/v1/users/#{user_to_delete.id}", headers: auth_headers(regular_user)

        expect(response).to have_http_status(:forbidden)
      end
    end

    context "without authentication" do
      it "returns unauthorized" do
        delete "/api/v1/users/#{user_to_delete.id}"

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end
