class Tenant < ApplicationRecord
  has_many :users, dependent: :destroy
  has_many :request_types, dependent: :destroy
  has_many :rules, dependent: :destroy
  has_many :requests, dependent: :destroy
  has_many :approvals, dependent: :destroy

  validates :name, presence: true
end
