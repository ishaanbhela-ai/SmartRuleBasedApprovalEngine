require 'swagger_helper'

RSpec.describe 'Users API', type: :request do
  let(:tenant) { create(:tenant) }
  let(:admin) { create(:user, :admin, tenant: tenant) }
  let(:user) { create(:user, tenant: tenant) }
  let(:token) { generate_token(admin) }
  let(:Authorization) { "Bearer #{token}" }

  path '/api/v1/users' do
    get 'List all users' do
      tags 'Users'
      description 'Retrieve all users in the current tenant. Available to all authenticated users.'
      produces 'application/json'
      security [ { bearerAuth: [] } ]

      parameter name: :Authorization, in: :header, type: :string, required: true
      parameter name: :page, in: :query, type: :integer, required: false,
                description: 'Page number for pagination'
      parameter name: :items, in: :query, type: :integer, required: false,
                description: 'Number of items per page (default: 20)'

      response '200', 'users found' do
        schema type: :object,
          properties: {
            data: {
              type: :array,
              items: {
                type: :object,
                properties: {
                  id: { type: :integer, example: 1 },
                  email: { type: :string, format: :email, example: 'user@example.com' },
                  name: { type: :string, example: 'John Doe' },
                  role: {
                    type: :string,
                    enum: [ 'admin', 'approver', 'user' ],
                    example: 'user'
                  },
                  tenant_id: { type: :integer, example: 1 },
                  created_at: { type: :string, format: :datetime },
                  updated_at: { type: :string, format: :datetime }
                }
              }
            },
            meta: { '$ref' => '#/components/schemas/PaginationMeta' }
          }

        let!(:user1) { create(:user, tenant: tenant) }
        let!(:user2) { create(:user, tenant: tenant) }

        run_test! do |response|
          data = JSON.parse(response.body)
          expect(data['data']).to be_an(Array)
          expect(data['meta']).to be_present
        end
      end

      response '401', 'unauthorized' do
        schema '$ref' => '#/components/schemas/Error'
        let(:Authorization) { 'Bearer invalid_token' }
        run_test!
      end
    end

    post 'Create a new user' do
      tags 'Users'
      description 'Create a new user in the tenant. Only admins can create users.'
      consumes 'application/json'
      produces 'application/json'
      security [ { bearerAuth: [] } ]

      parameter name: :Authorization, in: :header, type: :string, required: true
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
          role: {
            type: :string,
            enum: [ 'admin', 'approver', 'user' ],
            description: 'User role',
            example: 'user'
          }
        },
        required: [ 'email', 'password', 'name', 'role' ]
      }

      response '201', 'user created' do
        schema type: :object,
          properties: {
            data: {
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
            role: 'user'
          }
        end

        run_test!
      end

      response '422', 'validation error' do
        schema '$ref' => '#/components/schemas/Error'

        let(:user_params) do
          {
            email: 'invalid-email',
            password: '123',
            name: 'Test'
          }
        end

        run_test!
      end

      response '403', 'forbidden - non-admin user' do
        schema '$ref' => '#/components/schemas/Error'

        let(:token) { generate_token(user) }
        let(:user_params) do
          {
            email: 'newuser@example.com',
            password: 'password123',
            name: 'Jane Smith',
            role: 'user'
          }
        end

        run_test!
      end
    end
  end

  path '/api/v1/users/{id}' do
    parameter name: :id, in: :path, type: :integer, description: 'User ID'

    get 'Show a user' do
      tags 'Users'
      description 'Retrieve details of a specific user'
      produces 'application/json'
      security [ { bearerAuth: [] } ]

      parameter name: :Authorization, in: :header, type: :string, required: true

      response '200', 'user found' do
        schema type: :object,
          properties: {
            data: {
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

        let(:id) { create(:user, tenant: tenant).id }

        run_test!
      end

      response '404', 'user not found' do
        schema '$ref' => '#/components/schemas/Error'
        let(:id) { 99999 }
        run_test!
      end
    end

    put 'Update a user' do
      tags 'Users'
      description 'Update user details. Only admins can update users.'
      consumes 'application/json'
      produces 'application/json'
      security [ { bearerAuth: [] } ]

      parameter name: :Authorization, in: :header, type: :string, required: true
      parameter name: :user_params, in: :body, schema: {
        type: :object,
        properties: {
          name: { type: :string, example: 'Updated Name' },
          role: { type: :string, enum: [ 'admin', 'approver', 'user' ] }
        }
      }

      response '200', 'user updated' do
        schema type: :object,
          properties: {
            data: {
              type: :object,
              properties: {
                id: { type: :integer },
                email: { type: :string },
                name: { type: :string },
                role: { type: :string }
              }
            }
          }

        let(:id) { create(:user, tenant: tenant).id }
        let(:user_params) { { name: 'Updated Name' } }

        run_test!
      end

      response '403', 'forbidden - non-admin user' do
        schema '$ref' => '#/components/schemas/Error'

        let(:token) { generate_token(user) }
        let(:id) { create(:user, tenant: tenant).id }
        let(:user_params) { { name: 'Updated Name' } }

        run_test!
      end
    end

    delete 'Delete a user' do
      tags 'Users'
      description 'Soft delete a user. Only admins can delete users.'
      produces 'application/json'
      security [ { bearerAuth: [] } ]

      parameter name: :Authorization, in: :header, type: :string, required: true

      response '200', 'user deleted' do
        schema type: :object,
          properties: {
            message: { type: :string, example: 'User deleted successfully' }
          }

        let(:id) { create(:user, tenant: tenant).id }

        run_test!
      end

      response '403', 'forbidden - non-admin user' do
        schema '$ref' => '#/components/schemas/Error'

        let(:token) { generate_token(user) }
        let(:id) { create(:user, tenant: tenant).id }

        run_test!
      end
    end
  end

  def generate_token(user)
    payload = {
      sub: user.id,
      tenant_id: user.tenant_id,
      role: user.role,
      exp: 24.hours.from_now.to_i
    }
    JWT.encode(payload, ENV.fetch('JWT_SECRET'), 'HS256')
  end
end
