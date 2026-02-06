class Rule < ApplicationRecord
  include SoftDeletable
  belongs_to :tenant
  belongs_to :request_type

  validates :grade, inclusion: { in: [ 1, 2, 3 ] }
  validates :definition, presence: true, numericality: { greater_than: 0 }
  validates :request_type_id, uniqueness: { scope: :grade, conditions: -> { where(deleted_at: nil) } }
end
