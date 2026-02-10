# frozen_string_literal: true

# Service to calculate personalized reports based on user role
# Follows same pattern as QuotaCalculator for consistency
class MyReportCalculator
  attr_reader :user, :tenant

  def initialize(user:, tenant:)
    @user = user
    @tenant = tenant
  end

  # Main entry point - returns role-specific report
  def calculate
    case user.role
    when "admin"
      admin_report
    when "approver"
      approver_report
    when "user"
      user_report
    end
  end

  private

  # USER REPORT
  # Metrics based on requests they created
  # Optimized: Single query with aggregation
  def user_report
    # Single query: group by status and count
    status_counts = tenant.requests
      .where(requester_id: user.id)
      .group(:status)
      .count

    {
      role: "user",
      total_requests: status_counts.values.sum,
      approved: status_counts["approved"] || 0,
      pending: status_counts["pending_approval"] || 0,
      rejected: status_counts["rejected"] || 0,
      submitted: status_counts["submitted"] || 0
    }
  end

  # APPROVER REPORT
  # Metrics based on requests they reviewed + current inbox
  # Optimized: Minimal queries with aggregation
  def approver_report
    # Single query: group approvals by action
    approval_counts = Approval
      .where(approver_id: user.id, tenant_id: tenant.id)
      .group(:action)
      .count

    # Single query: pending inbox count
    pending_inbox = Request
      .where(status: "pending_approval")
      .joins(request_type: :request_type_approvers)
      .where(request_type_approvers: { user_id: user.id })
      .count

    # Single query: user's own requests grouped by status
    my_request_counts = tenant.requests
      .where(requester_id: user.id)
      .group(:status)
      .count

    {
      role: "approver",
      total_reviewed: approval_counts.values.sum,
      approved_by_me: approval_counts["approved"] || 0,
      rejected_by_me: approval_counts["rejected"] || 0,
      pending_inbox: pending_inbox,
      my_requests: {
        total: my_request_counts.values.sum,
        pending: my_request_counts["pending_approval"] || 0
      }
    }
  end

  # ADMIN REPORT
  # Global tenant metrics
  # Reuses existing admin report queries for consistency
  def admin_report
    # Reuse existing optimized queries
    status_counts = tenant.requests.group(:status).count

    # Additional aggregations for enhanced admin view
    type_status_counts = tenant.requests
      .joins(:request_type)
      .group("request_types.name", :status)
      .count

    approver_action_counts = Approval
      .where(tenant_id: tenant.id)
      .joins(:approver)
      .group("users.id", "users.name", :action)
      .count

    # Build comprehensive admin report
    {
      role: "admin",
      # Overall status breakdown (matches /admin/reports/summary)
      status_breakdown: {
        total: status_counts.values.sum,
        submitted: status_counts["submitted"] || 0,
        pending_approval: status_counts["pending_approval"] || 0,
        approved: status_counts["approved"] || 0,
        rejected: status_counts["rejected"] || 0
      },
      # Request type breakdown with status details
      by_request_type: build_type_breakdown(type_status_counts),
      # Approver performance metrics
      approver_activity: build_approver_activity(approver_action_counts),
      # User counts
      total_users: tenant.users.count,
      total_approvers: tenant.users.where(role: "approver").count
    }
  end

  # Helper: Build request type breakdown from aggregated data
  def build_type_breakdown(type_status_counts)
    tenant.request_types.pluck(:name).map do |type_name|
      {
        name: type_name,
        total: type_status_counts.select { |k, _| k[0] == type_name }.values.sum,
        pending: type_status_counts[[ type_name, "pending_approval" ]] || 0,
        approved: type_status_counts[[ type_name, "approved" ]] || 0,
        rejected: type_status_counts[[ type_name, "rejected" ]] || 0
      }
    end
  end

  # Helper: Build approver activity from aggregated data
  def build_approver_activity(approver_action_counts)
    tenant.users.where(role: "approver").pluck(:id, :name).map do |approver_id, approver_name|
      approved = approver_action_counts[[ approver_id, approver_name, "approved" ]] || 0
      rejected = approver_action_counts[[ approver_id, approver_name, "rejected" ]] || 0

      {
        approver_id: approver_id,
        approver_name: approver_name,
        total_reviewed: approved + rejected,
        approved: approved,
        rejected: rejected
      }
    end
  end
end
