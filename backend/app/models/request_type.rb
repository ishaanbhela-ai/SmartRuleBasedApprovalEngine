class RequestType < ApplicationRecord
  include SoftDeletable
  belongs_to :tenant

  has_many :rules, dependent: :destroy
  has_many :requests
  has_many :request_type_approvers, dependent: :destroy
  has_many :approvers, through: :request_type_approvers, source: :user

  validates :name, inclusion: { in: %w[expense leave discount] }
end
