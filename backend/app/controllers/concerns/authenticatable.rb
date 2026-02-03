require "jwt"
module Authenticatable
  extend ActiveSupport::Concern

  JWT_SECRET = ENV.fetch("JWT_SECRET")
  JWT_EXPIRY = ENV.fetch("JWT_EXPIRY").to_i.hours

  included do
    before_action :authenticate_user
  end

  private

  def authenticate_user
    header = request.headers["Authorization"]
    token = header.split(" ").last if header

    if token
      decoded = decode_token(token)
      @current_user = User.find_by(id: decoded["sub"])
    end

    render_unauthorized unless @current_user
  rescue JWT::DecodeError, JWT::ExpiredSignature
    render_unauthorized
  end

  def decode_token(token)
    JWT.decode(token, JWT_SECRET, true, algorithm: "HS256").first
  end

  def render_unauthorized
    render json: { error: "Unauthorized" }, status: :unauthorized
  end
end
