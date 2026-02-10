class RequestTypeSerializer < Panko::Serializer
  attributes :id, :name

  has_many :approvers, serializer: ::UserSerializer
end
