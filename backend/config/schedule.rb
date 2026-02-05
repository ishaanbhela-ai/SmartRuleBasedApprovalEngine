# frozen_string_literal: true

# Approval Engine - Cron Job Schedule
# Learn more: http://github.com/javan/whenever

# Set the environment (production, staging, development)
set :environment, ENV.fetch("RAILS_ENV", "development")

# Set PATH to include rbenv shims
env :PATH, ENV["PATH"]

# Set output to log file for debugging
set :output, {
  error: "log/cron_error.log",
  standard: "log/cron.log"
}

# Custom job type that ensures rbenv is loaded
job_type :rake, "cd :path && PATH=$PATH:$HOME/.rbenv/shims:$HOME/.rbenv/bin bundle exec rake :task --silent :output"

 # ============================================================================
 # Auto-Reject Pending Requests
 # ============================================================================
 # Runs every day at 2:00 AM to auto-reject requests pending for 7+ business days
 # This runs during off-peak hours to minimize database load
 # every 1.day, at: "2:00 am" do
 # rake "requests:auto_reject"
 # end

 # ============================================================================
 # Alternative Schedules (Commented Out)
 # ============================================================================

 # Run every hour (for testing or high-frequency needs)
 every 1.minute do
   rake "requests:auto_reject"
 end

# Run every weekday at 9 AM (business hours)
# every :weekday, at: "9:00 am" do
#   rake "requests:auto_reject"
# end

# Run twice a day (morning and evening)
# every 1.day, at: ["9:00 am", "6:00 pm"] do
#   rake "requests:auto_reject"
# end

# Run every Monday at 3 AM (weekly cleanup)
# every :monday, at: "3:00 am" do
#   rake "requests:auto_reject"
# end
