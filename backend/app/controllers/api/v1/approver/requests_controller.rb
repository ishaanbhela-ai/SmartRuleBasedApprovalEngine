module Api
  module V1
    module Approver
      class RequestsController < ApplicationController
        def index
          # Admin has manage :all so they can access. Approvers have access via their role.
          # Explicit check might be needed if standard resource auth isn't used.

          # Admins see all pending requests, approvers see only their assigned requests
          requests = if current_user.role == "admin"
                       # Admins can approve any pending request
                       Request
                         .where(status: "pending_approval")
                         .where(tenant_id: current_user.tenant_id)
          else
                       # Approvers see only pending requests for their assigned request types
                       Request
                         .where(status: "pending_approval")
                         .joins(request_type: :request_type_approvers)
                         .where(request_type_approvers: { user_id: current_user.id })
          end

          requests = requests.includes(:request_type, :requester)
          pagy, records = pagy(:offset, requests)

          render json: {
            data: Panko::ArraySerializer.new(
              records,
              each_serializer: ApproverRequestSerializer
            ).to_a,
            meta: pagy_meta(pagy)
          }
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
      end
    end
  end
end
