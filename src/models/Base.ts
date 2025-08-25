export interface Base {
  created_date: Date,
  deleted_date?: Date | null,
  id: string,
  name: string,
  sync_date?: Date | null,
  updated_date?: Date | null
}