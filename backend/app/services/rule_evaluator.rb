class RuleEvaluator
  def initialize(request)
    @request = request
    @user = request.requester
  end

  def evaluate!
    rule = Rule.find_by!(
      tenant: @request.tenant,
      request_type: @request.request_type,
      grade: @user.grade,
      is_active: true
    )

    if @request.requested_value <= rule.definition
      auto_approve!(rule)
    else
      route_to_approver!
    end
  end

  private

  def auto_approve!(rule)
    @request.update!(status: "auto_approved")

    Approval.create!(
      tenant: @request.tenant,
      request: @request,
      approver: nil,
      rule: rule,
      definition: rule.definition,
      action: "approved",
      reason: "Auto approved within grade limit"
    )
  end

  def route_to_approver!
    @request.update!(status: "pending_approval")
  end
end
