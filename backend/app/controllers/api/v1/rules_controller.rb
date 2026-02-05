module Api
  module V1
    class RulesController < ApplicationController
      def index
        authorize! :read, Rule
        rules = current_user.tenant.rules.includes(:request_type)
        pagy, records = pagy(:offset, rules)

        render json: {
          data: records.map { |rule|
          {
            id: rule.id,
            request_type: rule.request_type.name,
            grade: rule.grade,
            definition: rule.definition
          }
        }, meta: pagy_meta(pagy)
        }
      end

      def create
        authorize! :create, Rule
        request_type = current_user.tenant.request_types.find(params[:request_type_id])

        rule = Rule.new(
          tenant: current_user.tenant,
          request_type: request_type,
          grade: params[:grade],
          definition: params[:definition]
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

      def destroy
        rule = current_user.tenant.rules.find(params[:id])
        authorize! :destroy, rule
        rule.destroy
        render json: { message: "Rule deleted successfully" }
      end
    end
  end
end
