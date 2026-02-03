module Api
  module V1
    class UsersController < ApplicationController
      def index
        authorize! :read, User

        users = current_user.tenant.users

        render json: users.map { |u|
          {
            id: u.id,
            email: u.email,
            name: u.name,
            role: u.role,
            grade: u.grade,
            created_at: u.created_at
          }
        }
      end

      def create
        authorize! :create, User

        user = User.new(user_params)
        user.tenant = current_user.tenant

        if user.save
          render json: {
            id: user.id,
            email: user.email,
            role: user.role,
            grade: user.grade
          }, status: :created
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
