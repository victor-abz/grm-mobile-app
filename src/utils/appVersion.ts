import { version } from "../../package.json"
import appSchema from "../migrations/appSchema";

type Version = `v${string} - ${number}`
export const appVersion: Version = `v${version} - ${appSchema.version}`;
