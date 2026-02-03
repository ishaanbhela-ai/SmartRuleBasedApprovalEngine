class CreateTenants < ActiveRecord::Migration[8.1]
  def change
    create_table :tenants, id: :uuid do |t|
      t.string :name, null: false
      t.boolean :is_active, default: true
      t.timestamps
    end
  end
end
