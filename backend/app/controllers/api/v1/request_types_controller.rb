module Api
  module V1
    class RequestTypesController < ApplicationController
      def index
        authorize! :read, RequestType
        request_types = current_user.tenant.request_types.includes(:approvers)
        pagy, records = pagy(:offset, request_types)

        render json: {
          data: Panko::ArraySerializer.new(
            records,
            each_serializer: RequestTypeSerializer
          ).to_a,
          meta: pagy_meta(pagy)
        }
      end

      def create
        authorize! :create, RequestType

        existing = current_user.tenant.request_types.find_by(name: params[:name])
        if existing
          return render json: {
            error: "Request type '#{params[:name]}' already exists for this tenant",
            existing_id: existing.id,
            suggestion: "Use PATCH /api/v1/request_types/#{existing.id} to update approvers"
          }, status: :conflict
        end

        approver_ids = Array(params[:approver_ids]).uniq

        if approver_ids.empty?
          return render json: { error: "At least one approver is required" },
                        status: :unprocessable_entity
        end

        approvers = current_user
          .tenant
          .users
          .where(id: approver_ids, role: "approver")

        if approvers.size != approver_ids.size
          return render json: { error: "Invalid approvers provided" },
                        status: :unprocessable_entity
        end

        request_type = RequestType.new(
          tenant: current_user.tenant,
          name: params[:name]
        )

        ActiveRecord::Base.transaction do
          request_type.save!

          approvers.each do |user|
            RequestTypeApprover.create!(
              request_type: request_type,
              user: user
            )
          end
        end

        render json: RequestTypeSerializer.new(request_type).to_json, status: :created

      rescue ActiveRecord::RecordInvalid => e
        render json: { error: e.message }, status: :unprocessable_entity
      end

      def update
        authorize! :update, RequestType

        request_type = current_user.tenant.request_types.find(params[:id])

        approver_ids = Array(params[:approver_ids]).uniq

        if approver_ids.empty?
          return render json: { error: "At least one approver is required" },
                        status: :unprocessable_entity
        end

        approvers = current_user
          .tenant
          .users
          .where(id: approver_ids, role: "approver")

        if approvers.size != approver_ids.size
          return render json: { error: "Invalid approvers provided" },
                        status: :unprocessable_entity
        end

        ActiveRecord::Base.transaction do
          # Remove old approvers
          request_type.request_type_approvers.destroy_all

          # Add new approvers
          approvers.each do |user|
            RequestTypeApprover.create!(
              request_type: request_type,
              user: user
            )
          end
        end

        render json: RequestTypeSerializer.new(request_type).to_json
      rescue ActiveRecord::RecordInvalid => e
        render json: { error: e.message }, status: :unprocessable_entity
      end

      def destroy
        request_type = current_user.tenant.request_types.find(params[:id])
        authorize! :destroy, request_type

        request_type.destroy

        render json: { message: "Request type deleted successfully" }
      end
    end
  end
end
