# Cron Job Quick Reference

## 🚀 Quick Start

```bash
# 1. Install dependencies
bundle install

# 2. View cron schedule (without installing)
bundle exec whenever

# 3. Install cron jobs to system
bundle exec whenever --update-crontab

# 4. Verify installation
crontab -l
```

---

## 📋 Common Commands

### View Schedule
```bash
bundle exec whenever
```

### Install/Update Crontab
```bash
# Development
bundle exec whenever --update-crontab

# Production
bundle exec whenever --update-crontab --set environment=production
```

### Remove Crontab
```bash
bundle exec whenever --clear-crontab
```

### Manual Test
```bash
bundle exec rake requests:auto_reject
```

---

## 📊 Current Schedule

| Task | Frequency | Time | Purpose |
|------|-----------|------|---------|
| `requests:auto_reject` | Daily | 2:00 AM | Auto-reject requests pending 7+ business days |

---

## 📝 Logs

```bash
# View cron output
tail -f log/cron.log

# View cron errors
tail -f log/cron_error.log

# View Rails logs
tail -f log/production.log | grep AutoReject
```

---

## 🔧 Modify Schedule

Edit `config/schedule.rb`:

```ruby
# Every hour
every 1.hour do
  rake "requests:auto_reject"
end

# Specific times
every 1.day, at: "9:00 am" do
  rake "requests:auto_reject"
end

# Multiple times
every 1.day, at: ["9:00 am", "6:00 pm"] do
  rake "requests:auto_reject"
end
```

Then update:
```bash
bundle exec whenever --update-crontab
```

---

## ✅ Verification

```bash
# 1. Check crontab is installed
crontab -l | grep auto_reject

# 2. Run manually
bundle exec rake requests:auto_reject

# 3. Check logs
cat log/cron.log
```

---

## 🐛 Troubleshooting

**Cron not running?**
```bash
# Check cron service
sudo service cron status

# Check system logs
grep CRON /var/log/syslog
```

**Task failing?**
```bash
# Run manually to see errors
bundle exec rake requests:auto_reject

# Check error log
tail -f log/cron_error.log
```

---

For detailed documentation, see: `docs/CRON_SETUP.md`
