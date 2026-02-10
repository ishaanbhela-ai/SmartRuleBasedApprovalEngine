module Api
  module V1
    class AuthController < ApplicationController
      skip_before_action :authenticate_user, only: [ :login ]

      def login
        user = User.find_by(email: params[:email])

        if user&.authenticate(params[:password])
          token = encode_token(user)
          render json: {
            token: token,
            user: UserSerializer.new.serialize(user)
          }
        else
          render json: { error: "Invalid email or password" }, status: :unauthorized
        end
      end

      private

      def encode_token(user)
        payload = {
          sub: user.id,
          tenant_id: user.tenant_id,
          role: user.role,
          exp: JWT_EXPIRY.from_now.to_i
        }
        JWT.encode(payload, JWT_SECRET, "HS256")
      end
    end
  end
end
