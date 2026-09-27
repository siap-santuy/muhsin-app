import versionsData from "@/data/versions.json";

export const APP_VERSIONS = versionsData as Array<{ version: string }>;

export const APP_VERSION: string = APP_VERSIONS[0]?.version ?? "v1.0.0";
