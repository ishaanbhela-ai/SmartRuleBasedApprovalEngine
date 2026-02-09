# Using the API with Postman

This guide shows you how to import and use the Approval Engine API in Postman.

## 📥 Import OpenAPI Spec into Postman

### Method 1: Import from File

1. **Open Postman**

2. **Click "Import"** (top left)

3. **Select "Upload Files"**

4. **Navigate to**:
   ```
   /home/ameen-khan/approval_engine/swagger/v1/swagger.yaml
   ```

5. **Click "Import"**

Postman will automatically create:
- A collection with all endpoints
- Request examples
- Schema validation
- Environment variables

### Method 2: Import from URL (if server is running)

1. **Start Rails server**:
   ```bash
   rails server
   ```

2. **In Postman, click "Import"**

3. **Select "Link"**

4. **Enter URL**:
   ```
   http://localhost:3000/api-docs/v1/swagger.yaml
   ```

5. **Click "Continue" → "Import"**

## 🔧 Setup Environment

After importing, set up your environment variables:

### 1. Create Environment

1. Click **Environments** (left sidebar)
2. Click **"+"** to create new environment
3. Name it: `Approval Engine - Local`

### 2. Add Variables

| Variable | Initial Value | Current Value |
|----------|--------------|---------------|
| `base_url` | `http://localhost:3000` | `http://localhost:3000` |
| `token` | (leave empty) | (will be set after login) |
| `admin_email` | `admin@example.com` | `admin@example.com` |
| `admin_password` | `password123` | `password123` |

### 3. Select Environment

Click the environment dropdown (top right) and select `Approval Engine - Local`

## 🔐 Authentication Workflow

### Step 1: Login

1. **Open the collection**: `Smart Rule-Based Approval Engine API`

2. **Navigate to**: `Authentication` → `User login`

3. **Update request body**:
   ```json
   {
     "email": "{{admin_email}}",
     "password": "{{admin_password}}"
   }
   ```

4. **Click "Send"**

5. **Copy the token** from response

6. **Set token in environment**:
   - Go to Environments
   - Paste token into `token` variable's "Current Value"
   - Save

### Step 2: Configure Authorization

The collection should already have Bearer token auth configured, but verify:

1. **Click on the collection** (not individual requests)

2. **Go to "Authorization" tab**

3. **Type**: `Bearer Token`

4. **Token**: `{{token}}`

5. **Save**

Now all requests will automatically use your token!

## 📋 Common Workflows

### Workflow 1: Create Request Type

1. **Endpoint**: `POST /api/v1/request_types`

2. **Request Body**:
   ```json
   {
     "name": "expense",
     "approver_ids": [1, 2]
   }
   ```

3. **Send** → Note the `id` in response

### Workflow 2: Submit Request

1. **Endpoint**: `POST /api/v1/requests`

2. **Request Body**:
   ```json
   {
     "request_type_id": 1,
     "requested_value": 5000.00
   }
   ```

3. **Send** → Request is created and evaluated

### Workflow 3: Approve Request (as Approver)

1. **Login as approver** (update email/password)

2. **Check inbox**: `GET /api/v1/approver/requests`

3. **Approve**: `POST /api/v1/approver/requests/{id}/approve`
   ```json
   {
     "comments": "Approved based on budget"
   }
   ```

### Workflow 4: Create Rule

1. **Endpoint**: `POST /api/v1/rules`

2. **Request Body**:
   ```json
   {
     "request_type_id": 1,
     "condition": {
       "operator": "AND",
       "conditions": [
         {
           "field": "requested_value",
           "operator": ">",
           "value": 1000
         }
       ]
     },
     "action": {
       "type": "assign_approver",
       "approver_id": 1
     },
     "priority": 10
   }
   ```

## 🧪 Testing Scenarios

### Scenario 1: Complete Approval Flow

```
1. POST /api/v1/auth/login (as admin)
2. POST /api/v1/request_types (create "expense" type)
3. POST /api/v1/users (create approver)
4. PUT /api/v1/request_types/:id (assign approver)
5. POST /api/v1/auth/login (as regular user)
6. POST /api/v1/requests (submit expense request)
7. POST /api/v1/auth/login (as approver)
8. GET /api/v1/approver/requests (check inbox)
9. POST /api/v1/approver/requests/:id/approve (approve)
10. POST /api/v1/auth/login (as user)
11. GET /api/v1/requests/:id (verify approved)
```

### Scenario 2: Rule-Based Routing

```
1. POST /api/v1/request_types (create type)
2. POST /api/v1/rules (create rule for high values)
3. POST /api/v1/rules (create rule for low values)
4. POST /api/v1/requests (submit high value - routes to senior approver)
5. POST /api/v1/requests (submit low value - routes to junior approver)
```

## 📊 Collection Organization

After import, your collection will be organized by tags:

```
Smart Rule-Based Approval Engine API
├── Authentication
│   ├── User login
│   └── User registration
├── Request Types
│   ├── List all request types
│   ├── Create a new request type
│   ├── Show a request type
│   ├── Update a request type
│   └── Delete a request type
├── Requests
│   ├── List user requests
│   ├── Create a new request
│   ├── Show a request
│   └── Check request balance/quota
├── Approver
│   ├── List pending approval requests
│   ├── Approve a request
│   └── Reject a request
├── Users
│   ├── List all users
│   ├── Create a new user
│   ├── Show a user
│   ├── Update a user
│   └── Delete a user
└── Rules
    ├── List all rules
    ├── Create a new rule
    ├── Show a rule
    ├── Update a rule
    └── Delete a rule
```

## 🎯 Pro Tips

### 1. Use Pre-request Scripts

Add to collection's "Pre-request Script":
```javascript
// Auto-refresh token if expired
if (pm.environment.get("token_expiry")) {
    const now = new Date().getTime();
    const expiry = pm.environment.get("token_expiry");
    
    if (now > expiry) {
        // Token expired, need to re-login
        console.log("Token expired, please login again");
    }
}
```

### 2. Use Tests for Automation

Add to request "Tests" tab:
```javascript
// Save token from login response
if (pm.response.json().token) {
    pm.environment.set("token", pm.response.json().token);
    
    // Calculate expiry (24 hours)
    const expiry = new Date().getTime() + (24 * 60 * 60 * 1000);
    pm.environment.set("token_expiry", expiry);
}

// Verify response
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has data", function () {
    pm.expect(pm.response.json()).to.have.property('data');
});
```

### 3. Create Multiple Environments

Create environments for different scenarios:
- `Local Development` - http://localhost:3000
- `Staging` - https://staging.approval-engine.com
- `Production` - https://api.approval-engine.com

### 4. Save Example Responses

After successful requests:
1. Click "Save Response"
2. Name it (e.g., "Success - Admin User")
3. Use as reference for frontend development

### 5. Use Collection Runner

Test entire workflows:
1. Click "Runner" (top left)
2. Select collection
3. Select environment
4. Click "Run"
5. View results

## 🔄 Keeping Collection Updated

When API changes:

1. **Regenerate Swagger**:
   ```bash
   RAILS_ENV=test rake rswag:specs:swaggerize
   ```

2. **Re-import in Postman**:
   - Delete old collection
   - Import updated `swagger.yaml`
   - Reconfigure environment variables

## 📤 Sharing Collection

### Export Collection

1. Click "..." on collection
2. Select "Export"
3. Choose "Collection v2.1"
4. Save file
5. Share with team

### Share via Workspace

1. Create Postman workspace
2. Invite team members
3. Share collection in workspace
4. Everyone gets updates automatically

## 🐛 Troubleshooting

### Token Not Working
- Check token is set in environment
- Verify token hasn't expired (24 hours)
- Re-login to get fresh token

### 401 Unauthorized
- Token missing or invalid
- Login again
- Check Authorization header format: `Bearer {{token}}`

### 403 Forbidden
- User doesn't have permission
- Login as admin for admin-only endpoints
- Login as approver for approver endpoints

### 422 Validation Error
- Check request body format
- Verify required fields are present
- Check data types match schema

### Connection Refused
- Ensure Rails server is running
- Check port (default: 3000)
- Verify base_url in environment

## 📚 Additional Resources

- [Postman Documentation](https://learning.postman.com/)
- [OpenAPI in Postman](https://learning.postman.com/docs/integrations/available-integrations/working-with-openAPI/)
- API Documentation: http://localhost:3000/api-docs

---

Happy testing! 🚀
