import { defineCliConfig } from "sanity/cli";

const projectId = process.env.SANITY_STUDIO_PROJECT_ID;
const dataset = process.env.SANITY_STUDIO_DATASET;
const host = process.env.HOST_NAME;

export default defineCliConfig({
  api: {
    projectId: projectId,
    dataset: dataset,
  },
  studioHost:
    host && host !== "main"
      ? `${host}-turbo-start-sanity`
      : "turbo-start-sanity",
  deployment: {
    appId: process.env.SANITY_STUDIO_APP_ID || undefined,
    autoUpdates: false,
  },

vite: {"ssr":{"external":["lexorank"]}}
,
schemaExtraction: {
  "enabled": true,
  "path": "schema.json",
  "enforceRequiredFields": true
}
,
typegen: {
  "enabled": false
}
});
