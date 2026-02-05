# Personalized Reports API

## Overview

The `/api/v1/reports/me` endpoint provides **role-specific metrics** for the authenticated user.

- **Users** see their request statistics
- **Approvers** see their review activity + inbox count
- **Admins** see global tenant analytics

---

## Endpoint

```
GET /api/v1/reports/me
```

**Authorization:** Required (all authenticated users)

---

## Response Examples

### 1. USER Response

**Request:**
```bash
curl -X GET http://localhost:3000/api/v1/reports/me \
  -H "Authorization: Bearer USER_TOKEN"
```

**Response:**
```json
{
  "role": "user",
  "total_requests": 12,
  "approved": 7,
  "pending": 3,
  "rejected": 2,
  "submitted": 0
}
```

**Metrics:**
- `total_requests` - Total requests created by this user
- `approved` - Requests that were approved
- `pending` - Requests awaiting approval
- `rejected` - Requests that were rejected
- `submitted` - Requests submitted but not yet evaluated

---

### 2. APPROVER Response

**Request:**
```bash
curl -X GET http://localhost:3000/api/v1/reports/me \
  -H "Authorization: Bearer APPROVER_TOKEN"
```

**Response:**
```json
{
  "role": "approver",
  "total_reviewed": 15,
  "approved_by_me": 10,
  "rejected_by_me": 5,
  "pending_inbox": 4,
  "my_requests": {
    "total": 3,
    "pending": 1
  }
}
```

**Metrics:**
- `total_reviewed` - Total requests this approver has reviewed
- `approved_by_me` - Requests they approved
- `rejected_by_me` - Requests they rejected
- `pending_inbox` - Current pending requests in their inbox
- `my_requests` - Requests they created as a user
  - `total` - Total requests they created
  - `pending` - Their pending requests

---

### 3. ADMIN Response

**Request:**
```bash
curl -X GET http://localhost:3000/api/v1/reports/me \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Response:**
```json
{
  "role": "admin",
  "status_breakdown": {
    "total": 150,
    "submitted": 5,
    "pending_approval": 20,
    "approved": 100,
    "rejected": 25
  },
  "by_request_type": [
    {
      "name": "leave",
      "total": 80,
      "pending": 10,
      "approved": 60,
      "rejected": 10
    },
    {
      "name": "expense",
      "total": 50,
      "pending": 8,
      "approved": 30,
      "rejected": 12
    },
    {
      "name": "discount",
      "total": 20,
      "pending": 2,
      "approved": 10,
      "rejected": 8
    }
  ],
  "approver_activity": [
    {
      "approver_id": "uuid-1",
      "approver_name": "HR Manager",
      "total_reviewed": 50,
      "approved": 40,
      "rejected": 10
    },
    {
      "approver_id": "uuid-2",
      "approver_name": "Finance Manager",
      "total_reviewed": 30,
      "approved": 25,
      "rejected": 5
    }
  ],
  "total_users": 25,
  "total_approvers": 3
}
```

**Metrics:**
- `status_breakdown` - Overall request statistics
- `by_request_type` - Breakdown by request type (leave, expense, discount)
- `approver_activity` - Performance metrics for each approver
- `total_users` - Total users in tenant
- `total_approvers` - Total approvers in tenant

---

## Implementation Details

### Service Pattern

Uses `MyReportCalculator` service (similar to `QuotaCalculator`):

```ruby
report = MyReportCalculator.new(
  user: current_user,
  tenant: current_user.tenant
).calculate
```

### Data Sources

| Role | Primary Data Source |
|------|---------------------|
| **User** | `requests` table WHERE `requester_id = user.id` |
| **Approver** | `approvals` table WHERE `approver_id = user.id` |
| **Admin** | Tenant-scoped queries across all tables |

### Authorization

All authenticated users can access this endpoint:

```ruby
can :read, :my_reports
```

---

## Use Cases

### Dashboard Widgets

**User Dashboard:**
```javascript
// Fetch user's request summary
fetch('/api/v1/reports/me')
  .then(res => res.json())
  .then(data => {
    showWidget('Total Requests', data.total_requests);
    showWidget('Approved', data.approved);
    showWidget('Pending', data.pending);
  });
```

**Approver Dashboard:**
```javascript
// Show approver's workload
fetch('/api/v1/reports/me')
  .then(res => res.json())
  .then(data => {
    showWidget('Pending Inbox', data.pending_inbox);
    showWidget('Total Reviewed', data.total_reviewed);
    showApprovalRate(data.approved_by_me, data.total_reviewed);
  });
```

**Admin Dashboard:**
```javascript
// Show tenant-wide analytics
fetch('/api/v1/reports/me')
  .then(res => res.json())
  .then(data => {
    renderStatusChart(data.status_breakdown);
    renderTypeBreakdown(data.by_request_type);
    renderApproverPerformance(data.approver_activity);
  });
```

---

## Edge Cases Handled

1. ✅ **Soft-deleted users** - Automatically excluded via `deleted_at IS NULL`
2. ✅ **Pending approvals** - Only counts `status = 'pending_approval'`
3. ✅ **Auto-approvals** - Counted as approved (no approver_id)
4. ✅ **Multi-approver** - Only counts approvals done by current user
5. ✅ **Tenant isolation** - All queries scoped to user's tenant

---

## Performance Considerations

### Caching (Optional)

For high-traffic applications, consider caching:

```ruby
def me
  authorize! :read, :my_reports
  
  report = Rails.cache.fetch("user_report_#{current_user.id}", expires_in: 5.minutes) do
    MyReportCalculator.new(
      user: current_user,
      tenant: current_user.tenant
    ).calculate
  end
  
  render json: report
end
```

### Database Indexes

Ensure these indexes exist for optimal performance:

```ruby
# Already exist in your schema
add_index :requests, :requester_id
add_index :requests, :status
add_index :approvals, :approver_id
add_index :approvals, :action
```

---

## Testing

### Manual Testing

```bash
# Test as user
curl -X GET http://localhost:3000/api/v1/reports/me \
  -H "Authorization: Bearer USER_TOKEN"

# Test as approver
curl -X GET http://localhost:3000/api/v1/reports/me \
  -H "Authorization: Bearer APPROVER_TOKEN"

# Test as admin
curl -X GET http://localhost:3000/api/v1/reports/me \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Rails Console Testing

```ruby
# Test service directly
user = User.find_by(email: 'user@example.com')
report = MyReportCalculator.new(user: user, tenant: user.tenant).calculate
puts JSON.pretty_generate(report)

# Test for approver
approver = User.find_by(role: 'approver')
report = MyReportCalculator.new(user: approver, tenant: approver.tenant).calculate
puts JSON.pretty_generate(report)

# Test for admin
admin = User.find_by(role: 'admin')
report = MyReportCalculator.new(user: admin, tenant: admin.tenant).calculate
puts JSON.pretty_generate(report)
```

---

## Comparison with Admin Reports

| Feature | `/api/v1/reports/me` | `/api/v1/admin/reports/summary` |
|---------|----------------------|----------------------------------|
| **Access** | All users | Admin only |
| **Scope** | Personal/role-specific | Tenant-wide |
| **Purpose** | User dashboard | Admin analytics |
| **Data** | User's own metrics | Global statistics |

---

## Future Enhancements

1. **Date filtering** - Add `?from=2024-01-01&to=2024-12-31`
2. **Trend data** - Include week-over-week or month-over-month changes
3. **Export** - Add CSV/PDF export functionality
4. **Real-time** - WebSocket updates for live metrics
5. **Comparison** - Compare with team average or previous period

---

## Summary

✅ **Single endpoint** - `/api/v1/reports/me`  
✅ **Role-scoped** - Different metrics per role  
✅ **Service pattern** - Clean, testable, reusable  
✅ **Performant** - Optimized queries  
✅ **Secure** - Proper authorization and tenant isolation  
✅ **Extensible** - Easy to add new metrics  

Perfect for building user dashboards! 🎉
