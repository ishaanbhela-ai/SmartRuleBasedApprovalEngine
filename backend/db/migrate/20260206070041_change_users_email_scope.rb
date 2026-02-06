class ChangeUsersEmailScope < ActiveRecord::Migration[7.1]
  def change
    # Remove old global unique index
    remove_index :users,
                 name: "index_users_on_email_active_unique"

    # Add soft delete aware unique index
    add_index :users,
              [ :tenant_id, :email ],
              unique: true,
              where: "deleted_at IS NULL",
              name: "index_users_on_tenant_id_email_active_unique"
  end
end
