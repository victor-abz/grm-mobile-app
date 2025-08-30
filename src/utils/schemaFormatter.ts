import { Schema } from "../repositories/local/BaseLocalRepository";

export function formatSchema(schema: Schema): string {
  return Object.entries(schema)
    .map(([key, value]) => `${key} ${value}`)
    .join(", ");
};


