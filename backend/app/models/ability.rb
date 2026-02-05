class Ability
  include CanCan::Ability

  def initialize(user)
    return unless user

    # Common permissions for all authenticated users
    can :create, Request
    can :read, Request, requester_id: user.id
    can :read, :balance

    # Role-specific permissions
    if user.role == "admin"
      can :manage, :all

    elsif user.role == "approver"
      can :read, Request do |request|
        request.status == "pending_approval" &&
        request.request_type.approvers.exists?(user.id)
      end

      can :update, Request do |request|
        request.status == "pending_approval" &&
        request.request_type.approvers.exists?(user.id)
      end

      can :read, RequestType
      can :read, Rule

    elsif user.role == "user"
      can :read, RequestType
      can :read, Rule
    end
  end
end
