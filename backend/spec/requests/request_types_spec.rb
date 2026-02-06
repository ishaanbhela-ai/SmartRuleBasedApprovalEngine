require "rails_helper"

RSpec.describe "Request Types API", type: :request do
  let(:tenant) { create(:tenant) }
  let(:admin) { create(:user, :admin, tenant: tenant) }
  let(:user) { create(:user, tenant: tenant) }
  let(:approver) { create(:user, :approver, tenant: tenant) }
  let(:token) { generate_token(admin) }
  let(:headers) { { "Authorization" => "Bearer #{token}" } }

  describe "GET /api/v1/request_types" do
    let!(:rt1) { create(:request_type, tenant: tenant, name: "expense") }
    let!(:rt2) { create(:request_type, tenant: tenant, name: "leave") }
    let!(:other_rt) { create(:request_type, tenant: create(:tenant), name: "expense") }

    it "lists request types for the tenant" do
      get "/api/v1/request_types", headers: headers

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)

      names = json["data"].map { |r| r["name"] }
      expect(names).to contain_exactly("expense", "leave")
      expect(names).not_to include(other_rt.id)
    end

    it "allows regular users to list request types" do
      user_token = generate_token(user)
      get "/api/v1/request_types", headers: { "Authorization" => "Bearer #{user_token}" }
      expect(response).to have_http_status(:ok)
    end
  end

  describe "POST /api/v1/request_types" do
    let(:valid_params) do
      {
        name: "discount",
        approver_ids: [ approver.id ]
      }
    end

    it "creates a new request type with approvers" do
      expect {
        post "/api/v1/request_types", params: valid_params, headers: headers
      }.to change(RequestType, :count).by(1)
       .and change(RequestTypeApprover, :count).by(1)

      expect(response).to have_http_status(:created)
      rt = RequestType.last
      expect(rt.name).to eq("discount")
      expect(rt.approvers).to include(approver)
    end

    context "validations" do
      it "returns conflict if name exists" do
        create(:request_type, tenant: tenant, name: "expense")
        post "/api/v1/request_types", params: { name: "expense", approver_ids: [ approver.id ] }, headers: headers

        expect(response).to have_http_status(:conflict)
      end

      it "returns unprocessable entity if no approvers provided" do
        post "/api/v1/request_types", params: { name: "discount", approver_ids: [] }, headers: headers, as: :json
        expect(response).to have_http_status(:unprocessable_entity)
        json = JSON.parse(response.body)
        expect(json["error"]).to eq("At least one approver is required")
      end

      it "returns unprocessable entity if invalid approvers provided" do
        post "/api/v1/request_types", params: { name: "discount", approver_ids: [ 99999 ] }, headers: headers, as: :json
        expect(response).to have_http_status(:unprocessable_entity)
        json = JSON.parse(response.body)
        expect(json["error"]).to eq("Invalid approvers provided")
      end

      it "handles RecordInvalid explicitly" do
        # Simulate a validation failure that passes explicit checks but fails at model level
        # For example, if name is invalid (though only inclusion validation exists and we bypass frontend checks potentially)
        # Or mock .save! to raise
        allow_any_instance_of(RequestType).to receive(:save!).and_raise(ActiveRecord::RecordInvalid.new(RequestType.new))

        post "/api/v1/request_types", params: { name: "discount", approver_ids: [ approver.id ] }, headers: headers, as: :json
        expect(response).to have_http_status(:unprocessable_entity)
        json = JSON.parse(response.body)
        expect(json["error"]).to include("Validation failed")
      end
    end

    it "forbids non-admins" do
      user_token = generate_token(user)
      post "/api/v1/request_types", params: valid_params, headers: { "Authorization" => "Bearer #{user_token}" }
      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "PUT /api/v1/request_types/:id" do # Although routes say update (PATCH/PUT) check routes file, it uses resources so both. Controller method is update
    let!(:rt) { create(:request_type, tenant: tenant, name: "expense") }
    let(:new_approver) { create(:user, :approver, tenant: tenant) }

    it "updates approvers" do
      put "/api/v1/request_types/#{rt.id}",
          params: { approver_ids: [ new_approver.id ] },
          headers: headers

      expect(response).to have_http_status(:ok)
      rt.reload
      expect(rt.approvers).to contain_exactly(new_approver)
    end

    it "replaces existing approvers" do
      create(:request_type_approver, request_type: rt, user: approver)

      put "/api/v1/request_types/#{rt.id}",
          params: { approver_ids: [ new_approver.id ] },
          headers: headers, as: :json

      rt.reload
      expect(rt.approvers).to contain_exactly(new_approver)
    end

    context "validations" do
      it "returns unprocessable entity if no approvers provided" do
        put "/api/v1/request_types/#{rt.id}", params: { approver_ids: [] }, headers: headers, as: :json
        expect(response).to have_http_status(:unprocessable_entity)
        json = JSON.parse(response.body)
        expect(json["error"]).to eq("At least one approver is required")
      end

      it "returns unprocessable entity if invalid approvers provided" do
         put "/api/v1/request_types/#{rt.id}", params: { approver_ids: [ 99999 ] }, headers: headers, as: :json
        expect(response).to have_http_status(:unprocessable_entity)
        json = JSON.parse(response.body)
        expect(json["error"]).to eq("Invalid approvers provided")
      end

       it "handles RecordInvalid explicitly" do
         allow(RequestTypeApprover).to receive(:create!).and_raise(ActiveRecord::RecordInvalid.new(RequestTypeApprover.new))

         put "/api/v1/request_types/#{rt.id}",
          params: { approver_ids: [ new_approver.id ] },
          headers: headers, as: :json

         expect(response).to have_http_status(:unprocessable_entity)
         json = JSON.parse(response.body)
         expect(json["error"]).to include("Validation failed")
       end
    end

    it "forbids update by non-admin" do
      user_token = generate_token(user)
      put "/api/v1/request_types/#{rt.id}",
          params: { approver_ids: [ new_approver.id ] },
          headers: { "Authorization" => "Bearer #{user_token}" }
      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "DELETE /api/v1/request_types/:id" do
    let!(:rt) { create(:request_type, tenant: tenant) }

    it "soft deletes the request type" do
       delete "/api/v1/request_types/#{rt.id}", headers: headers

       expect(response).to have_http_status(:ok)
       expect(RequestType.find_by(id: rt.id)).to be_nil # Default scope hides it
       expect(RequestType.with_deleted.find(rt.id)).to be_deleted
    end

     it "forbids delete by non-admin" do
      user_token = generate_token(user)
      delete "/api/v1/request_types/#{rt.id}", headers: { "Authorization" => "Bearer #{user_token}" }
      expect(response).to have_http_status(:forbidden)
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
