import {defineCliConfig} from 'sanity/cli'
export default defineCliConfig({
typegen: {
  "path": "src/**/*.{ts,tsx,js,jsx}",
  "schema": "../studio/schema.json",
  "generates": "src/lib/sanity/sanity.types.ts",
  "overloadClientMethods": true,
  "enabled": false
}
})
