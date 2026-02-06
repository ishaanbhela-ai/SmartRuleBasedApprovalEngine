require "rails_helper"

RSpec.describe "Personal Reports API", type: :request do
  let(:tenant) { create(:tenant) }
  let(:user) { create(:user, tenant: tenant) }
  let(:token) { generate_token(user) }
  let(:headers) { { "Authorization" => "Bearer #{token}" } }

  describe "GET /api/v1/reports/me" do
    context "when authenticated" do
      it "returns the personalized report" do
        # Mock calculation to isolate controller test
        calculator = instance_double(MyReportCalculator)
        allow(MyReportCalculator).to receive(:new).with(user: user, tenant: tenant).and_return(calculator)
        expected_report = { role: "user", total_requests: 5 }
        allow(calculator).to receive(:calculate).and_return(expected_report)

        get "/api/v1/reports/me", headers: headers

        expect(response).to have_http_status(:ok)
        expect(JSON.parse(response.body)).to eq(expected_report.stringify_keys)
      end
    end

    context "when unauthenticated" do
      it "returns unauthorized" do
        get "/api/v1/reports/me"
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  def generate_token(user)
    payload = {
      sub: user.id,
      tenant_id: user.tenant_id,
      role: user.role,
      exp: 24.hours.from_now.to_i
    }
    JWT.encode(payload, ENV.fetch("JWT_SECRET"), "HS256")
  end
end
