# API Documentation with RSwag

This directory contains integration tests that also serve as API documentation using RSwag.

## Overview

RSwag combines RSpec integration tests with OpenAPI (Swagger) documentation generation. Each test file in the `spec/integration/` directory defines API endpoints, their parameters, responses, and examples.

## Directory Structure

```
spec/
├── integration/           # RSwag integration specs (API documentation)
│   ├── auth_spec.rb
│   ├── request_types_spec.rb
│   ├── requests_spec.rb
│   ├── approver_requests_spec.rb
│   ├── users_spec.rb
│   └── rules_spec.rb
├── swagger_helper.rb      # RSwag configuration
└── requests/              # Regular RSpec request specs
```

## API Endpoints Documented

### Authentication (`auth_spec.rb`)
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/signup` - User registration

### Request Types (`request_types_spec.rb`)
- `GET /api/v1/request_types` - List all request types
- `POST /api/v1/request_types` - Create a request type
- `GET /api/v1/request_types/:id` - Show a request type
- `PUT /api/v1/request_types/:id` - Update a request type
- `DELETE /api/v1/request_types/:id` - Delete a request type

### Requests (`requests_spec.rb`)
- `GET /api/v1/requests` - List user's requests
- `POST /api/v1/requests` - Create a new request
- `GET /api/v1/requests/:id` - Show a request
- `GET /api/v1/requests/balance` - Check quota/balance

### Approver (`approver_requests_spec.rb`)
- `GET /api/v1/approver/requests` - List pending approvals
- `POST /api/v1/approver/requests/:id/approve` - Approve a request
- `POST /api/v1/approver/requests/:id/reject` - Reject a request

### Users (`users_spec.rb`)
- `GET /api/v1/users` - List all users
- `POST /api/v1/users` - Create a user
- `GET /api/v1/users/:id` - Show a user
- `PUT /api/v1/users/:id` - Update a user
- `DELETE /api/v1/users/:id` - Delete a user

### Rules (`rules_spec.rb`)
- `GET /api/v1/rules` - List all rules
- `POST /api/v1/rules` - Create a rule
- `GET /api/v1/rules/:id` - Show a rule
- `PUT /api/v1/rules/:id` - Update a rule
- `DELETE /api/v1/rules/:id` - Delete a rule

## Generating Documentation

### 1. Generate Swagger JSON/YAML

Run the following command to generate the OpenAPI documentation:

```bash
rake rswag:specs:swaggerize
```

This will:
- Run all integration specs in `spec/integration/`
- Generate `swagger/v1/swagger.yaml` with the complete API documentation

### 2. View Documentation

Start your Rails server:

```bash
rails server
```

Then visit: **http://localhost:3000/api-docs**

You'll see an interactive Swagger UI where you can:
- Browse all API endpoints
- See request/response schemas
- Try out API calls directly from the browser
- View authentication requirements

## Writing New API Documentation

To document a new endpoint:

1. Create a new file in `spec/integration/` (e.g., `spec/integration/my_resource_spec.rb`)

2. Use the RSwag DSL:

```ruby
require 'swagger_helper'

RSpec.describe 'My Resource API', type: :request do
  path '/api/v1/my_resources' do
    get 'List resources' do
      tags 'My Resources'
      description 'Retrieve all resources'
      produces 'application/json'
      security [{ bearerAuth: [] }]

      parameter name: :Authorization, in: :header, type: :string, required: true

      response '200', 'resources found' do
        schema type: :object,
          properties: {
            data: {
              type: :array,
              items: {
                type: :object,
                properties: {
                  id: { type: :integer },
                  name: { type: :string }
                }
              }
            }
          }

        run_test!
      end
    end
  end
end
```

3. Run `rake rswag:specs:swaggerize` to regenerate documentation

## Testing vs Documentation

These specs serve dual purposes:

1. **Testing**: They run as normal RSpec tests, validating your API behavior
2. **Documentation**: They generate OpenAPI specs for interactive documentation

Run tests normally:
```bash
rspec spec/integration/
```

Or run specific spec:
```bash
rspec spec/integration/auth_spec.rb
```

## Authentication

Most endpoints require JWT authentication. The documentation shows:

- Which endpoints require authentication (via `security [{ bearerAuth: [] }]`)
- How to obtain a token (via `/api/v1/auth/login`)
- How to use the token (in `Authorization: Bearer <token>` header)

In Swagger UI, you can:
1. Click "Authorize" button
2. Enter your JWT token
3. All subsequent requests will include the token

## Common Schemas

Reusable schemas are defined in `swagger_helper.rb`:

- `Error` - Standard error response format
- `PaginationMeta` - Pagination metadata structure

Reference them in specs:
```ruby
schema '$ref' => '#/components/schemas/Error'
```

## Tips

1. **Keep specs DRY**: Use `let` blocks for common test data
2. **Add examples**: Include realistic example values in schemas
3. **Document edge cases**: Include error responses (401, 403, 422, etc.)
4. **Use descriptions**: Add helpful descriptions to parameters and responses
5. **Test what you document**: Ensure `run_test!` actually validates the response

## Troubleshooting

### Swagger generation fails
- Check for syntax errors in integration specs
- Ensure all required parameters are defined
- Verify schema definitions are valid

### Documentation not updating
- Run `rake rswag:specs:swaggerize` after changes
- Clear browser cache
- Restart Rails server

### Tests failing
- Check factory definitions
- Verify database state
- Review authentication setup

## Resources

- [RSwag GitHub](https://github.com/rswag/rswag)
- [OpenAPI Specification](https://swagger.io/specification/)
- [Swagger UI](https://swagger.io/tools/swagger-ui/)
