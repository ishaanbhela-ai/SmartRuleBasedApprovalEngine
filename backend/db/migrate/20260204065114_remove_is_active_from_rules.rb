class RemoveIsActiveFromRules < ActiveRecord::Migration[8.1]
  def change
    remove_column :rules, :is_active, :boolean
  end
end
