class CreateRules < ActiveRecord::Migration[8.1]
  def change
    create_table :rules, id: :uuid do |t|
      t.references :tenant, null: false, foreign_key: true, type: :uuid
      t.references :request_type, null: false, foreign_key: true, type: :uuid
      t.integer :grade, null: false
      t.integer :definition, null: false
      t.boolean :is_active, null: false, default: true

      t.timestamps
    end

    add_index :rules, [:request_type_id, :grade], unique: true
  end
end
