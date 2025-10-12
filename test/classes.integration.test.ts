import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { newDb } from "pg-mem";
import {
  insertClass,
  insertClassMember,
  insertTeacherInvite,
} from "../server/postgres/classesRepository";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const schemaPath = resolve(__dirname, "../server/sql/classes.sql");

function loadSchemaSql(): string {
  return readFileSync(schemaPath, "utf8");
}

async function run() {
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

  try {
    const schemaSql = loadSchemaSql().replace(
      /position\('@' in invitee_email\)/g,
      "strpos(invitee_email, '@')"
    );
    await pool.query(schemaSql);

    const client = await pool.connect();
    try {
      const createdClass = await insertClass(client, {
        name: "Creative Computing",
        description: "Integrate AI copilots into STEM projects.",
        subject: "STEM",
        roomNumber: "204",
        theme: "aurora",
        code: "ABC123",
        imageUrl: "https://example.com/classroom.jpg",
        ownerId: "teacher-001",
      });

      assert.ok(createdClass.id.length > 0, "class id should be a non-empty text value");
      assert.equal(typeof createdClass.id, "string");

      const teacherMember = await insertClassMember(client, {
        classId: createdClass.id,
        userId: createdClass.owner_id,
        role: "teacher",
      });

      const studentMember = await insertClassMember(client, {
        classId: createdClass.id,
        userId: "student-001",
        role: "student",
      });

      assert.notEqual(teacherMember.id, studentMember.id, "distinct nanoid values are generated for members");

      const invite = await insertTeacherInvite(client, {
        classId: createdClass.id,
        email: "co.teacher@example.com",
      });

      assert.equal(invite.status, "pending");
      assert.equal(invite.role, "teacher");

      const { rows: joinedRows } = await client.query(
        `SELECT c.id AS class_id, cm.user_id, cm.role
         FROM classes c
         JOIN class_members cm ON cm.class_id = c.id
         WHERE c.id = $1
         ORDER BY cm.role DESC`,
        [createdClass.id]
      );

      assert.equal(joinedRows.length, 2);
      assert.deepEqual(
        joinedRows.map((row) => row.role).sort(),
        ["student", "teacher"]
      );
      assert.deepEqual(
        joinedRows.map((row) => row.user_id).sort(),
        ["student-001", "teacher-001"]
      );
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }
}

run()
  .then(() => {
    console.log("✅ classes integration test passed");
  })
  .catch((error) => {
    console.error("❌ classes integration test failed", error);
    process.exitCode = 1;
  });
