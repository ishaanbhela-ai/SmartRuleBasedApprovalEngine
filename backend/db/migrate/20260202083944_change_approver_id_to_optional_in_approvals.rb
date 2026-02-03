class ChangeApproverIdToOptionalInApprovals < ActiveRecord::Migration[8.1]
  def change
    change_column_null :approvals, :approver_id, true
  end
end
