class CreateUsers < ActiveRecord::Migration[8.1]
  def change
    create_table :users, id: :uuid do |t|
      t.references :tenant, null: false, foreign_key: true, type: :uuid
      t.string :email, null: false
      t.string :password_digest, null: false
      t.string :name, null: false
      t.string :role, null: false
      t.integer :grade, null: false
      t.boolean :is_active, default: true

      t.timestamps
    end

    add_index :users, :email, unique: true
  end
end
