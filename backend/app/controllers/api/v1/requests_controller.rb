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

        requests = apply_filters(requests)
        requests = requests.includes(:requester, :request_type, :approval).order(created_at: :desc)
        pagy, records = pagy(:offset, requests)

        render json: {
          data: Panko::ArraySerializer.new(
            records,
            each_serializer: RequestSerializer
          ).to_a,
          meta: pagy_meta(pagy)
        }
      end

      def show
        request = Request.find_by(id: params[:id])
        authorize! :read, request
        render json: { data: RequestSerializer.new.serialize(request) }
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

        render json: { data: RequestSerializer.new.serialize(request) }, status: :created
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

      def apply_filters(requests)
        requests = requests.where(status: params[:status]) if params[:status].present?
        requests = requests.where(request_type_id: params[:request_type_id]) if params[:request_type_id].present?
        requests = requests.where(created_at: params[:start_date]..params[:end_date]) if params[:start_date].present? && params[:end_date].present?
        requests
      end
    end
  end
end
