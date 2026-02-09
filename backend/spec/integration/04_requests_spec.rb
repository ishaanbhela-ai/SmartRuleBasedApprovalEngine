require 'swagger_helper'

RSpec.describe 'Requests API', type: :request do
  let(:tenant) { create(:tenant) }
  let(:admin) { create(:user, :admin, tenant: tenant) }
  let(:user) { create(:user, tenant: tenant) }
  let(:approver) { create(:user, :approver, tenant: tenant) }
  let(:token) { generate_token(user) }
  let(:Authorization) { "Bearer #{token}" }

  path '/api/v1/requests' do
    get 'List user requests' do
      tags 'Requests'
      description 'Retrieve all requests created by the current user. Admins see all requests in their tenant.'
      produces 'application/json'
      security [ { bearerAuth: [] } ]

      parameter name: :Authorization, in: :header, type: :string, required: true
      parameter name: :page, in: :query, type: :integer, required: false,
                description: 'Page number for pagination'
      parameter name: :items, in: :query, type: :integer, required: false,
                description: 'Number of items per page (default: 20)'

      response '200', 'requests found' do
        schema type: :object,
          properties: {
            data: {
              type: :array,
              items: {
                type: :object,
                properties: {
                  id: { type: :integer, example: 1 },
                  request_type_id: { type: :integer, example: 1 },
                  requester_id: { type: :integer, example: 1 },
                  requested_value: { type: :number, format: :decimal, example: 5000.00 },
                  status: {
                    type: :string,
                    enum: [ 'submitted', 'pending', 'approved', 'rejected' ],
                    example: 'pending'
                  },
                  created_at: { type: :string, format: :datetime },
                  updated_at: { type: :string, format: :datetime },
                  requester: {
                    type: :object,
                    properties: {
                      id: { type: :integer },
                      name: { type: :string },
                      email: { type: :string }
                    }
                  },
                  request_type: {
                    type: :object,
                    properties: {
                      id: { type: :integer },
                      name: { type: :string }
                    }
                  },
                  approval: {
                    type: :object,
                    nullable: true,
                    properties: {
                      id: { type: :integer },
                      status: { type: :string },
                      approver_id: { type: :integer }
                    }
                  }
                }
              }
            },
            meta: { '$ref' => '#/components/schemas/PaginationMeta' }
          }

        let!(:request1) { create(:request, tenant: tenant, requester: user) }
        let!(:request2) { create(:request, tenant: tenant, requester: user) }

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

    post 'Create a new request' do
      tags 'Requests'
      description 'Submit a new approval request. The request will be automatically evaluated against configured rules.'
      consumes 'application/json'
      produces 'application/json'
      security [ { bearerAuth: [] } ]

      parameter name: :Authorization, in: :header, type: :string, required: true
      parameter name: :request_params, in: :body, schema: {
        type: :object,
        properties: {
          request_type_id: {
            type: :integer,
            description: 'ID of the request type',
            example: 1
          },
          requested_value: {
            type: :number,
            format: :decimal,
            description: 'The value being requested (e.g., amount, days)',
            example: 5000.00
          }
        },
        required: [ 'request_type_id', 'requested_value' ]
      }

      response '201', 'request created and evaluated' do
        schema type: :object,
          properties: {
            data: {
              type: :object,
              properties: {
                id: { type: :integer },
                request_type_id: { type: :integer },
                requester_id: { type: :integer },
                requested_value: { type: :number },
                status: { type: :string },
                created_at: { type: :string, format: :datetime },
                updated_at: { type: :string, format: :datetime }
              }
            }
          }

        let(:request_type) { create(:request_type, tenant: tenant) }
        let(:request_params) do
          {
            request_type_id: request_type.id,
            requested_value: 5000.00
          }
        end

        run_test! do |response|
          data = JSON.parse(response.body)
          expect(data['data']['status']).to be_in([ 'submitted', 'pending', 'approved', 'rejected' ])
        end
      end

      response '422', 'validation error' do
        schema '$ref' => '#/components/schemas/Error'

        let(:request_params) do
          {
            request_type_id: nil,
            requested_value: 5000.00
          }
        end

        run_test!
      end

      response '403', 'forbidden - insufficient permissions' do
        schema '$ref' => '#/components/schemas/Error'

        let(:request_type) { create(:request_type, tenant: create(:tenant)) }
        let(:request_params) do
          {
            request_type_id: request_type.id,
            requested_value: 5000.00
          }
        end

        run_test!
      end
    end
  end

  path '/api/v1/requests/{id}' do
    parameter name: :id, in: :path, type: :integer, description: 'Request ID'

    get 'Show a request' do
      tags 'Requests'
      description 'Retrieve details of a specific request. Users can only view their own requests unless they are admins or assigned approvers.'
      produces 'application/json'
      security [ { bearerAuth: [] } ]

      parameter name: :Authorization, in: :header, type: :string, required: true

      response '200', 'request found' do
        schema type: :object,
          properties: {
            data: {
              type: :object,
              properties: {
                id: { type: :integer },
                request_type_id: { type: :integer },
                requester_id: { type: :integer },
                requested_value: { type: :number },
                status: { type: :string },
                created_at: { type: :string, format: :datetime },
                updated_at: { type: :string, format: :datetime },
                requester: { type: :object },
                request_type: { type: :object },
                approval: { type: :object, nullable: true }
              }
            }
          }

        let(:id) { create(:request, tenant: tenant, requester: user).id }

        run_test!
      end

      response '404', 'request not found' do
        schema '$ref' => '#/components/schemas/Error'
        let(:id) { 99999 }
        run_test!
      end

      response '403', 'forbidden - cannot view other user requests' do
        schema '$ref' => '#/components/schemas/Error'

        let(:other_user) { create(:user, tenant: tenant) }
        let(:id) { create(:request, tenant: tenant, requester: other_user).id }

        run_test!
      end
    end
  end

  path '/api/v1/requests/balance' do
    get 'Check request balance/quota' do
      tags 'Requests'
      description 'Check the remaining quota for a specific request type. Useful for displaying available balance before submitting a request.'
      produces 'application/json'
      security [ { bearerAuth: [] } ]

      parameter name: :Authorization, in: :header, type: :string, required: true
      parameter name: :request_type_id, in: :query, type: :integer, required: true,
                description: 'ID of the request type to check balance for'

      response '200', 'balance retrieved' do
        schema type: :object,
          properties: {
            request_type: {
              type: :string,
              description: 'Name of the request type',
              example: 'expense'
            },
            limit: {
              type: :number,
              format: :decimal,
              description: 'Total limit/quota for this request type',
              example: 10000.00
            },
            used: {
              type: :number,
              format: :decimal,
              description: 'Amount already used',
              example: 3500.00
            },
            remaining: {
              type: :number,
              format: :decimal,
              description: 'Remaining available quota',
              example: 6500.00
            }
          }

        let(:request_type) { create(:request_type, tenant: tenant, name: 'expense') }
        let(:request_type_id) { request_type.id }

        run_test! do |response|
          data = JSON.parse(response.body)
          expect(data['request_type']).to eq('expense')
          expect(data).to have_key('limit')
          expect(data).to have_key('used')
          expect(data).to have_key('remaining')
        end
      end

      response '404', 'request type not found' do
        schema '$ref' => '#/components/schemas/Error'
        let(:request_type_id) { 99999 }
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
