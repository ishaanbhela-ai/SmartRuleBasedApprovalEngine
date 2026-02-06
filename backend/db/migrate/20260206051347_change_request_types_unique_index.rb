class ChangeRequestTypesUniqueIndex < ActiveRecord::Migration[7.1]
  def change
    # Remove old global unique index
    remove_index :request_types,
                 name: "index_request_types_on_tenant_id_and_name"

    # Add partial unique index (soft delete aware)
    add_index :request_types,
              [ :tenant_id, :name ],
              unique: true,
              where: "deleted_at IS NULL",
              name: "index_request_types_on_tenant_id_name_active_unique"
  end
end
