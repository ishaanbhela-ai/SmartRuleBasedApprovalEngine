class QuotaCalculator
  def initialize(user:, request_type:, tenant:)
    @user = user
    @request_type = request_type
    @tenant = tenant
  end

  def limit
    rule.definition
  end

  def used
    Request
      .where(
        tenant: @tenant,
        requester_id: @user.id,
        request_type_id: @request_type.id,
        status: %w[approved auto_approved]
      )
      .where("created_at >= ?", period_start)
      .sum(:requested_value)
  end

  def remaining
    [ limit - used, 0 ].max
  end

  private

  def rule
    @rule ||= Rule.find_by!(
      tenant: @tenant,
      request_type: @request_type,
      grade: @user.grade
    )
  end

  def period_start
    Time.current.beginning_of_year
  end
end
