class ApprovalSerializer < Panko::Serializer
  attributes :id, :action, :reason, :created_at

  has_one :approver, serializer: UserSerializer
  has_one :rule, serializer: RuleSerializer
end
