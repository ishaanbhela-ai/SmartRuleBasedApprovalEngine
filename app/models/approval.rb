class Approval < ApplicationRecord
  belongs_to :tenant
  belongs_to :request
  belongs_to :rule, optional: true
  belongs_to :approver, class_name: "User", optional: true

  validates :action, inclusion: { in: %w[approved rejected] }
end
