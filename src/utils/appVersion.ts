import { version } from "../../package.json"
import { DB_VERSION } from "../services/shared/SyncService";

type Version = `v${string} - ${number}`
export const appVersion: Version = `v${version} - ${DB_VERSION}`;
