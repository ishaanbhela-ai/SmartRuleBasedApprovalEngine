🔐 Users API Test Coverage (55 tests)
GET /api/v1/users (17 tests)
Admin User Tests:

✅ Returns list of users
✅ Includes pagination metadata
✅ Returns users from same tenant only (tenant isolation)
✅ Respects pagination parameters
✅ Handles page parameter
✅ Does not include soft deleted users
Authorization Tests:

✅ Approver returns forbidden
✅ Regular user returns forbidden
✅ Unauthenticated returns unauthorized
Invalid Pagination Parameters:

✅ Handles negative page number
✅ Handles zero per_page (fixed controller bug!)
✅ Handles extremely large per_page
✅ Handles non-numeric page parameter
POST /api/v1/users (31 tests)
Valid Creation:

✅ Creates a new user
✅ Assigns user to admin's tenant
✅ Returns created user data
✅ Creates user with admin role
✅ Creates user with approver role
Invalid Data Validation (13 tests):

✅ Returns error when email is missing
✅ Returns error when email is blank
✅ Returns error when email is invalid format
✅ Returns error when email already exists
✅ Returns error when password is missing
✅ Returns error when password is blank
✅ Returns error when name is missing
✅ Returns error when name is blank
✅ Returns error when role is invalid
✅ Returns error when role is missing
✅ Returns error when grade is invalid (5)
✅ Returns error when grade is missing
✅ Returns error when grade is 0
✅ Returns error when grade is negative
Edge Case Data (5 tests):

✅ Handles very long email (250+ chars)
✅ Handles very long name (1000+ chars)
✅ Handles special characters in name (O'Brien-Smith)
✅ Handles email with plus sign (
user+tag@test.com
)
✅ Handles short password
Security Tests (3 tests):

✅ Safely handles SQL injection in email
✅ Safely handles SQL injection in name
✅ Safely handles XSS in name
Authorization Tests (4 tests):

✅ Approver returns forbidden
✅ Regular user returns forbidden
✅ Unauthenticated returns unauthorized
✅ Returns error when user params are not wrapped
DELETE /api/v1/users/:id (11 tests)
Admin User Tests:

✅ Soft deletes the user
✅ Sets deleted_at timestamp
✅ Prevents admin from deleting themselves
✅ Returns not found for non-existent user
✅ Returns not found for user from different tenant
✅ Returns not found for already deleted user
✅ Handles invalid user ID format
✅ Handles SQL injection in ID parameter
Authorization Tests:

✅ Approver returns forbidden
✅ Regular user returns forbidden
✅ Unauthenticated returns unauthorized
🐛 Bugs Found & Fixed
Zero per_page Parameter Bug ✅
Issue: Passing per_page=0 caused Pagy error
Fix: Added validation to ensure limit is at least 1
Code: limit = [(params[:per_page] || params[:limit] || 10).to_i, 1].max
UserSerializer Response Format ✅
Issue: Controller was using incorrect Panko serializer syntax
Fix: Changed from UserSerializer.new(user).to_json to { data: UserSerializer.new.serialize(user) }
🎯 Security Coverage
✅ SQL Injection Protection - Email, name, and ID parameters
✅ XSS Protection - Script tags in name field
✅ Tenant Isolation - Users can only see/manage users in their tenant
✅ Authorization - Role-based access control (admin only)
✅ Self-Deletion Prevention - Admin cannot delete themselves
✅ Soft Delete Awareness - Deleted users are excluded from results