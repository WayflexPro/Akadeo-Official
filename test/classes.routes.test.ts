import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import session from "express-session";
import { newDb } from "pg-mem";
import supertest from "supertest";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { default: classesRouter } = await import("../server/routes/classes.mjs");
const poolModule = await import("../server/postgres/pool.mjs");

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use(
    session({
      secret: "test-secret",
      resave: false,
      saveUninitialized: false,
    })
  );

  app.use((req, _res, next) => {
    if (req.headers["x-test-user"] === "demo") {
      req.session.user = {
        id: 1,
        email: "demo@example.com",
        fullName: "Demo Teacher",
        role: "teacher",
        setupCompletedAt: new Date().toISOString(),
      };
    }
    next();
  });

  app.use("/api/classes", classesRouter);
  return app;
}

function loadSchemaSql(): string {
  const schemaPath = resolve(__dirname, "../server/sql/classes.sql");
  return readFileSync(schemaPath, "utf8");
}

async function setupInMemoryDatabase() {
  const db = newDb({ autoCreateForeignKeyIndices: true });
  db.public.registerFunction({
    name: "length",
    args: ["text"],
    returns: "int4",
    implementation: (value: string | null) => {
      if (value == null) return 0;
      return value.length;
    },
  });
  db.public.registerFunction({
    name: "position",
    args: ["text", "text"],
    returns: "int4",
    implementation: (needle: string | null, haystack: string | null) => {
      if (needle == null || haystack == null) return 0;
      return haystack.indexOf(needle) + 1;
    },
  });
  db.public.registerFunction({
    name: "strpos",
    args: ["text", "text"],
    returns: "int4",
    implementation: (haystack: string | null, needle: string | null) => {
      if (needle == null || haystack == null) return 0;
      return haystack.indexOf(needle) + 1;
    },
  });
  db.public.registerOperator({
    operator: "~*",
    left: "text",
    right: "text",
    returns: "bool",
    implementation: (value: string | null, pattern: string | null) => {
      if (value == null || pattern == null) return false;
      return new RegExp(pattern, "i").test(value);
    },
  });

  const { Pool } = db.adapters.createPg();
  const pool = new Pool();
  const schemaSql = loadSchemaSql().replace(
    /position\('@' in invitee_email\)/g,
    "strpos(invitee_email, '@')"
  );
  await pool.query(schemaSql);
  await pool.query(
    "INSERT INTO classes (id, name, code, owner_id, created_at, updated_at) VALUES ($1,$2,$3,$4,now(),now())",
    ["class-001", "Creative Computing", "ABC1234", "teacher-001"]
  );
  return pool;
}

async function main() {
  const app = createTestApp();
  const request = supertest(app);

  const unauthenticated = await request.get("/api/classes/exists?code=ABC1234");
  assert.equal(unauthenticated.status, 401);
  assert.equal(unauthenticated.body?.error?.code, "E_NOT_AUTHENTICATED");

  const pool = await setupInMemoryDatabase();
  poolModule.setPostgresPoolFactoryForTests(() => pool);

  try {
    const authedExists = await request
      .get("/api/classes/exists?code=ABC1234")
      .set("x-test-user", "demo");
    assert.equal(authedExists.status, 200);
    assert.equal(authedExists.body?.data?.exists, true);

    const authedMissing = await request
      .get("/api/classes/exists?code=ZZZ9999")
      .set("x-test-user", "demo");
    assert.equal(authedMissing.status, 200);
    assert.equal(authedMissing.body?.data?.exists, false);
  } finally {
    await pool.end();
    await poolModule.closePostgresPool();
    poolModule.setPostgresPoolFactoryForTests(undefined);
  }
}

main()
  .then(() => {
    console.log("✅ classes route guard test passed");
  })
  .catch((error) => {
    console.error("❌ classes route guard test failed", error);
    process.exitCode = 1;
  });
