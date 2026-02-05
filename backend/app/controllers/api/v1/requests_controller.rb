module Api
  module V1
    class RequestsController < ApplicationController
      def index
        # This endpoint shows "My Requests" - requests created by the current user
        # Approvers use /api/v1/approver/requests for their approval inbox
        requests = if current_user.role == "admin"
                     # Admins see all requests in their tenant
                     current_user.tenant.requests
        else
                     # All other users (including approvers) see only their own requests
                     current_user.tenant.requests.where(requester_id: current_user.id)
        end

        requests = requests.includes(:requester, :request_type)
        pagy, records = pagy(:offset, requests)

        render json: {
          data: records.map { |req| serialize_request(req) }, meta: pagy_meta(pagy)
        }
      end

      def show
        request = Request.find(params[:id])
        authorize! :read, request
        render json: serialize_request(request)
      end

      def create
        authorize! :create, Request

        request = Request.new(
          tenant: current_user.tenant,
          request_type_id: params[:request_type_id],
          requester: current_user,
          requested_value: params[:requested_value],
          status: "submitted"
        )

        ActiveRecord::Base.transaction do
          request.save!
          RuleEvaluator.new(request).evaluate!
        end

        render json: serialize_request(request), status: :created
      rescue ActiveRecord::RecordInvalid => e
        render json: { error: e.message }, status: :unprocessable_entity
      end

      def balance
        authorize! :read, :balance

        request_type = current_user
          .tenant
          .request_types
          .find(params[:request_type_id])

        quota = QuotaCalculator.new(
          user: current_user,
          request_type: request_type,
          tenant: current_user.tenant
        )

        render json: {
          request_type: request_type.name,
          limit: quota.limit,
          used: quota.used,
          remaining: quota.remaining
        }
      end

      private

      def serialize_request(request)
        {
          id: request.id,
          type: request.request_type.name,
          requested_value: request.requested_value,
          status: request.status,
          approval: request.approval && {
            action: request.approval.action,
            reason: request.approval.reason,
            approver_id: request.approval.approver_id
          },
          request_type: {
            id: request.request_type.id,
            name: request.request_type.name
          },
          requester: {
            id: request.requester.id,
            name: request.requester.name,
            email: request.requester.email,
            grade: request.requester.grade
          },
          created_at: request.created_at
        }
      end
    end
  end
end
