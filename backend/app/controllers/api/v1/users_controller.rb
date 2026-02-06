module Api
  module V1
    class UsersController < ApplicationController
      def index
        authorize! :read, User

        users = current_user.tenant.users
        pagy, records = pagy(:offset, users, limit: (params[:per_page] || params[:limit] || 10).to_i)

        render json: {
          data: Panko::ArraySerializer.new(
            records,
            each_serializer: UserSerializer
          ).to_a,
          meta: pagy_meta(pagy)
        }
      end

      def create
        authorize! :create, User

        user = User.new(user_params)
        user.tenant = current_user.tenant

        if user.save
          render json: UserSerializer.new(user).to_json, status: :created
        else
          render json: { errors: user.errors.full_messages },
                 status: :unprocessable_entity
        end
      end
      def destroy
        user = current_user.tenant.users.find(params[:id])
        authorize! :destroy, user

        if user.id == current_user.id
          return render json: { error: "You cannot delete yourself" },
                        status: :unprocessable_entity
        end

        user.destroy!

        render json: { message: "User deleted successfully" }
      end

      private

      def user_params
        params.require(:user).permit(
          :email,
          :password,
          :name,
          :role,
          :grade
        )
      end
    end
  end
end
