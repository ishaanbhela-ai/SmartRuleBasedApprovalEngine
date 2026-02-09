class SwaggerController < ApplicationController
  skip_before_action :authenticate_user

  def index
    swagger_path = Rails.root.join("swagger", "v1", "swagger.yaml")

    if File.exist?(swagger_path)
      send_file swagger_path,
                type: "application/x-yaml",
                disposition: "inline",
                filename: "swagger.yaml"
    else
      render plain: "Swagger file not found", status: :not_found
    end
  end
end
