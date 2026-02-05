Rails.application.routes.draw do
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

      namespace :admin do
        get "reports/summary", to: "reports#summary"
      end
    end
  end
end
