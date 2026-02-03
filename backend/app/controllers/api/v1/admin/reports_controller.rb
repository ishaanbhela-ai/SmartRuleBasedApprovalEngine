module Api
  module V1
    module Admin
      class ReportsController < ApplicationController
        def summary
          authorize! :read, :reports

          tenant = current_user.tenant

          render json: {
            total_requests: total_requests(tenant),
            status_breakdown: status_breakdown(tenant),
            request_type_breakdown: request_type_breakdown(tenant),
            decision_breakdown: decision_breakdown(tenant),
            rule_hit_counts: rule_hit_counts(tenant)
          }
        end

        private

        def total_requests(tenant)
          tenant.requests.count
        end

        def status_breakdown(tenant)
          tenant.requests.group(:status).count
        end

        def request_type_breakdown(tenant)
          tenant.requests
                .joins(:request_type)
                .group("request_types.name")
                .count
        end

        def decision_breakdown(tenant)
          tenant.approvals.group(:action).count
        end

        def rule_hit_counts(tenant)
          tenant.approvals
                .where.not(rule_id: nil)
                .group(:rule_id)
                .count
        end
      end
    end
  end
end
