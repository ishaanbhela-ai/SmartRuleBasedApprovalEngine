class AddDeletedAtToTenants < ActiveRecord::Migration[8.1]
  def change
    add_column :tenants, :deleted_at, :datetime
    add_index :tenants, :deleted_at
  end
end
