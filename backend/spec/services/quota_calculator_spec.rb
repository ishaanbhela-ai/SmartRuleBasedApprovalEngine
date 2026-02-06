require "rails_helper"

RSpec.describe QuotaCalculator, type: :service do
  let(:tenant) { create(:tenant) }
  let(:user) { create(:user, tenant: tenant, grade: 1) }
  let(:request_type) { create(:request_type, tenant: tenant) }
  # Use :grade_1 trait or set grade manually on the rule if trait differs, assuming :grade_1 exists based on previous spec
  let!(:rule) { create(:rule, tenant: tenant, request_type: request_type, grade: 1, definition: 10_000) }

  subject { described_class.new(user: user, request_type: request_type, tenant: tenant) }

  describe "#limit" do
    it "returns the rule definition for the user's grade" do
      expect(subject.limit).to eq(10_000)
    end

    context "when no rule exists for the grade" do
      let(:user_grade_2) { create(:user, tenant: tenant, grade: 2) }
      subject { described_class.new(user: user_grade_2, request_type: request_type, tenant: tenant) }

      it "raises ActiveRecord::RecordNotFound" do
        expect { subject.limit }.to raise_error(ActiveRecord::RecordNotFound)
      end
    end

    context "when tenant isolation is required" do
      let(:other_tenant) { create(:tenant) }
      let(:other_rule) { create(:rule, tenant: other_tenant, request_type: request_type, grade: 1, definition: 5_000) }

      # Even if another rule exists in another tenant, it shouldn't pick it up if we look in `tenant`
      # But request_type usually belongs to tenant too, so we need a request_type in other_tenant to be valid context
      let(:other_request_type) { create(:request_type, tenant: other_tenant) }
      let!(:other_rule_real) { create(:rule, tenant: other_tenant, request_type: other_request_type, grade: 1, definition: 5_000) }

      it "uses the rule from the correct tenant" do
        expect(subject.limit).to eq(10_000)
      end
    end
  end

  describe "#used" do
    it "returns 0 when there are no requests" do
      expect(subject.used).to eq(0)
    end

    context "with approved/auto_approved requests" do
      let!(:req1) { create(:request, tenant: tenant, requester: user, request_type: request_type, requested_value: 1_000, status: "auto_approved") }
      let!(:req2) { create(:request, tenant: tenant, requester: user, request_type: request_type, requested_value: 2_000, status: "approved") }

      it "sums up the values" do
        expect(subject.used).to eq(3_000)
      end
    end

    context "with pending or rejected requests" do
      let!(:req1) { create(:request, tenant: tenant, requester: user, request_type: request_type, requested_value: 1_000, status: "pending_approval") }
      let!(:req2) { create(:request, tenant: tenant, requester: user, request_type: request_type, requested_value: 2_000, status: "rejected") }

      it "does not include them in used amount" do
        expect(subject.used).to eq(0)
      end
    end

    context "with requests from other years" do
      let!(:old_req) do
        create(:request, tenant: tenant, requester: user, request_type: request_type, requested_value: 1_000, status: "approved", created_at: 1.year.ago)
      end

      it "does not include them" do
        expect(subject.used).to eq(0)
      end
    end

    context "with requests from other users or types" do
      let(:other_user) { create(:user, tenant: tenant) }
      let(:other_type) { create(:request_type, tenant: tenant, name: "leave") }
      let!(:req_other_user) { create(:request, tenant: tenant, requester: other_user, request_type: request_type, requested_value: 1_000, status: "approved") }
      let!(:req_other_type) { create(:request, tenant: tenant, requester: user, request_type: other_type, requested_value: 1_000, status: "approved") }

      it "does not include them" do
        expect(subject.used).to eq(0)
      end
    end
  end

  describe "#remaining" do
    it "returns the difference between limit and used" do
      create(:request, tenant: tenant, requester: user, request_type: request_type, requested_value: 3_000, status: "approved")
      # Limit 10,000 - Used 3,000 = 7,000
      expect(subject.remaining).to eq(7_000)
    end

    it "floors at 0 if used exceeds limit (though ideally shouldn't happen if checks work)" do
      # Simulate a state where somehow used > limit (maybe rule changed or race condition)
      create(:request, tenant: tenant, requester: user, request_type: request_type, requested_value: 15_000, status: "approved")
      expect(subject.remaining).to eq(0)
    end
  end
end
