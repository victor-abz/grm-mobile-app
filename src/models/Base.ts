export interface Base {
  created_at: Date,
  deleted_at?: Date | null,
  id: string,
  name: string,
  sync_at?: Date | null,
  updated_at?: Date | null
}