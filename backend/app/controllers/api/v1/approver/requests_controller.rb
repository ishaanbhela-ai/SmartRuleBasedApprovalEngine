module Api
  module V1
    module Approver
      class RequestsController < ApplicationController
        def index
          requests = Request
            .accessible_by(current_ability)
            .where(status: "pending_approval")
            .includes(:request_type, :requester)

          render json: requests.map { |req| serialize_request(req) }
        end

        def update
          request = Request.find(params[:id])
          authorize! :update, request

          return render json: { error: "Self approval not allowed" },
                        status: :unprocessable_entity if
                        request.requester_id == current_user.id

          ActiveRecord::Base.transaction do
            request.update!(
              status: params[:action_type] == "approved" ? "approved" : "rejected"
            )

            Approval.create!(
              tenant: request.tenant,
              request: request,
              approver: current_user,
              rule: applicable_rule(request),
              definition: applicable_rule(request)&.definition,
              action: params[:action_type],
              reason: params[:reason]
            )
          end

          render json: { status: request.status }
        end

        private

        def applicable_rule(request)
          Rule.find_by(
            tenant: request.tenant,
            request_type: request.request_type,
            grade: request.requester.grade
          )
        end

        def serialize_request(req)
          quota = QuotaCalculator.new(
            user: req.requester,
            request_type: req.request_type,
            tenant: req.tenant
          )

          {
            id: req.id,
            status: req.status,
            requested_value: req.requested_value,
            request_type: {
              id: req.request_type.id,
              name: req.request_type.name
            },
            requester: {
              id: req.requester.id,
              name: req.requester.name,
              grade: req.requester.grade
            },
            quota: {
              limit: quota.limit,
              used: quota.used,
              remaining: quota.remaining
            },
            created_at: req.created_at
          }
        end
      end
    end
  end
end
