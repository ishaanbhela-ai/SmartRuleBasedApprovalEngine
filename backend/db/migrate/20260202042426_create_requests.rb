class CreateRequests < ActiveRecord::Migration[8.1]
  def change
    create_table :requests, id: :uuid do |t|
      t.references :tenant, null: false, foreign_key: true, type: :uuid
      t.references :request_type, null: false, foreign_key: true, type: :uuid
      t.uuid :requester_id, null: false
      t.integer :requested_value, null: false
      t.string :status, null: false

      t.timestamps
    end

    add_foreign_key :requests, :users, column: :requester_id
  end
end
