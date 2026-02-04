class RemoveIsActiveFromUsers < ActiveRecord::Migration[8.1]
  def change
    remove_column :users, :is_active, :boolean
  end
end
