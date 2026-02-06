require "rails_helper"
require "cancan/matchers"

RSpec.describe Ability, type: :model do
  let(:tenant) { create(:tenant) }
  let(:user) { create(:user, tenant: tenant) }
  let(:other_user) { create(:user, tenant: tenant) }

  subject(:ability) { Ability.new(user) }

  describe "Approver permissions" do
    let(:user) { create(:user, :approver, tenant: tenant) }
    let(:request_type) { create(:request_type, tenant: tenant) }

    before do
      create(:request_type_approver, user: user, request_type: request_type)
    end

    context "when viewing requests assigned to them" do
      context "and status is pending_approval" do
        let(:request) { create(:request, tenant: tenant, request_type: request_type, requester: other_user, status: "pending_approval") }

        it "can read the request" do
          expect(ability).to be_able_to(:read, request)
        end

        it "can update the request" do
          expect(ability).to be_able_to(:update, request)
        end
      end

      context "and status is approved" do
        let(:request) { create(:request, tenant: tenant, request_type: request_type, requester: other_user, status: "approved") }

        it "cannot read the request" do
          expect(ability).not_to be_able_to(:read, request)
        end

        it "cannot update the request" do
          expect(ability).not_to be_able_to(:update, request)
        end
      end

      context "and status is rejected" do
        let(:request) { create(:request, tenant: tenant, request_type: request_type, requester: other_user, status: "rejected") }

        it "cannot read the request" do
          expect(ability).not_to be_able_to(:read, request)
        end
      end
    end

    context "when viewing requests NOT assigned to them" do
      let(:other_request_type) { create(:request_type, tenant: tenant, name: "leave") }
      let(:request) { create(:request, tenant: tenant, request_type: other_request_type, requester: other_user, status: "pending_approval") }

      it "cannot read the request" do
        expect(ability).not_to be_able_to(:read, request)
      end
    end

    context "when viewing their own requests" do
      let(:request) { create(:request, tenant: tenant, requester: user, status: "approved") }

      it "can read the request regardless of status" do
        expect(ability).to be_able_to(:read, request)
      end
    end
  end

  describe "Regular User permissions" do
    let(:user) { create(:user, tenant: tenant, role: "user") }

    it "can read their own requests" do
      request = create(:request, tenant: tenant, requester: user)
      expect(ability).to be_able_to(:read, request)
    end

    it "cannot read others' requests" do
      request = create(:request, tenant: tenant, requester: other_user)
      expect(ability).not_to be_able_to(:read, request)
    end
  end

  describe "Admin permissions" do
    let(:user) { create(:user, :admin, tenant: tenant) }

    it "can manage all" do
      expect(ability).to be_able_to(:manage, :all)
    end
  end
end
