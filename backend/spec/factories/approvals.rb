FactoryBot.define do
  factory :approval do
    association :tenant
    association :request
    association :approver, factory: :user

    action { "approved" }
    reason { "Approved for testing" }
  end
end
