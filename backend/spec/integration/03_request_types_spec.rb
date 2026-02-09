require 'swagger_helper'

RSpec.describe 'Request Types API', type: :request do
  let(:tenant) { create(:tenant) }
  let(:admin) { create(:user, :admin, tenant: tenant) }
  let(:user) { create(:user, tenant: tenant) }
  let(:approver) { create(:user, :approver, tenant: tenant) }
  let(:token) { generate_token(admin) }
  let(:Authorization) { "Bearer #{token}" }

  path '/api/v1/request_types' do
    get 'List all request types' do
      tags 'Request Types'
      description 'Retrieve all request types for the current tenant. Available to all authenticated users.'
      produces 'application/json'
      security [ { bearerAuth: [] } ]

      parameter name: :Authorization, in: :header, type: :string, required: true,
                description: 'Bearer token for authentication'

      response '200', 'request types found' do
        schema type: :object,
          properties: {
            data: {
              type: :array,
              items: {
                type: :object,
                properties: {
                  id: { type: :integer, example: 1 },
                  name: { type: :string, example: 'expense' },
                  tenant_id: { type: :integer, example: 1 },
                  created_at: { type: :string, format: :datetime },
                  updated_at: { type: :string, format: :datetime },
                  approvers: {
                    type: :array,
                    items: {
                      type: :object,
                      properties: {
                        id: { type: :integer },
                        name: { type: :string },
                        email: { type: :string }
                      }
                    }
                  }
                }
              }
            }
          }

        let!(:request_type1) { create(:request_type, tenant: tenant, name: 'expense') }
        let!(:request_type2) { create(:request_type, tenant: tenant, name: 'leave') }

        run_test! do |response|
          data = JSON.parse(response.body)
          expect(data['data'].length).to eq(2)
        end
      end

      response '401', 'unauthorized' do
        schema '$ref' => '#/components/schemas/Error'
        let(:Authorization) { 'Bearer invalid_token' }
        run_test!
      end
    end

    post 'Create a new request type' do
      tags 'Request Types'
      description 'Create a new request type with assigned approvers. Only admins can create request types.'
      consumes 'application/json'
      produces 'application/json'
      security [ { bearerAuth: [] } ]

      parameter name: :Authorization, in: :header, type: :string, required: true
      parameter name: :request_type, in: :body, schema: {
        type: :object,
        properties: {
          name: {
            type: :string,
            description: 'Name of the request type',
            example: 'discount'
          },
          approver_ids: {
            type: :array,
            items: { type: :integer },
            description: 'Array of user IDs who will be approvers for this request type',
            example: [ 1, 2, 3 ]
          }
        },
        required: [ 'name', 'approver_ids' ]
      }

      response '201', 'request type created' do
        schema type: :object,
          properties: {
            data: {
              type: :object,
              properties: {
                id: { type: :integer },
                name: { type: :string },
                tenant_id: { type: :integer },
                approvers: {
                  type: :array,
                  items: {
                    type: :object,
                    properties: {
                      id: { type: :integer },
                      name: { type: :string },
                      email: { type: :string }
                    }
                  }
                }
              }
            }
          }

        let(:request_type) do
          {
            name: 'discount',
            approver_ids: [ approver.id ]
          }
        end

        run_test! do |response|
          data = JSON.parse(response.body)
          expect(data['data']['name']).to eq('discount')
          expect(data['data']['approvers'].length).to eq(1)
        end
      end

      response '409', 'request type already exists' do
        schema '$ref' => '#/components/schemas/Error'

        let!(:existing) { create(:request_type, tenant: tenant, name: 'expense') }
        let(:request_type) do
          {
            name: 'expense',
            approver_ids: [ approver.id ]
          }
        end

        run_test!
      end

      response '422', 'validation error - no approvers' do
        schema '$ref' => '#/components/schemas/Error'

        let(:request_type) do
          {
            name: 'discount',
            approver_ids: []
          }
        end

        run_test! do |response|
          data = JSON.parse(response.body)
          expect(data['error']).to eq('At least one approver is required')
        end
      end

      response '422', 'validation error - invalid approvers' do
        schema '$ref' => '#/components/schemas/Error'

        let(:request_type) do
          {
            name: 'discount',
            approver_ids: [ 99999 ]
          }
        end

        run_test! do |response|
          data = JSON.parse(response.body)
          expect(data['error']).to eq('Invalid approvers provided')
        end
      end

      response '403', 'forbidden - non-admin user' do
        schema '$ref' => '#/components/schemas/Error'

        let(:token) { generate_token(user) }
        let(:request_type) do
          {
            name: 'discount',
            approver_ids: [ approver.id ]
          }
        end

        run_test!
      end
    end
  end

  path '/api/v1/request_types/{id}' do
    parameter name: :id, in: :path, type: :integer, description: 'Request Type ID'

    get 'Show a request type' do
      tags 'Request Types'
      description 'Retrieve details of a specific request type'
      produces 'application/json'
      security [ { bearerAuth: [] } ]

      parameter name: :Authorization, in: :header, type: :string, required: true

      response '200', 'request type found' do
        schema type: :object,
          properties: {
            data: {
              type: :object,
              properties: {
                id: { type: :integer },
                name: { type: :string },
                tenant_id: { type: :integer },
                approvers: { type: :array }
              }
            }
          }

        let(:id) { create(:request_type, tenant: tenant).id }

        run_test!
      end

      response '404', 'request type not found' do
        schema '$ref' => '#/components/schemas/Error'
        let(:id) { 99999 }
        run_test!
      end
    end

    put 'Update a request type' do
      tags 'Request Types'
      description 'Update approvers for a request type. Only admins can update request types.'
      consumes 'application/json'
      produces 'application/json'
      security [ { bearerAuth: [] } ]

      parameter name: :Authorization, in: :header, type: :string, required: true
      parameter name: :request_type, in: :body, schema: {
        type: :object,
        properties: {
          approver_ids: {
            type: :array,
            items: { type: :integer },
            description: 'Array of user IDs who will be approvers (replaces existing approvers)',
            example: [ 1, 2, 3 ]
          }
        },
        required: [ 'approver_ids' ]
      }

      response '200', 'request type updated' do
        schema type: :object,
          properties: {
            data: {
              type: :object,
              properties: {
                id: { type: :integer },
                name: { type: :string },
                approvers: { type: :array }
              }
            }
          }

        let(:id) { create(:request_type, tenant: tenant).id }
        let(:new_approver) { create(:user, :approver, tenant: tenant) }
        let(:request_type) { { approver_ids: [ new_approver.id ] } }

        run_test! do |response|
          data = JSON.parse(response.body)
          expect(data['data']['approvers'].length).to eq(1)
        end
      end

      response '422', 'validation error' do
        schema '$ref' => '#/components/schemas/Error'

        let(:id) { create(:request_type, tenant: tenant).id }
        let(:request_type) { { approver_ids: [] } }

        run_test!
      end

      response '403', 'forbidden - non-admin user' do
        schema '$ref' => '#/components/schemas/Error'

        let(:token) { generate_token(user) }
        let(:id) { create(:request_type, tenant: tenant).id }
        let(:request_type) { { approver_ids: [ approver.id ] } }

        run_test!
      end
    end

    delete 'Delete a request type' do
      tags 'Request Types'
      description 'Soft delete a request type. Only admins can delete request types.'
      produces 'application/json'
      security [ { bearerAuth: [] } ]

      parameter name: :Authorization, in: :header, type: :string, required: true

      response '200', 'request type deleted' do
        schema type: :object,
          properties: {
            message: { type: :string, example: 'Request type deleted successfully' }
          }

        let(:id) { create(:request_type, tenant: tenant).id }

        run_test!
      end

      response '403', 'forbidden - non-admin user' do
        schema '$ref' => '#/components/schemas/Error'

        let(:token) { generate_token(user) }
        let(:id) { create(:request_type, tenant: tenant).id }

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
