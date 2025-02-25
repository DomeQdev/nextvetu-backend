import { defineConfig } from "drizzle-kit";

export default defineConfig({
    out: "dist/drizzle",
    schema: "src/db/schema.ts",
    dialect: "postgresql",
    dbCredentials: {
        url: "postgres://postgres:password@localhost/nextvetu",
    },
});
