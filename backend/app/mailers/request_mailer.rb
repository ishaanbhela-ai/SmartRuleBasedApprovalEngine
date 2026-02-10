class RequestMailer < ApplicationMailer
  def status_notification
    @approval = params[:approval]
    @request = @approval.request
    @requester = @request.requester
    @approver = @approval.approver
    @action = @approval.action

    # Check for auto_approved status on request
    if @request.status == "auto_approved"
      @subject = "[Auto-Approved] Your request #{@request.id} has been auto-approved"
    else
      @subject = "[Request ##{@request.id}] Your request has been #{@action}"
    end

    mail(to: @requester.email, subject: @subject)
  end
end
