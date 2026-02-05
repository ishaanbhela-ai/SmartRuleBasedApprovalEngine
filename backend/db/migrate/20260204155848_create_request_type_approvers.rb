class CreateRequestTypeApprovers < ActiveRecord::Migration[8.1]
  def change
    create_table :request_type_approvers, id: :uuid do |t|
      t.uuid :request_type_id, null: false
      t.uuid :user_id, null: false
      t.timestamps
    end

    add_index :request_type_approvers,
              [:request_type_id, :user_id],
              unique: true,
              name: "index_request_type_approvers_unique"

    add_foreign_key :request_type_approvers, :request_types
    add_foreign_key :request_type_approvers, :users
  end
end
