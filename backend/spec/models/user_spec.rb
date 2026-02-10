require "rails_helper"

RSpec.describe User, type: :model do
  it "validates presence of name, email, role, and tenant" do
    user = create(:user)
    expect(user).to be_valid
  end
end