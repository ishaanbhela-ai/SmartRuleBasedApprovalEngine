class Approval < ApplicationRecord
  belongs_to :tenant
  belongs_to :request
  belongs_to :rule, optional: true
  belongs_to :approver, class_name: "User", optional: true

  validates :action, inclusion: { in: %w[approved rejected] }

  after_create_commit :notify_requester

  private

  def notify_requester
    RequestMailer.with(approval: self).status_notification.deliver_later
  end
end
