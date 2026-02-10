class ChangeRulesUniqueIndex < ActiveRecord::Migration[7.1]
  def change
    # Remove old index
    remove_index :rules,
                 name: "index_rules_on_request_type_id_and_grade"

    # Add partial unique index
    add_index :rules,
              [ :request_type_id, :grade ],
              unique: true,
              where: "deleted_at IS NULL",
              name: "index_rules_on_request_type_grade_active_unique"
  end
end
