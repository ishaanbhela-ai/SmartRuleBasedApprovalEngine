class Ability
  include CanCan::Ability

  def initialize(user)
    return unless user

    if user.role == "admin"
      can :manage, :all
      can :read, User
      can :destroy, User

    elsif user.role == "approver"
      can :read, Request, request_type: { approver_id: user.id }
      can :update, Request, status: "pending_approval"

    elsif user.role == "user"
      can :create, Request
      can :read, Request, requester_id: user.id
    end
  end
end
