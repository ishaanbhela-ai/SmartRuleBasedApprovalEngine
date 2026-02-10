module Api
  module V1
    class ReportsController < ApplicationController
      # GET /api/v1/reports/me
      # Returns personalized report based on current user's role
      def me
        authorize! :read, :my_reports

        report = MyReportCalculator.new(
          user: current_user,
          tenant: current_user.tenant
        ).calculate

        render json: report
      end
    end
  end
end
