namespace :requests do
  desc "Auto reject pending requests after 7 business days"
  task auto_reject: :environment do
    start_time = Time.current
    Rails.logger.info "[AutoReject] Starting auto-reject task at #{start_time}"

    # cutoff_time = 7.business_days.ago
    cutoff_time = 2.business_hours.ago
    Rails.logger.info "[AutoReject] Cutoff time: #{cutoff_time}"

    requests = Request
      .where(status: "pending_approval")
      .where("created_at < ?", cutoff_time)
      .includes(:requester, :request_type, :tenant)

    total_count = requests.count
    Rails.logger.info "[AutoReject] Found #{total_count} requests to auto-reject"
    puts "[AutoReject] Found #{total_count} requests to auto-reject"

    next if total_count.zero?

    success_count = 0
    error_count = 0

    requests.find_each do |request|
      begin
        ActiveRecord::Base.transaction do
          request.update!(status: "rejected")

          Approval.create!(
            tenant: request.tenant,
            request: request,
            approver: nil,
            rule: nil,
            definition: nil,
            action: "rejected",
            reason: "Auto-rejected after 2 hours without approval"
          )
        end

        success_count += 1
        Rails.logger.info "[AutoReject] ✓ Rejected request #{request.id} (#{request.request_type.name})"
        puts "[AutoReject] ✓ Rejected request #{request.id}"
      rescue StandardError => e
        error_count += 1
        Rails.logger.error "[AutoReject] ✗ Failed to reject request #{request.id}: #{e.message}"
        Rails.logger.error e.backtrace.join("\n")
        puts "[AutoReject] ✗ Failed to reject request #{request.id}: #{e.message}"
      end
    end

    end_time = Time.current
    duration = (end_time - start_time).round(2)

    # Summary
    Rails.logger.info "[AutoReject] ========================================="
    Rails.logger.info "[AutoReject] Task completed in #{duration} seconds"
    Rails.logger.info "[AutoReject] Total found: #{total_count}"
    Rails.logger.info "[AutoReject] Successfully rejected: #{success_count}"
    Rails.logger.info "[AutoReject] Errors: #{error_count}"
    Rails.logger.info "[AutoReject] ========================================="

    puts "\n[AutoReject] Summary:"
    puts "  Total found: #{total_count}"
    puts "  Successfully rejected: #{success_count}"
    puts "  Errors: #{error_count}"
    puts "  Duration: #{duration}s"
  end
end
