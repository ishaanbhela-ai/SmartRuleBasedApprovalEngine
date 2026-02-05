class RemoveApproverIdFromRequestTypes < ActiveRecord::Migration[8.1]
  def change
    remove_column :request_types, :approver_id, :uuid
  end
end
