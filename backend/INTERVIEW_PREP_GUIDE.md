# 🎯 Approval Engine - Interview Preparation Guide

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Key Design Decisions & Why](#key-design-decisions--why)
4. [Complex Code Explained Simply](#complex-code-explained-simply)
5. [Important Syntax Patterns](#important-syntax-patterns)
6. [Performance Optimizations](#performance-optimizations)
7. [Security & Authorization](#security--authorization)
8. [Common Interview Questions](#common-interview-questions)

---

## 🎯 Project Overview

### What is this project?
**Approval Engine** is a multi-tenant SaaS application that automates approval workflows for organizations. Think of it like an automated manager that decides:
- "Should this request be auto-approved?"
- "Or does it need a human approver?"

### Real-world example:
```
Employee: "I need $500 for office supplies"
System: "Your limit is $1000, and you've used $300 this year"
System: "You have $700 remaining, so AUTO-APPROVED! ✅"

Employee: "I need $2000 for a conference"
System: "That's over your limit, sending to your manager for approval 📨"
```

### Core Features:
1. **Multi-tenancy** - Multiple companies use the same app (data isolated)
2. **Rule-based auto-approval** - Smart automation based on user grade & quotas
3. **Role-based access** - Admin, Approver, User roles
4. **Quota tracking** - Tracks yearly limits per user
5. **RESTful API** - Complete API with Swagger documentation

---

## 🏗️ System Architecture

### Database Schema (The Foundation)

```
┌─────────────┐
│   Tenants   │ ← Companies using the system
└──────┬──────┘
       │
       ├──→ ┌─────────────┐
       │    │    Users    │ ← Employees (admin/approver/user)
       │    └──────┬──────┘
       │           │
       ├──→ ┌─────────────────┐
       │    │ Request Types   │ ← expense, leave, discount
       │    └────────┬────────┘
       │             │
       │    ┌────────┴────────┐
       │    │                 │
       ├──→ │     Rules       │ ← Auto-approval limits by grade
       │    └─────────────────┘
       │
       └──→ ┌─────────────┐
            │  Requests   │ ← Actual requests from users
            └──────┬──────┘
                   │
            ┌──────┴──────┐
            │  Approvals  │ ← Approval decisions
            └─────────────┘
```

### Key Models & Relationships

**Think of it like a company hierarchy:**

1. **Tenant** = Company (e.g., "Acme Corp")
2. **User** = Employee (belongs to a company, has a grade 1-3)
3. **RequestType** = Category (expense, leave, discount)
4. **Rule** = Policy (e.g., "Grade 1 users can auto-approve up to $500")
5. **Request** = Actual request (e.g., "I need $300")
6. **Approval** = Decision (approved/rejected + reason)

---

## 🎓 Key Design Decisions & Why

### 1. **Why Multi-Tenancy?**

**Decision:** Use `tenant_id` in every table

**Why?**
- One app serves multiple companies
- Each company's data is isolated
- More cost-effective than separate databases
- Easier to maintain and update

**How it works:**
```ruby
# Every query automatically scoped to current tenant
current_user.tenant.requests  # Only sees their company's requests
```

**Better Alternative?** 
- Could use separate databases per tenant (more isolation, but harder to manage)
- Could use row-level security in PostgreSQL (more complex)
- **Our choice is the industry standard for SaaS apps**

---

### 2. **Why Soft Deletes?**

**Decision:** Use `deleted_at` instead of actually deleting records

**Why?**
- **Audit trail** - Can see what was deleted and when
- **Recovery** - Can restore accidentally deleted data
- **Compliance** - Some regulations require keeping deleted data
- **Relationships** - Prevents orphaned records

**How it works:**
```ruby
# Include SoftDeletable concern
class User < ApplicationRecord
  include SoftDeletable
end

# When you "delete", it just sets deleted_at timestamp
user.destroy  # Sets deleted_at = Time.now

# Queries automatically exclude soft-deleted records
User.all  # WHERE deleted_at IS NULL
```

**Better Alternative?**
- Hard deletes (simpler, but lose data forever)
- **Our choice is better for production systems**

---

### 3. **Why Service Objects? (RuleEvaluator, QuotaCalculator)**

**Decision:** Extract business logic into separate service classes

**Why?**
- **Single Responsibility** - Each class does ONE thing
- **Testable** - Easy to test in isolation
- **Reusable** - Can use in controllers, background jobs, console
- **Readable** - Clear what the code does

**Example:**
```ruby
# ❌ BAD: All logic in controller
def create
  request = Request.create!(params)
  quota = calculate_quota(request)
  if request.value <= quota
    approve_automatically(request)
  else
    send_to_approver(request)
  end
end

# ✅ GOOD: Service object handles complexity
def create
  request = Request.create!(params)
  RuleEvaluator.new(request).evaluate!  # Clean!
end
```

**Better Alternative?**
- Could put logic in models (but models get too fat)
- Could use concerns (but harder to test)
- **Service objects are the Rails best practice**

---

### 4. **Why Panko Serializer?**

**Decision:** Use Panko instead of ActiveModel::Serializers or Jbuilder

**Why?**
- **10x faster** - Written in C
- **Less memory** - More efficient
- **Consistent format** - Same structure everywhere
- **Type safety** - Defines exact fields to return

**How it works:**
```ruby
class RequestSerializer < Panko::Serializer
  attributes :id, :status, :requested_value
  
  has_one :requester, serializer: UserSerializer
  has_one :request_type, serializer: RequestTypeSerializer
end

# Usage
RequestSerializer.new.serialize(request)
```

**Better Alternative?**
- Jbuilder (slower, but more flexible)
- ActiveModel::Serializers (deprecated)
- **Panko is best for performance-critical APIs**

---

### 5. **Why CanCanCan for Authorization?**

**Decision:** Use CanCanCan instead of Pundit

**Why?**
- **Centralized** - All permissions in one file (`ability.rb`)
- **Simple DSL** - Easy to read and understand
- **Automatic** - `authorize!` checks permissions
- **Flexible** - Can define complex rules

**How it works:**
```ruby
# Define abilities once
class Ability
  def initialize(user)
    if user.role == "admin"
      can :manage, :all  # Admins can do everything
    elsif user.role == "approver"
      can :update, Request do |request|
        request.status == "pending_approval" &&
        request.request_type.approvers.include?(user)
      end
    end
  end
end

# Use in controllers
authorize! :update, @request  # Raises error if not allowed
```

**Better Alternative?**
- Pundit (more object-oriented, but more files)
- Custom solution (more work)
- **CanCanCan is simpler for straightforward permissions**

---

### 6. **Why Pagy for Pagination?**

**Decision:** Use Pagy instead of Kaminari or will_paginate

**Why?**
- **40x faster** than will_paginate
- **36x less memory** than Kaminari
- **Simple API** - Just `pagy(scope)`
- **Metadata** - Perfect for frontend frameworks

**How it works:**
```ruby
# In controller
pagy, requests = pagy(Request.all)

# Returns metadata for frontend
{
  data: [...],
  meta: {
    page: 1,
    per_page: 20,
    total_pages: 5,
    total_count: 100
  }
}
```

**Better Alternative?**
- Kaminari (more features, but slower)
- will_paginate (older, slower)
- **Pagy is the modern choice for APIs**

---

## 🧠 Complex Code Explained Simply

### 1. **RuleEvaluator - The Brain of the System**

**What it does:** Decides if a request should be auto-approved or sent to a human

**Simple explanation:**
```ruby
class RuleEvaluator
  def evaluate!
    # Step 1: Calculate how much quota the user has left
    quota = QuotaCalculator.new(user: @user, ...).remaining
    
    # Step 2: Check if request is within quota
    if @request.requested_value <= quota.remaining
      auto_approve!  # Under limit? Auto-approve!
    else
      route_to_approver!  # Over limit? Send to manager
    end
  end
end
```

**Think of it like:**
- You ask your parent for money
- Parent checks: "How much have you spent this month?"
- If under allowance → "Here you go!" (auto-approved)
- If over allowance → "Let me think about it" (needs approval)

**Why this design?**
- **Encapsulation** - All decision logic in one place
- **Testable** - Easy to test different scenarios
- **Extensible** - Easy to add more complex rules later

---

### 2. **QuotaCalculator - The Accountant**

**What it does:** Calculates how much of their yearly limit a user has used

**Simple explanation:**
```ruby
class QuotaCalculator
  def limit
    # What's the max they can spend? (from rules)
    rule.definition  # e.g., 10000
  end
  
  def used
    # How much have they already spent this year?
    Request.where(
      user: @user,
      status: ['approved', 'auto_approved'],
      created_at: this_year
    ).sum(:requested_value)  # e.g., 3000
  end
  
  def remaining
    limit - used  # 10000 - 3000 = 7000 left
  end
end
```

**Think of it like:**
- Your yearly budget is $10,000 (limit)
- You've spent $3,000 so far (used)
- You have $7,000 left (remaining)

**Why this design?**
- **Reusable** - Used in multiple places (evaluation, balance endpoint)
- **Clear** - Each method does one calculation
- **Accurate** - Only counts approved requests

---

### 3. **Multi-Tenant Scoping - Data Isolation**

**What it does:** Ensures users only see their company's data

**Simple explanation:**
```ruby
# Every query starts with current_user.tenant
current_user.tenant.requests  # Only this company's requests
current_user.tenant.users     # Only this company's users

# In controllers
def index
  # Automatically scoped to tenant
  requests = current_user.tenant.requests
  # User from Company A can NEVER see Company B's data
end
```

**Think of it like:**
- Each company has their own filing cabinet
- You can only open YOUR company's cabinet
- Impossible to accidentally see another company's files

**Why this design?**
- **Security** - Prevents data leaks
- **Automatic** - Can't forget to scope queries
- **Scalable** - Easy to add new tenants

---

### 4. **has_secure_password - Password Security**

**What it does:** Safely stores passwords using bcrypt hashing

**Simple explanation:**
```ruby
class User < ApplicationRecord
  has_secure_password  # Magic!
end

# When creating user
user = User.create(
  email: "john@example.com",
  password: "secret123"  # Plain text
)

# Stored in database
user.password_digest  # "$2a$12$K8..." (hashed, unreadable)

# When logging in
user.authenticate("secret123")  # true
user.authenticate("wrong")      # false
```

**Think of it like:**
- You give the bouncer a password
- Bouncer scrambles it into gibberish and writes it down
- Next time, bouncer scrambles your password the same way
- If scrambled versions match → you're in!
- Even if someone steals the list, they can't unscramble it

**Why this design?**
- **Security** - Passwords never stored in plain text
- **Standard** - Uses bcrypt (industry standard)
- **Simple** - Rails handles all the complexity

---

### 5. **JWT Authentication - Stateless Sessions**

**What it does:** Allows users to stay logged in without server-side sessions

**Simple explanation:**
```ruby
# Login
def login
  user = User.find_by(email: params[:email])
  if user&.authenticate(params[:password])
    # Create a token with user info
    token = JWT.encode(
      { user_id: user.id, exp: 24.hours.from_now },
      Rails.application.secret_key_base
    )
    render json: { token: token }
  end
end

# Every request
def current_user
  # Decode token from header
  token = request.headers['Authorization']&.split(' ')&.last
  payload = JWT.decode(token, Rails.application.secret_key_base)
  User.find(payload['user_id'])
end
```

**Think of it like:**
- You show ID at entrance, get a wristband with your info
- Every time you want something, show the wristband
- Staff can read wristband to know who you are
- No need to check ID every time

**Why this design?**
- **Stateless** - Server doesn't store sessions
- **Scalable** - Can add more servers easily
- **Standard** - Works with mobile apps, SPAs

---

### 6. **N+1 Query Prevention - Performance**

**What it does:** Avoids making hundreds of database queries

**Simple explanation:**
```ruby
# ❌ BAD: N+1 queries
requests = Request.all  # 1 query
requests.each do |request|
  puts request.user.name  # 1 query PER request (N queries)
end
# Total: 1 + N queries (if 100 requests = 101 queries!)

# ✅ GOOD: Eager loading
requests = Request.includes(:user).all  # 2 queries total
requests.each do |request|
  puts request.user.name  # No extra queries!
end
# Total: 2 queries (always!)
```

**Think of it like:**
- ❌ Bad: Going to the library 100 times to get 100 books
- ✅ Good: Going once and getting all 100 books at once

**Why this design?**
- **Performance** - 50x faster for large datasets
- **Scalability** - Doesn't slow down as data grows
- **Best practice** - Always eager load associations

---

## 📝 Important Syntax Patterns

### 1. **belongs_to vs has_many**

```ruby
class Request < ApplicationRecord
  belongs_to :user  # Request HAS ONE user (requester)
  belongs_to :request_type  # Request HAS ONE type
  has_one :approval  # Request HAS ONE approval
end

class User < ApplicationRecord
  has_many :requests  # User HAS MANY requests
end
```

**Memory trick:**
- `belongs_to` = "I belong to someone" (child → parent)
- `has_many` = "I own many things" (parent → children)

---

### 2. **class_name and foreign_key**

```ruby
class Request < ApplicationRecord
  belongs_to :requester, class_name: "User", foreign_key: :requester_id
end
```

**Why?**
- Column is `requester_id`, not `user_id`
- But it still points to the `users` table
- `class_name` tells Rails which model
- `foreign_key` tells Rails which column

**Think of it like:**
- Your friend's contact in your phone is "Best Friend"
- But their real name is "John Smith"
- `class_name` = real name, `foreign_key` = contact name

---

### 3. **through associations**

```ruby
class RequestType < ApplicationRecord
  has_many :request_type_approvers  # Join table
  has_many :approvers, through: :request_type_approvers, source: :user
end
```

**Why?**
- Many-to-many relationship
- RequestType can have many approvers
- User can approve many request types
- Need a join table in between

**Think of it like:**
- Students ↔ Classes (many-to-many)
- Join table: Enrollments
- `through: :enrollments` to get from Student → Classes

---

### 4. **Validations**

```ruby
validates :email, presence: true, uniqueness: { scope: :tenant_id }
validates :grade, inclusion: { in: [1, 2, 3] }
validates :requested_value, numericality: { greater_than: 0 }
```

**What they do:**
- `presence: true` → Can't be blank
- `uniqueness: { scope: :tenant_id }` → Unique within tenant
- `inclusion: { in: [...] }` → Must be one of these values
- `numericality: { greater_than: 0 }` → Must be a positive number

---

### 5. **Scopes and Queries**

```ruby
# Basic where
User.where(role: "admin")

# Multiple conditions
User.where(role: "admin", grade: 1)

# Greater than
Request.where("created_at >= ?", 1.year.ago)

# IN clause
Request.where(status: ["approved", "auto_approved"])

# Joins
Request.joins(:user).where(users: { role: "admin" })

# Group and count
Request.group(:status).count
# => {"approved" => 10, "rejected" => 5}
```

---

### 6. **Transactions**

```ruby
ActiveRecord::Base.transaction do
  request.save!
  approval.create!
  # If ANY fails, BOTH are rolled back
end
```

**Why?**
- **Atomicity** - All or nothing
- **Consistency** - Database stays valid
- **Example:** Creating request + approval together

---

## ⚡ Performance Optimizations

### 1. **Eager Loading (includes)**

```ruby
# ❌ Slow: N+1 queries
requests = Request.all
requests.each { |r| puts r.user.name }  # 1 query per request

# ✅ Fast: 2 queries total
requests = Request.includes(:user).all
requests.each { |r| puts r.user.name }  # No extra queries
```

**When to use:** Whenever you access associations in a loop

---

### 2. **Query Aggregation (group)**

```ruby
# ❌ Slow: 5 separate queries
approved = Request.where(status: "approved").count
rejected = Request.where(status: "rejected").count
pending = Request.where(status: "pending").count

# ✅ Fast: 1 query
status_counts = Request.group(:status).count
# => {"approved" => 10, "rejected" => 5, "pending" => 3}
```

**When to use:** When counting by category

---

### 3. **Pagination**

```ruby
# ❌ Slow: Loads ALL records
requests = Request.all  # 10,000 records in memory!

# ✅ Fast: Loads 20 records
pagy, requests = pagy(Request.all)  # Only 20 records
```

**When to use:** Always for list endpoints

---

### 4. **Pluck for Simple Data**

```ruby
# ❌ Slow: Loads full ActiveRecord objects
user_ids = User.all.map(&:id)

# ✅ Fast: Only fetches IDs
user_ids = User.pluck(:id)
```

**When to use:** When you only need specific columns

---

## 🔒 Security & Authorization

### 1. **Multi-Tenant Isolation**

```ruby
# Always scope to current tenant
current_user.tenant.requests  # ✅ Safe
Request.all  # ❌ DANGEROUS! Shows all tenants' data
```

---

### 2. **Authorization with CanCanCan**

```ruby
# Define in ability.rb
can :update, Request do |request|
  request.requester_id == user.id
end

# Use in controllers
authorize! :update, @request  # Raises error if not allowed
```

---

### 3. **Strong Parameters**

```ruby
# Only allow specific parameters
def request_params
  params.permit(:request_type_id, :requested_value)
  # Ignores any other params (like :status, :approved_at)
end
```

---

### 4. **Password Security**

```ruby
# Never store plain passwords
has_secure_password  # Uses bcrypt hashing

# Never return password in API
class UserSerializer
  attributes :id, :name, :email  # NO password_digest!
end
```

---

## 🎤 Common Interview Questions

### Q1: "Explain the flow when a user creates a request"

**Answer:**
1. User sends POST to `/api/v1/requests` with `request_type_id` and `requested_value`
2. Controller creates Request with status "submitted"
3. RuleEvaluator is called:
   - QuotaCalculator checks user's remaining quota
   - If request ≤ remaining quota → auto-approve
   - If request > remaining quota → route to approver
4. Response sent back with request details

**Code:**
```ruby
def create
  request = Request.new(params)
  ActiveRecord::Base.transaction do
    request.save!
    RuleEvaluator.new(request).evaluate!
  end
  render json: request
end
```

---

### Q2: "How do you prevent one tenant from seeing another's data?"

**Answer:**
- Every model belongs to a tenant
- All queries scoped through `current_user.tenant`
- Database has unique indexes scoped to tenant_id
- CanCanCan enforces permissions at controller level

**Code:**
```ruby
# Always scope to tenant
current_user.tenant.requests  # Only this tenant's data

# Database constraint
add_index :users, [:tenant_id, :email], unique: true
```

---

### Q3: "Why use service objects instead of putting logic in models?"

**Answer:**
- **Single Responsibility** - Models handle data, services handle business logic
- **Testability** - Easier to test in isolation
- **Reusability** - Can use in controllers, jobs, rake tasks
- **Clarity** - Clear what each service does

**Example:**
```ruby
# Instead of fat model
class Request
  def evaluate_rules
    # 50 lines of logic...
  end
end

# Use service
RuleEvaluator.new(request).evaluate!  # Clear and focused
```

---

### Q4: "How do you handle N+1 queries?"

**Answer:**
- Use `includes` to eager load associations
- Use `group` to aggregate instead of multiple queries
- Monitor with tools like Bullet gem
- Always test with realistic data volumes

**Example:**
```ruby
# N+1
requests.each { |r| r.user.name }  # N queries

# Fixed
requests.includes(:user).each { |r| r.user.name }  # 2 queries
```

---

### Q5: "Explain your authentication system"

**Answer:**
- JWT-based authentication
- User logs in with email/password
- Server generates JWT token with user_id and expiration
- Client sends token in Authorization header
- Server decodes token to identify user
- Stateless - no server-side sessions

**Code:**
```ruby
# Login
token = JWT.encode({ user_id: user.id }, secret)

# Authenticate
payload = JWT.decode(token, secret)
current_user = User.find(payload['user_id'])
```

---

### Q6: "What would you improve in this project?"

**Great answers:**
1. **Caching** - Add Redis for quota calculations
2. **Background jobs** - Send approval emails asynchronously
3. **Audit logging** - Track all changes for compliance
4. **Rate limiting** - Prevent API abuse
5. **Webhooks** - Notify external systems of approvals
6. **Advanced rules** - Support complex conditions (AND/OR logic)
7. **Notifications** - Real-time updates via WebSockets
8. **Analytics** - Dashboard for approval metrics

---

## 🎯 Quick Reference Cheat Sheet

### Models
- `belongs_to` = child → parent (one)
- `has_many` = parent → children (many)
- `has_one` = one-to-one
- `through` = many-to-many via join table

### Queries
- `where` = filter
- `includes` = eager load (prevent N+1)
- `joins` = SQL JOIN
- `group` = GROUP BY
- `pluck` = get specific columns only

### Validations
- `presence: true` = required
- `uniqueness` = no duplicates
- `inclusion` = must be in list
- `numericality` = must be number

### Controllers
- `authorize!` = check permissions
- `pagy` = paginate results
- `transaction` = all or nothing

### Security
- `has_secure_password` = bcrypt hashing
- `current_user.tenant` = multi-tenant scoping
- JWT = stateless authentication
- CanCanCan = authorization

---

## 🚀 Final Tips for Interview

1. **Start with the big picture** - Explain what the system does before diving into code
2. **Use analogies** - Compare to real-world scenarios
3. **Explain the "why"** - Don't just say what you did, explain why
4. **Mention trade-offs** - Show you understand alternatives
5. **Be honest** - If you'd improve something, say so
6. **Show enthusiasm** - Talk about what you learned

**Good luck! You've got this! 💪**
