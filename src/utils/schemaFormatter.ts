import { Schema } from "../repositories/local/BaseLocalRepository";

export function formatSchema<T>(schema: Schema<T>): string {
      return Object.entries(schema)
        .map(([key, value]) => `${key} ${value}`)
        .join(", ");
};
  

