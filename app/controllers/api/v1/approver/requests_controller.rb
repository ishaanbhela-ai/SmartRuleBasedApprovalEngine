module Api
  module V1
    module Approver
      class RequestsController < ApplicationController
        def index
          requests = Request
            .accessible_by(current_ability)
            .where(status: "pending_approval")

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
          {
            id: req.id,
            type: req.request_type.name,
            requested_value: req.requested_value,
            requester: {
              id: req.requester.id,
              name: req.requester.name,
              email: req.requester.email,
              grade: req.requester.grade
            }
          }
        end
      end
    end
  end
end
