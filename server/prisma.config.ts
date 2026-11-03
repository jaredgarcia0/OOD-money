import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// Used by the Prisma CLI (generate, migrate, studio).
// Migrations use DIRECT_URL when set (Neon's non-pooled connection string), otherwise DATABASE_URL.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    // Optional. Only needed when the database server can't create a temporary shadow database itself.
    shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
  },
});
