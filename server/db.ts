import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";
import dns from "node:dns";

const { Pool } = pg;

const HELIUM_HOST = "helium";
const heliumOverride = process.env.HELIUM_HOST_OVERRIDE;

if (heliumOverride) {
  const originalLookup = dns.lookup.bind(dns);
  dns.lookup = ((hostname: string, options?: any, callback?: any) => {
    if (hostname === HELIUM_HOST) {
      const cb =
        typeof options === "function"
          ? options
          : (callback as (
              err: NodeJS.ErrnoException | null,
              address: string | dns.LookupAddress[],
              family?: number,
            ) => void);
      const opts =
        typeof options === "object" && options !== null ? options : undefined;
      const family =
        typeof opts === "object" &&
        "family" in opts &&
        typeof opts.family === "number"
          ? opts.family
          : 4;

      if (opts && "all" in opts && opts.all) {
        return process.nextTick(() => {
          cb(null, [{ address: heliumOverride, family }]);
        });
      }

      return process.nextTick(() => {
        cb(null, heliumOverride, family);
      });
    }

    return originalLookup(hostname, options as any, callback as any);
  }) as typeof dns.lookup;
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });
