FactoryBot.define do
  factory :rule do
    association :tenant
    association :request_type

    trait :grade_1 do
      grade { 1 }
      definition { 10_000 }
    end

    trait :grade_2 do
      grade { 2 }
      definition { 25_000 }
    end

    trait :grade_3 do
      grade { 3 }
      definition { 50_000 }
    end
  end
end
