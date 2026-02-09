# API Documentation Quick Start Guide

## 🎉 Success! Your API Documentation is Ready

Your approval engine API has been fully documented using RSwag (OpenAPI 3.0). The documentation is interactive, comprehensive, and automatically stays in sync with your tests.

## 📍 Access Your Documentation

### Option 1: Swagger UI (Interactive)

1. **Start your Rails server** (if not already running):
   ```bash
   rails server
   ```

2. **Open your browser** and navigate to:
   ```
   http://localhost:3000/api-docs
   ```

3. **Explore the API**:
   - Browse all endpoints organized by tags
   - View request/response schemas
   - Try out API calls directly from the browser
   - See authentication requirements

### Option 2: Raw OpenAPI Spec

The OpenAPI specification is available at:
```
/home/ameen-khan/approval_engine/swagger/v1/swagger.yaml
```

You can:
- Import it into Postman
- Use it with API testing tools
- Share it with frontend developers
- Generate client SDKs

## 🔐 Authentication Flow

Most endpoints require JWT authentication. Here's how to get started:

### 1. Login to Get Token

**Endpoint**: `POST /api/v1/auth/login`

**Request**:
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "name": "Admin User",
    "role": "admin",
    "tenant_id": 1
  }
}
```

### 2. Use Token in Subsequent Requests

Add the token to the `Authorization` header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

### 3. In Swagger UI

1. Click the **"Authorize"** button (top right)
2. Enter your token (without "Bearer" prefix)
3. Click "Authorize"
4. All subsequent requests will include the token automatically

## 📚 API Endpoints Overview

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/signup` - User registration

### Request Types
- `GET /api/v1/request_types` - List all request types
- `POST /api/v1/request_types` - Create request type (admin only)
- `GET /api/v1/request_types/:id` - Show request type
- `PUT /api/v1/request_types/:id` - Update request type (admin only)
- `DELETE /api/v1/request_types/:id` - Delete request type (admin only)

### Requests
- `GET /api/v1/requests` - List user's requests
- `POST /api/v1/requests` - Create new request
- `GET /api/v1/requests/:id` - Show request details
- `GET /api/v1/requests/balance` - Check quota/balance

### Approver
- `GET /api/v1/approver/requests` - List pending approvals (approver inbox)
- `POST /api/v1/approver/requests/:id/approve` - Approve request
- `POST /api/v1/approver/requests/:id/reject` - Reject request

### Users
- `GET /api/v1/users` - List all users
- `POST /api/v1/users` - Create user (admin only)
- `GET /api/v1/users/:id` - Show user
- `PUT /api/v1/users/:id` - Update user (admin only)
- `DELETE /api/v1/users/:id` - Delete user (admin only)

### Rules
- `GET /api/v1/rules` - List all rules
- `POST /api/v1/rules` - Create rule (admin only)
- `GET /api/v1/rules/:id` - Show rule
- `PUT /api/v1/rules/:id` - Update rule (admin only)
- `DELETE /api/v1/rules/:id` - Delete rule (admin only)

## 🔄 Updating Documentation

When you add or modify endpoints:

1. **Create/update integration spec** in `spec/integration/`:
   ```ruby
   require 'swagger_helper'

   RSpec.describe 'My API', type: :request do
     path '/api/v1/my_endpoint' do
       get 'Description' do
         tags 'My Tag'
         # ... define parameters and responses
       end
     end
   end
   ```

2. **Regenerate documentation**:
   ```bash
   RAILS_ENV=test rake rswag:specs:swaggerize
   ```

3. **Refresh browser** to see updates in Swagger UI

## 📖 Example API Calls

### Create a Request Type

```bash
curl -X POST http://localhost:3000/api/v1/request_types \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "expense",
    "approver_ids": [1, 2]
  }'
```

### Submit a Request

```bash
curl -X POST http://localhost:3000/api/v1/requests \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "request_type_id": 1,
    "requested_value": 5000.00
  }'
```

### Approve a Request

```bash
curl -X POST http://localhost:3000/api/v1/approver/requests/1/approve \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "comments": "Approved based on budget availability"
  }'
```

## 🎯 Key Features

### Pagination
Most list endpoints support pagination:
- `?page=1` - Page number
- `?items=20` - Items per page

Response includes metadata:
```json
{
  "data": [...],
  "meta": {
    "count": 100,
    "page": 1,
    "items": 20,
    "pages": 5,
    "last": false,
    "from": 1,
    "to": 20,
    "prev": null,
    "next": 2
  }
}
```

### Error Handling
All errors follow a consistent format:
```json
{
  "error": "Error message description"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `422` - Unprocessable Entity (validation error)

### Role-Based Access Control

- **Admin**: Full access to all endpoints
- **Approver**: Can view and approve/reject assigned requests
- **User**: Can create and view own requests

## 🛠️ Testing the API

### Using Swagger UI
1. Navigate to http://localhost:3000/api-docs
2. Click "Authorize" and enter your token
3. Expand any endpoint
4. Click "Try it out"
5. Fill in parameters
6. Click "Execute"
7. View response

### Using Postman
1. Import `swagger/v1/swagger.yaml`
2. Set up environment variable for token
3. Use collection to test all endpoints

### Using cURL
See example commands above

## 📁 File Structure

```
spec/
├── integration/              # RSwag integration specs
│   ├── auth_spec.rb
│   ├── request_types_spec.rb
│   ├── requests_spec.rb
│   ├── approver_requests_spec.rb
│   ├── users_spec.rb
│   ├── rules_spec.rb
│   └── README.md
├── swagger_helper.rb         # RSwag configuration
└── requests/                 # Regular RSpec tests

swagger/
└── v1/
    └── swagger.yaml          # Generated OpenAPI spec

config/initializers/
├── rswag_api.rb             # API configuration
└── rswag_ui.rb              # UI configuration
```

## 🚀 Next Steps

1. **Share with team**: Send them the Swagger UI URL
2. **Generate client SDKs**: Use OpenAPI generators for various languages
3. **API versioning**: Create v2 when needed
4. **Add more examples**: Enhance specs with more realistic data
5. **Custom themes**: Customize Swagger UI appearance

## 📞 Support

For more information:
- [RSwag Documentation](https://github.com/rswag/rswag)
- [OpenAPI Specification](https://swagger.io/specification/)
- Integration specs: `spec/integration/README.md`

## ✅ What's Documented

✓ All authentication endpoints
✓ Complete CRUD for Request Types
✓ Complete CRUD for Requests
✓ Approver workflow (inbox, approve, reject)
✓ Complete CRUD for Users
✓ Complete CRUD for Rules
✓ Request/response schemas
✓ Authentication requirements
✓ Pagination support
✓ Error responses
✓ Role-based access control
✓ Example values and descriptions

Your API is now fully documented and ready to use! 🎉
