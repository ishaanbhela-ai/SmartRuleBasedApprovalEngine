class CreateRequestTypes < ActiveRecord::Migration[8.1]
  def change
    create_table :request_types, id: :uuid do |t|
      t.references :tenant, null: false, foreign_key: true, type: :uuid
      t.string :name, null: false
      t.uuid :approver_id, null: false

      t.timestamps
    end
    add_foreign_key :request_types, :users, column: :approver_id
    add_index :request_types, [ :tenant_id, :name ], unique: true
  end
end
