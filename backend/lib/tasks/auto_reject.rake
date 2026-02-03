namespace :requests do
  desc "Auto reject pending requests after 7 business days"
  task auto_reject: :environment do
    cutoff_time = 7.business_days.ago

    requests = Request
      .where(status: "pending_approval")
      .where("created_at < ?", cutoff_time)

    puts "Found #{requests.count} requests to auto reject"

    requests.find_each do |request|
      ActiveRecord::Base.transaction do
        request.update!(status: "rejected")

        Approval.create!(
          tenant: request.tenant,
          request: request,
          approver: nil,
          rule: nil,
          definition: nil,
          action: "rejected",
          reason: "Auto rejected after 7 business days without approval"
        )
      end

      puts "Auto rejected request #{request.id}"
    end
  end
end
