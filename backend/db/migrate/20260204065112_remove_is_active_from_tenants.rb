class RemoveIsActiveFromTenants < ActiveRecord::Migration[8.1]
  def change
    remove_column :tenants, :is_active, :boolean
  end
end
