FactoryBot.define do
  factory :request do
    association :tenant
    association :requester, factory: :user
    association :request_type

    requested_value { 2_000 }
    status { "submitted" }
  end
end
