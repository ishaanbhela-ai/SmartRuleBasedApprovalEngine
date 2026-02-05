class UserSerializer < Panko::Serializer
  attributes :id, :name, :email, :role, :grade
end
