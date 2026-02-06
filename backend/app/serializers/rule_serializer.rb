class RuleSerializer < Panko::Serializer
  attributes :id, :grade, :definition

  has_one :request_type, serializer: ::RequestTypeSerializer
end
