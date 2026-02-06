FactoryBot.define do
  factory :user do
    association :tenant

    name { "Test User" }
    sequence(:email) { |n| "user#{n}@test.com" }
    password { "password123" }
    role { "user" }
    grade { 1 }

    trait :admin do
      role { "admin" }
      grade { 3 }
    end

    trait :approver do
      role { "approver" }
      grade { 2 }
    end
  end
end
