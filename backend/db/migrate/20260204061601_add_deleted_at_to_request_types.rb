class AddDeletedAtToRequestTypes < ActiveRecord::Migration[8.1]
  def change
    add_column :request_types, :deleted_at, :datetime
    add_index :request_types, :deleted_at
  end
end
