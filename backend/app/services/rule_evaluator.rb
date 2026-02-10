class RuleEvaluator
  def initialize(request)
    @request = request
    @user = request.requester
    @tenant = request.tenant
    @request_type = request.request_type
  end

  def evaluate!
    quota = QuotaCalculator.new(
      user: @user,
      request_type: @request_type,
      tenant: @tenant
    )

    if @request.requested_value <= quota.remaining
      auto_approve!(quota)
    else
      route_to_approver!
    end
  end

  private

  def auto_approve!(quota)
    rule = Rule.find_by!(
      tenant: @tenant,
      request_type: @request_type,
      grade: @user.grade
    )
    @request.update!(status: "auto_approved")

    Approval.create!(
      tenant: @request.tenant,
      request: @request,
      approver: nil,
      rule: rule,
      definition: rule.definition,
      action: "approved",
      reason: "Auto approved by the system as under the grade limit."
    )
  end

  def route_to_approver!
    @request.update!(status: "pending_approval")
  end
end
