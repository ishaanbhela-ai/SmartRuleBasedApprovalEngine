module Api
  module V1
    class RequestsController < ApplicationController
      def index
        requests = Request.accessible_by(current_ability)
        render json: requests.map { |req| serialize_request(req) }
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
          }
        }
      end
    end
  end
end
