class User < ApplicationRecord
  include SoftDeletable
  belongs_to :tenant

  has_many :submitted_requests,
           class_name: "Request",
           foreign_key: :requester_id

  has_many :request_type_approvers, dependent: :destroy
  has_many :approvable_request_types, through: :request_type_approvers, source: :request_type

  has_many :approved_requests,
           class_name: "Approval",
           foreign_key: :approver_id

  has_secure_password

  ROLES = %w[admin approver user].freeze

  validates :email, presence: true, uniqueness: { scope: :tenant_id, conditions: -> { where(deleted_at: nil) } }
  validates :name, presence: true
  validates :role, inclusion: { in: ROLES }
  validates :grade, inclusion: { in: [ 1, 2, 3 ] }
end
