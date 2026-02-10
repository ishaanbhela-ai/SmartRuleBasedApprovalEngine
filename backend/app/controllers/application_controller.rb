class ApplicationController < ActionController::API
  include Authenticatable
  include CanCan::ControllerAdditions
  include Pagy::Method

  attr_reader :current_user

  rescue_from CanCan::AccessDenied do |exception|
    render json: { error: "Unauthorized" }, status: :forbidden
  end
  def pagy_meta(pagy)
    {
      page: pagy.page,
      per_page: pagy.limit,      # Pagy 43.x uses 'limit' not 'items'
      total_pages: pagy.last,    # Pagy 43.x uses 'last' not 'pages'
      total_count: pagy.count
    }
  end
end
