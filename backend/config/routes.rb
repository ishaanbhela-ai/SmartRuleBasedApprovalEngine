Rails.application.routes.draw do
  # Serve swagger.yaml file
  get "/api-docs/v1/swagger.yaml", to: "swagger#index"

  mount Rswag::Api::Engine => "/api-docs"
  mount Rswag::Ui::Engine => "/api-docs"
  get "up" => "rails/health#show", as: :rails_health_check

  # Defines the root path route ("/")
  # root "posts#index"
  namespace :api do
    namespace :v1 do
      post "login", to: "auth#login"
      resources :users, only: [ :create, :index, :destroy ]
      resources :request_types, only: [ :create, :index, :destroy, :update ]
      resources :rules, only: [ :create, :index, :destroy ]
      resources :requests, only: [ :create, :index, :show ] do
        collection do
          get :balance
        end
      end

      namespace :approver do
        resources :requests, only: [ :index, :update, :show ]
      end

      # Personalized reports for all users
      get "reports/me", to: "reports#me"

      namespace :admin do
        get "reports/summary", to: "reports#summary"
      end
    end
  end
end
