require 'swagger_helper'

RSpec.describe 'Authentication API', type: :request do
  path '/api/v1/auth/login' do
    post 'User login' do
      tags 'Authentication'
      description 'Authenticate a user and receive a JWT token. The token should be used in the Authorization header for subsequent requests.'
      consumes 'application/json'
      produces 'application/json'

      parameter name: :credentials, in: :body, schema: {
        type: :object,
        properties: {
          email: {
            type: :string,
            format: :email,
            description: 'User email address',
            example: 'admin@example.com'
          },
          password: {
            type: :string,
            format: :password,
            description: 'User password',
            example: 'password123'
          }
        },
        required: [ 'email', 'password' ]
      }

      response '200', 'successful login' do
        schema type: :object,
          properties: {
            token: {
              type: :string,
              description: 'JWT authentication token',
              example: 'eyJhbGciOiJIUzI1NiJ9...'
            },
            user: {
              type: :object,
              properties: {
                id: { type: :integer, example: 1 },
                email: { type: :string, example: 'admin@example.com' },
                name: { type: :string, example: 'John Doe' },
                role: { type: :string, enum: [ 'admin', 'approver', 'user' ], example: 'admin' },
                tenant_id: { type: :integer, example: 1 }
              }
            }
          },
          required: [ 'token', 'user' ]

        let(:tenant) { create(:tenant) }
        let(:user) { create(:user, :admin, tenant: tenant, email: 'admin@example.com', password: 'password123') }
        let(:credentials) { { email: user.email, password: 'password123' } }

        before { user } # Ensure user exists

        run_test! do |response|
          data = JSON.parse(response.body)
          expect(data['token']).to be_present
          expect(data['user']['email']).to eq(user.email)
        end
      end

      response '401', 'invalid credentials' do
        schema '$ref' => '#/components/schemas/Error'

        let(:credentials) { { email: 'wrong@example.com', password: 'wrongpassword' } }

        run_test! do |response|
          data = JSON.parse(response.body)
          expect(data['error']).to be_present
        end
      end

      response '422', 'missing parameters' do
        schema '$ref' => '#/components/schemas/Error'

        let(:credentials) { { email: 'test@example.com' } }

        run_test!
      end
    end
  end

  path '/api/v1/auth/signup' do
    post 'User registration' do
      tags 'Authentication'
      description 'Register a new user account. Creates a new tenant for the user.'
      consumes 'application/json'
      produces 'application/json'
      security []  # No authentication required for signup

      parameter name: :user_params, in: :body, schema: {
        type: :object,
        properties: {
          email: {
            type: :string,
            format: :email,
            description: 'User email address',
            example: 'newuser@example.com'
          },
          password: {
            type: :string,
            format: :password,
            description: 'User password (minimum 6 characters)',
            example: 'securepassword123'
          },
          name: {
            type: :string,
            description: 'User full name',
            example: 'Jane Smith'
          },
          organization_name: {
            type: :string,
            description: 'Organization/tenant name',
            example: 'Acme Corp'
          }
        },
        required: [ 'email', 'password', 'name', 'organization_name' ]
      }

      response '201', 'user created successfully' do
        schema type: :object,
          properties: {
            token: { type: :string },
            user: {
              type: :object,
              properties: {
                id: { type: :integer },
                email: { type: :string },
                name: { type: :string },
                role: { type: :string },
                tenant_id: { type: :integer }
              }
            }
          }

        let(:user_params) do
          {
            email: 'newuser@example.com',
            password: 'password123',
            name: 'Jane Smith',
            organization_name: 'Acme Corp'
          }
        end

        run_test!
      end

      response '422', 'validation error' do
        schema '$ref' => '#/components/schemas/Error'

        let(:user_params) { { email: 'invalid-email' } }

        run_test!
      end
    end
  end
end
