class RequestType < ApplicationRecord
  include SoftDeletable
  belongs_to :tenant
  belongs_to :approver, class_name: "User"

  has_many :rules, dependent: :destroy
  has_many :requests

  validates :name, inclusion: { in: %w[expense leave discount] }
end
