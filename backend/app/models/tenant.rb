class Tenant < ApplicationRecord
  include SoftDeletable
  has_many :users, dependent: :destroy
  has_many :request_types, dependent: :destroy
  has_many :rules, dependent: :destroy
  has_many :requests
  has_many :approvals

  validates :name, presence: true
end
