class RequestSerializer < Panko::Serializer
  attributes :id,
             :status,
             :requested_value,
             :created_at

  has_one :requester, serializer: ::UserSerializer
  has_one :request_type, serializer: ::RequestTypeSerializer
  has_one :approval, serializer: ::ApprovalSerializer
end
