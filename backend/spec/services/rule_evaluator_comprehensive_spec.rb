require "rails_helper"

RSpec.describe RuleEvaluator, type: :service do
  let!(:tenant) { create(:tenant) }
  let!(:user) { create(:user, tenant: tenant, grade: 1) }
  let!(:request_type) { create(:request_type, tenant: tenant, name: "expense") }

  describe "#evaluate!" do
    context "with valid rule and within quota" do
      let!(:rule) { create(:rule, :grade_1, tenant: tenant, request_type: request_type, definition: 10_000) }
      let!(:request) { create(:request, tenant: tenant, requester: user, request_type: request_type, requested_value: 2_000) }

      it "auto approves the request" do
        RuleEvaluator.new(request).evaluate!

        request.reload
        expect(request.status).to eq("auto_approved")
      end

      it "creates an approval record" do
        expect {
          RuleEvaluator.new(request).evaluate!
        }.to change(Approval, :count).by(1)
      end

      it "sets approval with correct attributes" do
        RuleEvaluator.new(request).evaluate!

        approval = Approval.last
        expect(approval.request).to eq(request)
        expect(approval.rule).to eq(rule)
        expect(approval.action).to eq("approved")
        expect(approval.approver).to be_nil
        expect(approval.reason).to include("Auto approved")
      end

      it "stores rule definition in approval" do
        RuleEvaluator.new(request).evaluate!

        approval = Approval.last
        expect(approval.definition).to eq(rule.definition)
      end
    end

    context "when request exceeds quota" do
      let!(:rule) { create(:rule, :grade_1, tenant: tenant, request_type: request_type, definition: 10_000) }
      let!(:request) { create(:request, tenant: tenant, requester: user, request_type: request_type, requested_value: 20_000) }

      it "routes to manual approval" do
        RuleEvaluator.new(request).evaluate!

        request.reload
        expect(request.status).to eq("pending_approval")
      end

      it "does not create an approval record" do
        expect {
          RuleEvaluator.new(request).evaluate!
        }.not_to change(Approval, :count)
      end
    end

    context "when cumulative quota is exceeded" do
      let!(:rule) { create(:rule, :grade_1, tenant: tenant, request_type: request_type, definition: 10_000) }

      before do
        # Create previous approved request that uses up most of the quota
        create(:request,
               tenant: tenant,
               requester: user,
               request_type: request_type,
               requested_value: 9_000,
               status: "auto_approved")
      end

      it "routes to manual approval when cumulative exceeds limit" do
        request = create(:request, tenant: tenant, requester: user, request_type: request_type, requested_value: 2_000)

        RuleEvaluator.new(request).evaluate!

        request.reload
        expect(request.status).to eq("pending_approval")
      end

      it "auto approves when cumulative is within limit" do
        request = create(:request, tenant: tenant, requester: user, request_type: request_type, requested_value: 500)

        RuleEvaluator.new(request).evaluate!

        request.reload
        expect(request.status).to eq("auto_approved")
      end
    end

    context "with no rule defined for grade" do
      let!(:request) { create(:request, tenant: tenant, requester: user, request_type: request_type, requested_value: 1_000) }

      it "raises ActiveRecord::RecordNotFound error" do
        expect {
          RuleEvaluator.new(request).evaluate!
        }.to raise_error(ActiveRecord::RecordNotFound)
      end

      it "does not change request status" do
        original_status = request.status

        begin
          RuleEvaluator.new(request).evaluate!
        rescue ActiveRecord::RecordNotFound
          # Expected error
        end

        request.reload
        expect(request.status).to eq(original_status)
      end
    end

    context "with very small quota definition" do
      let!(:rule) { create(:rule, :grade_1, tenant: tenant, request_type: request_type, definition: 1) }
      let!(:request) { create(:request, tenant: tenant, requester: user, request_type: request_type, requested_value: 2) }

      it "routes to manual approval when exceeding small quota" do
        RuleEvaluator.new(request).evaluate!

        request.reload
        expect(request.status).to eq("pending_approval")
      end
    end

    context "with negative requested_value" do
      let!(:rule) { create(:rule, :grade_1, tenant: tenant, request_type: request_type, definition: 10_000) }

      it "raises validation error on request creation" do
        expect {
          create(:request, tenant: tenant, requester: user, request_type: request_type, requested_value: -100)
        }.to raise_error(ActiveRecord::RecordInvalid)
      end
    end

    context "with zero requested_value" do
      let!(:rule) { create(:rule, :grade_1, tenant: tenant, request_type: request_type, definition: 10_000) }

      it "raises validation error on request creation" do
        expect {
          create(:request, tenant: tenant, requester: user, request_type: request_type, requested_value: 0)
        }.to raise_error(ActiveRecord::RecordInvalid)
      end
    end

    context "with soft deleted rule" do
      let!(:rule) do
        create(:rule, :grade_1, tenant: tenant, request_type: request_type, definition: 10_000).tap do |r|
          r.update_column(:deleted_at, Time.current)
        end
      end
      let!(:request) { create(:request, tenant: tenant, requester: user, request_type: request_type, requested_value: 1_000) }

      it "raises RecordNotFound error" do
        expect {
          RuleEvaluator.new(request).evaluate!
        }.to raise_error(ActiveRecord::RecordNotFound)
      end
    end

    context "with grade-based rules" do
      let!(:grade_1_rule) { create(:rule, :grade_1, tenant: tenant, request_type: request_type, definition: 5_000) }
      let!(:grade_2_rule) { create(:rule, :grade_2, tenant: tenant, request_type: request_type, definition: 15_000) }
      let!(:grade_3_rule) { create(:rule, :grade_3, tenant: tenant, request_type: request_type, definition: 50_000) }

      it "uses correct rule for grade 1 user" do
        user_g1 = create(:user, tenant: tenant, grade: 1)
        request = create(:request, tenant: tenant, requester: user_g1, request_type: request_type, requested_value: 4_000)

        RuleEvaluator.new(request).evaluate!

        request.reload
        expect(request.status).to eq("auto_approved")
        expect(Approval.last.rule).to eq(grade_1_rule)
      end

      it "uses correct rule for grade 2 user" do
        user_g2 = create(:user, :approver, tenant: tenant, grade: 2)
        request = create(:request, tenant: tenant, requester: user_g2, request_type: request_type, requested_value: 10_000)

        RuleEvaluator.new(request).evaluate!

        request.reload
        expect(request.status).to eq("auto_approved")
        expect(Approval.last.rule).to eq(grade_2_rule)
      end

      it "uses correct rule for grade 3 user" do
        user_g3 = create(:user, :admin, tenant: tenant, grade: 3)
        request = create(:request, tenant: tenant, requester: user_g3, request_type: request_type, requested_value: 30_000)

        RuleEvaluator.new(request).evaluate!

        request.reload
        expect(request.status).to eq("auto_approved")
        expect(Approval.last.rule).to eq(grade_3_rule)
      end

      it "routes to approval when grade 1 exceeds their limit" do
        user_g1 = create(:user, tenant: tenant, grade: 1)
        request = create(:request, tenant: tenant, requester: user_g1, request_type: request_type, requested_value: 6_000)

        RuleEvaluator.new(request).evaluate!

        request.reload
        expect(request.status).to eq("pending_approval")
      end
    end

    context "with different request types" do
      let!(:leave_type) { create(:request_type, :leave, tenant: tenant) }
      let!(:discount_type) { create(:request_type, :discount, tenant: tenant) }
      let!(:expense_rule) { create(:rule, :grade_1, tenant: tenant, request_type: request_type, definition: 10_000) }
      let!(:leave_rule) { create(:rule, :grade_1, tenant: tenant, request_type: leave_type, definition: 10) }

      it "uses correct rule for expense request" do
        request = create(:request, tenant: tenant, requester: user, request_type: request_type, requested_value: 5_000)

        RuleEvaluator.new(request).evaluate!

        request.reload
        expect(request.status).to eq("auto_approved")
        expect(Approval.last.rule).to eq(expense_rule)
      end

      it "uses correct rule for leave request" do
        request = create(:request, tenant: tenant, requester: user, request_type: leave_type, requested_value: 5)

        RuleEvaluator.new(request).evaluate!

        request.reload
        expect(request.status).to eq("auto_approved")
        expect(Approval.last.rule).to eq(leave_rule)
      end

      it "maintains separate quotas for different request types" do
        # Use up expense quota
        create(:request, tenant: tenant, requester: user, request_type: request_type, requested_value: 9_000, status: "auto_approved")

        # Leave quota should still be available
        leave_request = create(:request, tenant: tenant, requester: user, request_type: leave_type, requested_value: 5)

        RuleEvaluator.new(leave_request).evaluate!


        leave_request.reload
        expect(leave_request.status).to eq("auto_approved")
      end
    end

    context "with soft deleted request_type" do
      let!(:deleted_type) do
        create(:request_type, :discount, tenant: tenant).tap do |rt|
          rt.update_column(:deleted_at, Time.current)
        end
      end

      it "soft deleted request_type is not found by default scope" do
        # Verify that soft deleted request_type is not accessible
        found_type = tenant.request_types.find_by(id: deleted_type.id)
        expect(found_type).to be_nil
      end
    end

    context "with boundary values" do
      let!(:rule) { create(:rule, :grade_1, tenant: tenant, request_type: request_type, definition: 10_000) }

      it "auto approves when requested_value equals remaining quota" do
        request = create(:request, tenant: tenant, requester: user, request_type: request_type, requested_value: 10_000)

        RuleEvaluator.new(request).evaluate!

        request.reload
        expect(request.status).to eq("auto_approved")
      end

      it "routes to approval when requested_value exceeds by 1" do
        request = create(:request, tenant: tenant, requester: user, request_type: request_type, requested_value: 10_001)

        RuleEvaluator.new(request).evaluate!

        request.reload
        expect(request.status).to eq("pending_approval")
      end

      it "auto approves minimum valid value (1)" do
        request = create(:request, tenant: tenant, requester: user, request_type: request_type, requested_value: 1)

        RuleEvaluator.new(request).evaluate!

        request.reload
        expect(request.status).to eq("auto_approved")
      end
    end

    context "with tenant isolation" do
      let!(:other_tenant) { create(:tenant, name: "Other Tenant") }
      let!(:other_user) { create(:user, tenant: other_tenant, grade: 1) }
      let!(:other_request_type) { create(:request_type, tenant: other_tenant, name: "expense") }
      let!(:other_rule) { create(:rule, :grade_1, tenant: other_tenant, request_type: other_request_type, definition: 50_000) }
      let!(:rule) { create(:rule, :grade_1, tenant: tenant, request_type: request_type, definition: 10_000) }

      it "uses rule from correct tenant" do
        request = create(:request, tenant: tenant, requester: user, request_type: request_type, requested_value: 5_000)

        RuleEvaluator.new(request).evaluate!

        request.reload
        expect(request.status).to eq("auto_approved")
        expect(Approval.last.rule.tenant).to eq(tenant)
        expect(Approval.last.rule.definition).to eq(10_000)
      end

      it "does not use rule from different tenant" do
        request = create(:request, tenant: other_tenant, requester: other_user, request_type: other_request_type, requested_value: 30_000)

        RuleEvaluator.new(request).evaluate!

        request.reload
        expect(request.status).to eq("auto_approved")
        expect(Approval.last.rule.tenant).to eq(other_tenant)
        expect(Approval.last.rule.definition).to eq(50_000)
      end
    end

    context "with multiple requests in sequence" do
      let!(:rule) { create(:rule, :grade_1, tenant: tenant, request_type: request_type, definition: 10_000) }

      it "correctly calculates remaining quota after each approval" do
        # First request: 3000
        request1 = create(:request, tenant: tenant, requester: user, request_type: request_type, requested_value: 3_000)
        RuleEvaluator.new(request1).evaluate!
        expect(request1.reload.status).to eq("auto_approved")

        # Second request: 4000 (total: 7000)
        request2 = create(:request, tenant: tenant, requester: user, request_type: request_type, requested_value: 4_000)
        RuleEvaluator.new(request2).evaluate!
        expect(request2.reload.status).to eq("auto_approved")

        # Third request: 3000 (total: 10000)
        request3 = create(:request, tenant: tenant, requester: user, request_type: request_type, requested_value: 3_000)
        RuleEvaluator.new(request3).evaluate!
        expect(request3.reload.status).to eq("auto_approved")

        # Fourth request: 1 (total: 10001 - exceeds)
        request4 = create(:request, tenant: tenant, requester: user, request_type: request_type, requested_value: 1)
        RuleEvaluator.new(request4).evaluate!
        expect(request4.reload.status).to eq("pending_approval")
      end
    end

    context "with very large values" do
      let!(:rule) { create(:rule, :grade_1, tenant: tenant, request_type: request_type, definition: 1_000_000_000) }

      it "handles large quota definitions" do
        request = create(:request, tenant: tenant, requester: user, request_type: request_type, requested_value: 999_999_999)

        RuleEvaluator.new(request).evaluate!

        request.reload
        expect(request.status).to eq("auto_approved")
      end

      it "handles large requested values" do
        request = create(:request, tenant: tenant, requester: user, request_type: request_type, requested_value: 1_000_000_001)

        RuleEvaluator.new(request).evaluate!

        request.reload
        expect(request.status).to eq("pending_approval")
      end
    end
  end
end
