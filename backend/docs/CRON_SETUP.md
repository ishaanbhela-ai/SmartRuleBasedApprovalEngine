# Cron Job Setup - Auto-Reject Pending Requests

## Overview

This application uses the `whenever` gem to manage cron jobs. The primary job is to auto-reject requests that have been pending approval for more than 7 business days.

## Setup Instructions

### 1. Install Dependencies

```bash
bundle install
```

### 2. View Current Cron Schedule

```bash
bundle exec whenever
```

This will show you the cron syntax that will be installed.

### 3. Install Cron Jobs (Production/Staging)

```bash
# Install to system crontab
bundle exec whenever --update-crontab

# Or specify environment
bundle exec whenever --update-crontab --set environment=production
```

### 4. View Installed Cron Jobs

```bash
crontab -l
```

### 5. Remove Cron Jobs

```bash
bundle exec whenever --clear-crontab
```

---

## Configuration

### Schedule Configuration

File: `config/schedule.rb`

**Current Schedule:**
- **Task:** `requests:auto_reject`
- **Frequency:** Every day at 2:00 AM
- **Purpose:** Auto-reject requests pending for 7+ business days

**Alternative Schedules (Commented Out):**
- Hourly: For testing or high-frequency needs
- Weekday mornings: Business hours execution
- Twice daily: Morning and evening runs
- Weekly: Monday morning cleanup

### Modify Schedule

Edit `config/schedule.rb` and update the crontab:

```ruby
# Run every 6 hours
every 6.hours do
  rake "requests:auto_reject"
end

# Run at specific times
every 1.day, at: ["9:00 am", "6:00 pm"] do
  rake "requests:auto_reject"
end
```

Then update:
```bash
bundle exec whenever --update-crontab
```

---

## Manual Execution

### Run the Task Manually

```bash
# Development
bundle exec rake requests:auto_reject

# Production
RAILS_ENV=production bundle exec rake requests:auto_reject
```

### Test in Rails Console

```ruby
# Check what would be rejected
cutoff_time = 7.business_days.ago
Request.where(status: "pending_approval").where("created_at < ?", cutoff_time).count

# See the requests
Request.where(status: "pending_approval").where("created_at < ?", cutoff_time).pluck(:id, :created_at)
```

---

## Logging

### Log Files

- **Standard Output:** `log/cron.log`
- **Error Output:** `log/cron_error.log`
- **Rails Log:** `log/production.log` (or environment-specific)

### View Logs

```bash
# Cron output
tail -f log/cron.log

# Cron errors
tail -f log/cron_error.log

# Rails application log
tail -f log/production.log | grep AutoReject
```

### Log Format

```
[AutoReject] Starting auto-reject task at 2026-02-05 02:00:00 +0530
[AutoReject] Cutoff time: 2026-01-25 02:00:00 +0530
[AutoReject] Found 5 requests to auto-reject
[AutoReject] ✓ Rejected request abc-123 (leave)
[AutoReject] ✓ Rejected request def-456 (expense)
[AutoReject] =========================================
[AutoReject] Task completed in 1.23 seconds
[AutoReject] Total found: 5
[AutoReject] Successfully rejected: 5
[AutoReject] Errors: 0
[AutoReject] =========================================
```

---

## Monitoring

### Check Cron Execution

```bash
# System cron log (Ubuntu/Debian)
grep CRON /var/log/syslog

# Or
journalctl -u cron
```

### Verify Task Ran

```bash
# Check Rails log
grep "AutoReject" log/production.log

# Check cron log
cat log/cron.log
```

### Database Verification

```ruby
# In Rails console
# Check recently auto-rejected requests
Approval
  .where(action: "rejected")
  .where("reason LIKE ?", "%Auto-rejected%")
  .order(created_at: :desc)
  .limit(10)
```

---

## Production Deployment

### Using Capistrano

Add to `config/deploy.rb`:

```ruby
after 'deploy:updated', 'whenever:update_crontab'
```

### Using Docker

Add to your `Dockerfile`:

```dockerfile
# Install cron
RUN apt-get update && apt-get install -y cron

# Copy crontab
RUN bundle exec whenever --update-crontab --set environment=production

# Start cron
CMD cron && bundle exec rails server
```

### Using Kubernetes

Use Kubernetes CronJob:

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: auto-reject-requests
spec:
  schedule: "0 2 * * *"  # 2 AM daily
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: auto-reject
            image: your-app:latest
            command: ["bundle", "exec", "rake", "requests:auto_reject"]
          restartPolicy: OnFailure
```

---

## Troubleshooting

### Cron Not Running

1. **Check crontab is installed:**
   ```bash
   crontab -l
   ```

2. **Check cron service is running:**
   ```bash
   sudo service cron status
   ```

3. **Check environment variables:**
   Cron runs with minimal environment. Use absolute paths.

4. **Check permissions:**
   ```bash
   ls -la log/
   # Ensure log files are writable
   ```

### Task Failing

1. **Run manually to see errors:**
   ```bash
   bundle exec rake requests:auto_reject
   ```

2. **Check error logs:**
   ```bash
   tail -f log/cron_error.log
   ```

3. **Verify database connection:**
   ```bash
   RAILS_ENV=production bundle exec rails runner "puts ActiveRecord::Base.connection.active?"
   ```

### No Requests Being Rejected

1. **Check cutoff calculation:**
   ```ruby
   # In Rails console
   7.business_days.ago
   ```

2. **Verify business_time configuration:**
   Check `config/initializers/business_time.rb`

3. **Check request status:**
   ```ruby
   Request.where(status: "pending_approval").count
   ```

---

## Best Practices

1. ✅ **Run during off-peak hours** (2 AM default)
2. ✅ **Monitor logs regularly**
3. ✅ **Set up alerts** for task failures
4. ✅ **Test in staging** before production
5. ✅ **Keep logs rotated** to prevent disk space issues
6. ✅ **Document schedule changes**
7. ✅ **Use environment-specific schedules**

---

## Environment-Specific Schedules

```ruby
# config/schedule.rb
case @environment
when 'production'
  every 1.day, at: '2:00 am' do
    rake "requests:auto_reject"
  end
when 'staging'
  every 1.hour do
    rake "requests:auto_reject"
  end
when 'development'
  # Don't run automatically in development
end
```

---

## Support

For issues or questions:
1. Check logs: `log/cron.log` and `log/cron_error.log`
2. Run manually: `bundle exec rake requests:auto_reject`
3. Verify crontab: `crontab -l`
4. Check whenever gem docs: https://github.com/javan/whenever
