module Api
  module V1
    class RulesController < ApplicationController
      def index
        authorize! :read, Rule
        rules = current_user.tenant.rules.includes(:request_type)

        render json: rules.map { |rule|
          {
            id: rule.id,
            request_type: rule.request_type.name,
            grade: rule.grade,
            definition: rule.definition,
            is_active: rule.is_active
          }
        }
      end

      def create
        authorize! :create, Rule
        request_type = current_user.tenant.request_types.find(params[:request_type_id])

        rule = Rule.new(
          tenant: current_user.tenant,
          request_type: request_type,
          grade: params[:grade],
          definition: params[:definition],
          is_active: true
        )

        if rule.save
          render json: {
            id: rule.id,
            request_type: request_type.name,
            grade: rule.grade,
            definition: rule.definition
          }, status: :created
        else
          render json: { errors: rule.errors.full_messages },
                 status: :unprocessable_entity
        end
      end
    end
  end
end
