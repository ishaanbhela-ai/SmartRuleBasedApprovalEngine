class CreateApprovals < ActiveRecord::Migration[8.1]
  def change
    create_table :approvals, id: :uuid do |t|
      t.references :tenant, null: false, foreign_key: true, type: :uuid
      t.references :request, null: false, foreign_key: true, type: :uuid
      t.uuid :approver_id, null: false
      t.references :rule, foreign_key: true, type: :uuid
      t.integer :definition
      t.string :action, null: false
      t.text :reason

      t.timestamps
    end

    # add_index :approvals, :request_id, unique: true
  end
end
