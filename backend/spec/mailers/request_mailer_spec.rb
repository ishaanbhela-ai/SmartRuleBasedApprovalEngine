require "rails_helper"

RSpec.describe RequestMailer, type: :mailer do
  describe "status_notification" do
    let(:tenant) { create(:tenant) }
    let(:approver) { create(:user, :approver, tenant: tenant, name: "Approver John") }
    let(:requester) { create(:user, tenant: tenant, email: "requester@example.com") }

    context "when request is approved manually" do
      let(:request) { create(:request, tenant: tenant, requester: requester, status: "approved") }
      let(:approval) { create(:approval, request: request, approver: approver, action: "approved", reason: "LGTM") }
      let(:mail) { RequestMailer.with(approval: approval).status_notification }

      it "renders the headers" do
        expect(mail.subject).to eq("[Request ##{request.id}] Your request has been approved")
        expect(mail.to).to eq([ "requester@example.com" ])
        expect(mail.from).to eq([ "from@example.com" ])
      end

      it "renders the body" do
        expect(mail.body.encoded).to match("Your request \\(ID: #{request.id}\\) has been approved")
        expect(mail.body.encoded).to match("Processed By: Approver John")
        expect(mail.body.encoded).to match("Reason/Comments:")
        expect(mail.body.encoded).to match("LGTM")
      end
    end

    context "when request is rejected manually" do
      let(:request) { create(:request, tenant: tenant, requester: requester, status: "rejected") }
      let(:approval) { create(:approval, request: request, approver: approver, action: "rejected", reason: "Budget constraints") }
      let(:mail) { RequestMailer.with(approval: approval).status_notification }

      it "renders correct subject" do
        expect(mail.subject).to eq("[Request ##{request.id}] Your request has been rejected")
      end

      it "renders body with rejection details" do
        expect(mail.body.encoded).to match("Your request \\(ID: #{request.id}\\) has been rejected")
        expect(mail.body.encoded).to match("Budget constraints")
      end
    end

    context "when request is auto-approved" do
      let(:request) { create(:request, tenant: tenant, requester: requester, status: "auto_approved") }
      # Auto-approvals might not have an associated approver user, so we pass approver: nil
      let(:approval) { create(:approval, request: request, approver: nil, action: "approved", reason: "Within limits") }
      let(:mail) { RequestMailer.with(approval: approval).status_notification }

      it "renders auto-approved subject" do
        expect(mail.subject).to eq("[Auto-Approved] Your request #{request.id} has been auto-approved")
      end

      it "renders body without approver name" do
        expect(mail.body.encoded).to match("Your request \\(ID: #{request.id}\\) has been auto-approved")
        expect(mail.body.encoded).not_to match("Processed By:")
        expect(mail.body.encoded).to match("Reason/Comments:")
        expect(mail.body.encoded).to match("Within limits")
      end
    end
  end
end