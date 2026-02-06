require "rails_helper"

RSpec.describe MyReportCalculator, type: :service do
  let(:tenant) { create(:tenant) }
  let(:request_type) { create(:request_type, tenant: tenant, name: "expense") }

  describe "#calculate" do
    context "for a regular user" do
      let(:user) { create(:user, tenant: tenant) }
      subject { described_class.new(user: user, tenant: tenant).calculate }

      it "returns the user report structure" do
        expect(subject[:role]).to eq("user")
        expect(subject.keys).to include(:total_requests, :approved, :pending, :rejected, :submitted)
      end

      it "counts requests correctly" do
        create(:request, tenant: tenant, requester: user, status: "approved")
        create(:request, tenant: tenant, requester: user, status: "pending_approval")
        create(:request, tenant: tenant, requester: user, status: "rejected")
        create(:request, tenant: tenant, requester: user, status: "submitted")

        # Request from another user shouldn't be counted
        create(:request, tenant: tenant, requester: create(:user, tenant: tenant), status: "approved")

        expect(subject[:total_requests]).to eq(4)
        expect(subject[:approved]).to eq(1)
        expect(subject[:pending]).to eq(1)
        expect(subject[:rejected]).to eq(1)
        expect(subject[:submitted]).to eq(1)
      end

      it "handles zero requests" do
        expect(subject[:total_requests]).to eq(0)
      end
    end

    context "for an approver" do
      let(:approver) { create(:user, :approver, tenant: tenant) }
      subject { described_class.new(user: approver, tenant: tenant).calculate }

      before do
        # Create a request type and assign this approver to it
        approver_association = create(:request_type_approver, user: approver, request_type: request_type)
      end

      it "returns the approver report structure" do
        expect(subject[:role]).to eq("approver")
        expect(subject.keys).to include(:total_reviewed, :approved_by_me, :rejected_by_me, :pending_inbox, :my_requests)
      end

      it "counts reviewed requests (approvals)" do
        # Create approvals
        rule = create(:rule, tenant: tenant, request_type: request_type, grade: 1, definition: 1000)
        req1 = create(:request, tenant: tenant, request_type: request_type)
        req2 = create(:request, tenant: tenant, request_type: request_type)

        create(:approval, request: req1, approver: approver, tenant: tenant, action: "approved", rule: rule)
        create(:approval, request: req2, approver: approver, tenant: tenant, action: "rejected", rule: rule)

        expect(subject[:total_reviewed]).to eq(2)
        expect(subject[:approved_by_me]).to eq(1)
        expect(subject[:rejected_by_me]).to eq(1)
      end

      it "counts pending inbox items" do
        # A request that is pending and belongs to a request_type this approver manages
        create(:request, tenant: tenant, request_type: request_type, status: "pending_approval")
        # A request that is approved shouldn't be in inbox
        create(:request, tenant: tenant, request_type: request_type, status: "approved")
        # A request for another request type not managed by this approver
        other_type = create(:request_type, tenant: tenant, name: "leave") # approver not assigned
        create(:request, tenant: tenant, request_type: other_type, status: "pending_approval")

        expect(subject[:pending_inbox]).to eq(1)
      end

      it "counts their own requests" do
        create(:request, tenant: tenant, requester: approver, status: "pending_approval")
        create(:request, tenant: tenant, requester: approver, status: "approved")

        expect(subject[:my_requests][:total]).to eq(2)
        expect(subject[:my_requests][:pending]).to eq(1)
      end
    end

    context "for an admin" do
      let(:admin) { create(:user, :admin, tenant: tenant) }
      subject { described_class.new(user: admin, tenant: tenant).calculate }

      it "returns the admin report structure" do
        expect(subject[:role]).to eq("admin")
        expect(subject.keys).to include(:status_breakdown, :by_request_type, :approver_activity, :total_users, :total_approvers)
      end

      it "calculates status breakdown correctly" do
        create(:request, tenant: tenant, status: "approved")
        create(:request, tenant: tenant, status: "rejected")
        # Request in another tenant
        create(:request, tenant: create(:tenant), status: "approved")

        expect(subject[:status_breakdown][:total]).to eq(2)
        expect(subject[:status_breakdown][:approved]).to eq(1)
        expect(subject[:status_breakdown][:rejected]).to eq(1)
      end

      it "calculates by_request_type correctly" do
        expense_type = request_type
        leave_type = create(:request_type, tenant: tenant, name: "leave")

        create(:request, tenant: tenant, request_type: expense_type, status: "approved")
        create(:request, tenant: tenant, request_type: leave_type, status: "pending_approval")

        expenses = subject[:by_request_type].find { |t| t[:name] == "expense" }
        leaves = subject[:by_request_type].find { |t| t[:name] == "leave" }

        expect(expenses[:total]).to eq(1)
        expect(expenses[:approved]).to eq(1)
        expect(leaves[:total]).to eq(1)
        expect(leaves[:pending]).to eq(1)
      end

      it "calculates approver activity correctly" do
        approver = create(:user, :approver, tenant: tenant)
        rule = create(:rule, tenant: tenant, request_type: request_type, grade: 1, definition: 1000)
        req = create(:request, tenant: tenant, request_type: request_type)

        create(:approval, request: req, approver: approver, tenant: tenant, action: "approved", rule: rule)

        activity = subject[:approver_activity].find { |a| a[:approver_id] == approver.id }
        expect(activity[:total_reviewed]).to eq(1)
        expect(activity[:approved]).to eq(1)
      end

      it "counts users correctly" do
        create(:user, tenant: tenant, role: "user")
        create(:user, tenant: tenant, role: "approver")
        # Admin themselves is a user

        expect(subject[:total_users]).to eq(3) # admin + user + approver
        expect(subject[:total_approvers]).to eq(1)
      end
    end

    context "tenant isolation" do
      let(:user) { create(:user, tenant: tenant) }
      let(:other_tenant) { create(:tenant) }
      let(:other_user) { create(:user, tenant: other_tenant) }

      it "does not include data from other tenants" do
        create(:request, tenant: other_tenant, requester: other_user)
        report = described_class.new(user: user, tenant: tenant).calculate
        expect(report[:total_requests]).to eq(0)
      end
    end
  end
end
