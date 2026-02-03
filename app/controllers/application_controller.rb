class ApplicationController < ActionController::API
  include Authenticatable
  include CanCan::ControllerAdditions

  attr_reader :current_user

  rescue_from CanCan::AccessDenied do |exception|
    render json: { error: "Unauthorized" }, status: :forbidden
  end
end
