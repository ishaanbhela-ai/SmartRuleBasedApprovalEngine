module Api
  module V1
    class RequestTypesController < ApplicationController
      def index
        authorize! :read, RequestType
        request_types = current_user.tenant.request_types.includes(:approver)

        render json: request_types.map { |rt|
          {
            id: rt.id,
            name: rt.name,
            approver: {
              id: rt.approver.id,
              email: rt.approver.email,
              name: rt.approver.name
            }
          }
        }
      end

      def create
        authorize! :create, RequestType
        approver = User.find(params[:approver_id])

        unless approver.tenant_id == current_user.tenant_id
          return render json: { error: "Invalid approver" }, status: :unprocessable_entity
        end

        request_type = RequestType.new(
          tenant: current_user.tenant,
          name: params[:name],
          approver: approver
        )

        if request_type.save
          render json: {
            id: request_type.id,
            name: request_type.name,
            approver_id: request_type.approver_id
          }, status: :created
        else
          render json: { errors: request_type.errors.full_messages },
                 status: :unprocessable_entity
        end
      end
    end
  end
end
