require 'swagger_helper'

RSpec.describe 'Approver API', type: :request do
  let(:tenant) { create(:tenant) }
  let(:approver) { create(:user, :approver, tenant: tenant) }
  let(:user) { create(:user, tenant: tenant) }
  let(:token) { generate_token(approver) }
  let(:Authorization) { "Bearer #{token}" }

  path '/api/v1/approver/requests' do
    get 'List pending approval requests' do
      tags 'Approver'
      description 'Retrieve all requests pending approval by the current approver. This is the approver inbox.'
      produces 'application/json'
      security [ { bearerAuth: [] } ]

      parameter name: :Authorization, in: :header, type: :string, required: true
      parameter name: :page, in: :query, type: :integer, required: false,
                description: 'Page number for pagination'
      parameter name: :items, in: :query, type: :integer, required: false,
                description: 'Number of items per page (default: 20)'

      response '200', 'pending requests found' do
        schema type: :object,
          properties: {
            data: {
              type: :array,
              items: {
                type: :object,
                properties: {
                  id: { type: :integer, example: 1 },
                  request_type_id: { type: :integer },
                  requester_id: { type: :integer },
                  requested_value: { type: :number, format: :decimal },
                  status: { type: :string, example: 'pending' },
                  created_at: { type: :string, format: :datetime },
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

        let(:request_type) { create(:request_type, tenant: tenant) }
        let!(:approval_request) do
          req = create(:request, tenant: tenant, requester: user, request_type: request_type, status: 'pending')
          create(:approval, request: req, approver: approver, status: 'pending')
          req
        end

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
  end

  path '/api/v1/approver/requests/{id}/approve' do
    parameter name: :id, in: :path, type: :integer, description: 'Request ID'

    post 'Approve a request' do
      tags 'Approver'
      description 'Approve a pending request. Only the assigned approver can approve their assigned requests.'
      consumes 'application/json'
      produces 'application/json'
      security [ { bearerAuth: [] } ]

      parameter name: :Authorization, in: :header, type: :string, required: true
      parameter name: :approval_params, in: :body, schema: {
        type: :object,
        properties: {
          comments: {
            type: :string,
            description: 'Optional comments for the approval',
            example: 'Approved based on budget availability'
          }
        }
      }

      response '200', 'request approved' do
        schema type: :object,
          properties: {
            data: {
              type: :object,
              properties: {
                id: { type: :integer },
                request_id: { type: :integer },
                approver_id: { type: :integer },
                status: { type: :string, example: 'approved' },
                comments: { type: :string, nullable: true },
                approved_at: { type: :string, format: :datetime }
              }
            }
          }

        let(:request_type) { create(:request_type, tenant: tenant) }
        let(:approval_request) do
          req = create(:request, tenant: tenant, requester: user, request_type: request_type, status: 'pending')
          create(:approval, request: req, approver: approver, status: 'pending')
          req
        end
        let(:id) { approval_request.id }
        let(:approval_params) { { comments: 'Looks good' } }

        run_test! do |response|
          data = JSON.parse(response.body)
          expect(data['data']['status']).to eq('approved')
        end
      end

      response '404', 'request not found' do
        schema '$ref' => '#/components/schemas/Error'
        let(:id) { 99999 }
        let(:approval_params) { {} }
        run_test!
      end

      response '403', 'forbidden - not assigned approver' do
        schema '$ref' => '#/components/schemas/Error'

        let(:other_approver) { create(:user, :approver, tenant: tenant) }
        let(:request_type) { create(:request_type, tenant: tenant) }
        let(:approval_request) do
          req = create(:request, tenant: tenant, requester: user, request_type: request_type, status: 'pending')
          create(:approval, request: req, approver: other_approver, status: 'pending')
          req
        end
        let(:id) { approval_request.id }
        let(:approval_params) { {} }

        run_test!
      end
    end
  end

  path '/api/v1/approver/requests/{id}/reject' do
    parameter name: :id, in: :path, type: :integer, description: 'Request ID'

    post 'Reject a request' do
      tags 'Approver'
      description 'Reject a pending request. Only the assigned approver can reject their assigned requests.'
      consumes 'application/json'
      produces 'application/json'
      security [ { bearerAuth: [] } ]

      parameter name: :Authorization, in: :header, type: :string, required: true
      parameter name: :rejection_params, in: :body, schema: {
        type: :object,
        properties: {
          comments: {
            type: :string,
            description: 'Optional comments for the rejection',
            example: 'Insufficient budget for this request'
          }
        }
      }

      response '200', 'request rejected' do
        schema type: :object,
          properties: {
            data: {
              type: :object,
              properties: {
                id: { type: :integer },
                request_id: { type: :integer },
                approver_id: { type: :integer },
                status: { type: :string, example: 'rejected' },
                comments: { type: :string, nullable: true },
                rejected_at: { type: :string, format: :datetime }
              }
            }
          }

        let(:request_type) { create(:request_type, tenant: tenant) }
        let(:approval_request) do
          req = create(:request, tenant: tenant, requester: user, request_type: request_type, status: 'pending')
          create(:approval, request: req, approver: approver, status: 'pending')
          req
        end
        let(:id) { approval_request.id }
        let(:rejection_params) { { comments: 'Budget exceeded' } }

        run_test! do |response|
          data = JSON.parse(response.body)
          expect(data['data']['status']).to eq('rejected')
        end
      end

      response '404', 'request not found' do
        schema '$ref' => '#/components/schemas/Error'
        let(:id) { 99999 }
        let(:rejection_params) { {} }
        run_test!
      end

      response '403', 'forbidden - not assigned approver' do
        schema '$ref' => '#/components/schemas/Error'

        let(:other_approver) { create(:user, :approver, tenant: tenant) }
        let(:request_type) { create(:request_type, tenant: tenant) }
        let(:approval_request) do
          req = create(:request, tenant: tenant, requester: user, request_type: request_type, status: 'pending')
          create(:approval, request: req, approver: other_approver, status: 'pending')
          req
        end
        let(:id) { approval_request.id }
        let(:rejection_params) { {} }

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
