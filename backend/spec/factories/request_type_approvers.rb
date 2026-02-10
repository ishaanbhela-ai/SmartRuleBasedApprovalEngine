FactoryBot.define do
  factory :request_type_approver do
    association :request_type
    association :user
  end
end
