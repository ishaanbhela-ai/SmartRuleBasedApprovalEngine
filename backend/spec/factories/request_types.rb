FactoryBot.define do
  factory :request_type do
    association :tenant
    name { "expense" }

    trait :leave do
      name { "leave" }
    end

    trait :discount do
      name { "discount" }
    end
  end
end
