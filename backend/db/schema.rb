# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_02_04_155925) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "approvals", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "action", null: false
    t.uuid "approver_id"
    t.datetime "created_at", null: false
    t.integer "definition"
    t.text "reason"
    t.uuid "request_id", null: false
    t.uuid "rule_id"
    t.uuid "tenant_id", null: false
    t.datetime "updated_at", null: false
    t.index ["request_id"], name: "index_approvals_on_request_id"
    t.index ["rule_id"], name: "index_approvals_on_rule_id"
    t.index ["tenant_id"], name: "index_approvals_on_tenant_id"
  end

  create_table "request_type_approvers", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.uuid "request_type_id", null: false
    t.datetime "updated_at", null: false
    t.uuid "user_id", null: false
    t.index ["request_type_id", "user_id"], name: "index_request_type_approvers_unique", unique: true
  end

  create_table "request_types", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "deleted_at"
    t.string "name", null: false
    t.uuid "tenant_id", null: false
    t.datetime "updated_at", null: false
    t.index ["deleted_at"], name: "index_request_types_on_deleted_at"
    t.index ["tenant_id", "name"], name: "index_request_types_on_tenant_id_and_name", unique: true
    t.index ["tenant_id"], name: "index_request_types_on_tenant_id"
  end

  create_table "requests", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.uuid "request_type_id", null: false
    t.integer "requested_value", null: false
    t.uuid "requester_id", null: false
    t.string "status", null: false
    t.uuid "tenant_id", null: false
    t.datetime "updated_at", null: false
    t.index ["request_type_id"], name: "index_requests_on_request_type_id"
    t.index ["tenant_id"], name: "index_requests_on_tenant_id"
  end

  create_table "rules", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.integer "definition", null: false
    t.datetime "deleted_at"
    t.integer "grade", null: false
    t.uuid "request_type_id", null: false
    t.uuid "tenant_id", null: false
    t.datetime "updated_at", null: false
    t.index ["deleted_at"], name: "index_rules_on_deleted_at"
    t.index ["request_type_id", "grade"], name: "index_rules_on_request_type_id_and_grade", unique: true
    t.index ["request_type_id"], name: "index_rules_on_request_type_id"
    t.index ["tenant_id"], name: "index_rules_on_tenant_id"
  end

  create_table "tenants", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "deleted_at"
    t.string "name", null: false
    t.datetime "updated_at", null: false
    t.index ["deleted_at"], name: "index_tenants_on_deleted_at"
  end

  create_table "users", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "deleted_at"
    t.string "email", null: false
    t.integer "grade", null: false
    t.string "name", null: false
    t.string "password_digest", null: false
    t.string "role", null: false
    t.uuid "tenant_id", null: false
    t.datetime "updated_at", null: false
    t.index ["deleted_at"], name: "index_users_on_deleted_at"
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["tenant_id"], name: "index_users_on_tenant_id"
  end

  add_foreign_key "approvals", "requests"
  add_foreign_key "approvals", "rules"
  add_foreign_key "approvals", "tenants"
  add_foreign_key "request_type_approvers", "request_types"
  add_foreign_key "request_type_approvers", "users"
  add_foreign_key "request_types", "tenants"
  add_foreign_key "requests", "request_types"
  add_foreign_key "requests", "tenants"
  add_foreign_key "requests", "users", column: "requester_id"
  add_foreign_key "rules", "request_types"
  add_foreign_key "rules", "tenants"
  add_foreign_key "users", "tenants"
end
