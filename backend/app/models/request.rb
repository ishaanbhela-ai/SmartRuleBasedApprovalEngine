class Request < ApplicationRecord
  belongs_to :tenant
  belongs_to :request_type
  belongs_to :requester, class_name: "User"

  has_one :approval

  STATUSES = %w[
    submitted
    auto_approved
    pending_approval
    approved
    rejected
  ].freeze

  validates :requested_value, numericality: { greater_than: 0 }
  validates :status, inclusion: { in: STATUSES }
end
