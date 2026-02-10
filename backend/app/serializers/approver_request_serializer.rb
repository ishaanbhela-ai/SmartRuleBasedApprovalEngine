class ApproverRequestSerializer < Panko::Serializer
  attributes :id,
             :status,
             :requested_value,
             :created_at,
             :quota

  has_one :requester, serializer: ::UserSerializer
  has_one :request_type, serializer: ::RequestTypeSerializer

  def quota
    calculator = QuotaCalculator.new(
      user: object.requester,
      request_type: object.request_type,
      tenant: object.tenant
    )

    {
      limit: calculator.limit,
      used: calculator.used,
      remaining: calculator.remaining
    }
  end
end
