import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const pool = new Pool({
    connectionString: "postgres://postgres:password@localhost/nextvetu",
    idleTimeoutMillis: 30000,
    max: 10,
});

export const useDB = () => drizzle(pool, { schema });

export * from "./schema";
