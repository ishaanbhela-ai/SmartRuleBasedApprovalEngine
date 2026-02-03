class RequestType < ApplicationRecord
  belongs_to :tenant
  belongs_to :approver, class_name: "User"

  has_many :rules, dependent: :destroy
  has_many :requests, dependent: :destroy

  validates :name, inclusion: { in: %w[expense leave discount] }
end
