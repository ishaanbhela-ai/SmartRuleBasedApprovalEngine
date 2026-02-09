require 'swagger_helper'

RSpec.describe 'Rules API', type: :request do
  let(:tenant) { create(:tenant) }
  let(:admin) { create(:user, :admin, tenant: tenant) }
  let(:user) { create(:user, tenant: tenant) }
  let(:approver) { create(:user, :approver, tenant: tenant) }
  let(:token) { generate_token(admin) }
  let(:Authorization) { "Bearer #{token}" }

  path '/api/v1/rules' do
    get 'List all rules' do
      tags 'Rules'
      description 'Retrieve all approval rules for the current tenant. Rules define the logic for automatic approval routing.'
      produces 'application/json'
      security [ { bearerAuth: [] } ]

      parameter name: :Authorization, in: :header, type: :string, required: true

      response '200', 'rules found' do
        schema type: :object,
          properties: {
            data: {
              type: :array,
              items: {
                type: :object,
                properties: {
                  id: { type: :integer, example: 1 },
                  request_type_id: { type: :integer, example: 1 },
                  condition: {
                    type: :object,
                    description: 'Rule condition in JSON format',
                    example: {
                      operator: 'AND',
                      conditions: [
                        { field: 'requested_value', operator: '>', value: 1000 }
                      ]
                    }
                  },
                  action: {
                    type: :object,
                    description: 'Action to take when rule matches',
                    example: {
                      type: 'assign_approver',
                      approver_id: 1
                    }
                  },
                  priority: {
                    type: :integer,
                    description: 'Rule priority (lower number = higher priority)',
                    example: 1
                  },
                  active: {
                    type: :boolean,
                    description: 'Whether the rule is active',
                    example: true
                  },
                  created_at: { type: :string, format: :datetime },
                  updated_at: { type: :string, format: :datetime }
                }
              }
            }
          }

        let(:request_type) { create(:request_type, tenant: tenant) }
        let!(:rule1) { create(:rule, request_type: request_type) }
        let!(:rule2) { create(:rule, request_type: request_type) }

        run_test! do |response|
          data = JSON.parse(response.body)
          expect(data['data']).to be_an(Array)
        end
      end

      response '401', 'unauthorized' do
        schema '$ref' => '#/components/schemas/Error'
        let(:Authorization) { 'Bearer invalid_token' }
        run_test!
      end
    end

    post 'Create a new rule' do
      tags 'Rules'
      description 'Create a new approval rule. Only admins can create rules. Rules are evaluated in priority order when a request is submitted.'
      consumes 'application/json'
      produces 'application/json'
      security [ { bearerAuth: [] } ]

      parameter name: :Authorization, in: :header, type: :string, required: true
      parameter name: :rule_params, in: :body, schema: {
        type: :object,
        properties: {
          request_type_id: {
            type: :integer,
            description: 'ID of the request type this rule applies to',
            example: 1
          },
          condition: {
            type: :object,
            description: 'Rule condition in JSON format. Supports nested AND/OR operators.',
            example: {
              operator: 'AND',
              conditions: [
                { field: 'requested_value', operator: '>', value: 5000 },
                { field: 'requester.role', operator: '==', value: 'user' }
              ]
            }
          },
          action: {
            type: :object,
            description: 'Action to perform when rule matches',
            example: {
              type: 'assign_approver',
              approver_id: 1
            }
          },
          priority: {
            type: :integer,
            description: 'Rule priority (lower = higher priority, default: 100)',
            example: 10
          },
          active: {
            type: :boolean,
            description: 'Whether the rule is active (default: true)',
            example: true
          }
        },
        required: [ 'request_type_id', 'condition', 'action' ]
      }

      response '201', 'rule created' do
        schema type: :object,
          properties: {
            data: {
              type: :object,
              properties: {
                id: { type: :integer },
                request_type_id: { type: :integer },
                condition: { type: :object },
                action: { type: :object },
                priority: { type: :integer },
                active: { type: :boolean }
              }
            }
          }

        let(:request_type) { create(:request_type, tenant: tenant) }
        let(:rule_params) do
          {
            request_type_id: request_type.id,
            condition: {
              operator: 'AND',
              conditions: [
                { field: 'requested_value', operator: '>', value: 1000 }
              ]
            },
            action: {
              type: 'assign_approver',
              approver_id: approver.id
            },
            priority: 10
          }
        end

        run_test! do |response|
          data = JSON.parse(response.body)
          expect(data['data']['priority']).to eq(10)
        end
      end

      response '422', 'validation error' do
        schema '$ref' => '#/components/schemas/Error'

        let(:rule_params) do
          {
            request_type_id: nil,
            condition: {},
            action: {}
          }
        end

        run_test!
      end

      response '403', 'forbidden - non-admin user' do
        schema '$ref' => '#/components/schemas/Error'

        let(:token) { generate_token(user) }
        let(:request_type) { create(:request_type, tenant: tenant) }
        let(:rule_params) do
          {
            request_type_id: request_type.id,
            condition: { operator: 'AND', conditions: [] },
            action: { type: 'auto_approve' }
          }
        end

        run_test!
      end
    end
  end

  path '/api/v1/rules/{id}' do
    parameter name: :id, in: :path, type: :integer, description: 'Rule ID'

    get 'Show a rule' do
      tags 'Rules'
      description 'Retrieve details of a specific rule'
      produces 'application/json'
      security [ { bearerAuth: [] } ]

      parameter name: :Authorization, in: :header, type: :string, required: true

      response '200', 'rule found' do
        schema type: :object,
          properties: {
            data: {
              type: :object,
              properties: {
                id: { type: :integer },
                request_type_id: { type: :integer },
                condition: { type: :object },
                action: { type: :object },
                priority: { type: :integer },
                active: { type: :boolean }
              }
            }
          }

        let(:request_type) { create(:request_type, tenant: tenant) }
        let(:id) { create(:rule, request_type: request_type).id }

        run_test!
      end

      response '404', 'rule not found' do
        schema '$ref' => '#/components/schemas/Error'
        let(:id) { 99999 }
        run_test!
      end
    end

    put 'Update a rule' do
      tags 'Rules'
      description 'Update an existing rule. Only admins can update rules.'
      consumes 'application/json'
      produces 'application/json'
      security [ { bearerAuth: [] } ]

      parameter name: :Authorization, in: :header, type: :string, required: true
      parameter name: :rule_params, in: :body, schema: {
        type: :object,
        properties: {
          condition: { type: :object },
          action: { type: :object },
          priority: { type: :integer },
          active: { type: :boolean }
        }
      }

      response '200', 'rule updated' do
        schema type: :object,
          properties: {
            data: {
              type: :object,
              properties: {
                id: { type: :integer },
                condition: { type: :object },
                action: { type: :object },
                priority: { type: :integer },
                active: { type: :boolean }
              }
            }
          }

        let(:request_type) { create(:request_type, tenant: tenant) }
        let(:id) { create(:rule, request_type: request_type).id }
        let(:rule_params) { { priority: 5, active: false } }

        run_test! do |response|
          data = JSON.parse(response.body)
          expect(data['data']['priority']).to eq(5)
          expect(data['data']['active']).to eq(false)
        end
      end

      response '403', 'forbidden - non-admin user' do
        schema '$ref' => '#/components/schemas/Error'

        let(:token) { generate_token(user) }
        let(:request_type) { create(:request_type, tenant: tenant) }
        let(:id) { create(:rule, request_type: request_type).id }
        let(:rule_params) { { active: false } }

        run_test!
      end
    end

    delete 'Delete a rule' do
      tags 'Rules'
      description 'Delete a rule. Only admins can delete rules.'
      produces 'application/json'
      security [ { bearerAuth: [] } ]

      parameter name: :Authorization, in: :header, type: :string, required: true

      response '200', 'rule deleted' do
        schema type: :object,
          properties: {
            message: { type: :string, example: 'Rule deleted successfully' }
          }

        let(:request_type) { create(:request_type, tenant: tenant) }
        let(:id) { create(:rule, request_type: request_type).id }

        run_test!
      end

      response '403', 'forbidden - non-admin user' do
        schema '$ref' => '#/components/schemas/Error'

        let(:token) { generate_token(user) }
        let(:request_type) { create(:request_type, tenant: tenant) }
        let(:id) { create(:rule, request_type: request_type).id }

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
