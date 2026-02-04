class Ability
  include CanCan::Ability

  def initialize(user)
    return unless user
    can :read, :balance if user.role.in?(%w[user approver admin])

    if user.role == "admin"
      can :manage, :all

    elsif user.role == "approver"
      can :create, Request
      can :read, Request, request_type: { approver_id: user.id }
      can :update, Request, status: "pending_approval"
      can :read, RequestType
      can :read, Rule

    elsif user.role == "user"
      can :create, Request
      can :read, Request, requester_id: user.id
      can :read, RequestType
      can :read, Rule
    end
  end
end
