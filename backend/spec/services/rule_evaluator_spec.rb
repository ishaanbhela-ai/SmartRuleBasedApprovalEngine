require "rails_helper"

RSpec.describe RuleEvaluator do
  let!(:tenant) { create(:tenant) }

  let!(:request_type) { create(:request_type, tenant: tenant) }

  let!(:user) { create(:user, tenant: tenant) }

  let!(:rule) { create(:rule, :grade_1, tenant: tenant, request_type: request_type) }

  describe "#evaluate!" do
    context "when request is within quota" do
      it "auto approves the request" do
        request = create(:request, tenant: tenant, requester: user, request_type: request_type, requested_value: 2_000)

        RuleEvaluator.new(request).evaluate!

        request.reload

        expect(request.status).to eq("auto_approved")

        approval = Approval.find_by(request: request)

        expect(approval).to be_present
        expect(approval.action).to eq("approved")
        expect(approval.rule).to eq(rule)
      end
    end

    context "when request exceeds quota" do
      it "routes to manual approval" do
        request = create(:request, tenant: tenant, requester: user, request_type: request_type, requested_value: 20_000)

        RuleEvaluator.new(request).evaluate!

        request.reload

        expect(request.status).to eq("pending_approval")

        approval = Approval.find_by(request: request)

        expect(approval).to be_nil
      end
    end

    context "when cumulative quota is exceeded" do
      it "routes to manual approval" do
        # First approved request
        create(:request, tenant: tenant, requester: user, request_type: request_type, requested_value: 9_000, status: "auto_approved")

        # New request
        request = create(:request, tenant: tenant, requester: user, request_type: request_type, requested_value: 2_000)

        RuleEvaluator.new(request).evaluate!

        request.reload

        expect(request.status).to eq("pending_approval")
      end
    end
  end
end
