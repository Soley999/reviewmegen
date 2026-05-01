import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import { nanoid } from "nanoid";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "../../data/db.json");
let db;

export async function initDb() {
  if (!fs.existsSync(dbPath)) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    fs.writeFileSync(dbPath, JSON.stringify({ users: [], reviewers: [] }, null, 2));
  }

  const adapter = new JSONFile(dbPath);
  db = new Low(adapter, { users: [], reviewers: [] });
  await db.read();
  db.data ||= { users: [], reviewers: [] };
  await db.write();
}

function ensureDb() {
  if (!db) {
    throw new Error("Database not initialized.");
  }
}

export async function createUser({ email, name, passwordHash }) {
  ensureDb();
  const user = {
    id: nanoid(),
    email,
    name,
    passwordHash,
    createdAt: new Date().toISOString()
  };

  db.data.users.push(user);
  await db.write();
  return user;
}

export async function findUserByEmail(email) {
  ensureDb();
  await db.read();
  return db.data.users.find((user) => user.email === email) || null;
}

export async function getUserById(id) {
  ensureDb();
  await db.read();
  return db.data.users.find((user) => user.id === id) || null;
}

export async function saveReviewer(reviewer) {
  ensureDb();
  const entry = {
    ...reviewer,
    id: nanoid(),
    createdAt: new Date().toISOString()
  };

  db.data.reviewers.push(entry);
  await db.write();
  return entry;
}

export async function listReviewersForUser(userId) {
  ensureDb();
  await db.read();
  return db.data.reviewers.filter((reviewer) => reviewer.userId === userId);
}

export async function getReviewerById(id) {
  ensureDb();
  await db.read();
  return db.data.reviewers.find((reviewer) => reviewer.id === id) || null;
}

export async function deleteReviewer(id, userId) {
  ensureDb();
  await db.read();
  const originalCount = db.data.reviewers.length;
  db.data.reviewers = db.data.reviewers.filter(
    (reviewer) => !(reviewer.id === id && reviewer.userId === userId)
  );
  const changed = db.data.reviewers.length !== originalCount;
  await db.write();
  return changed;
}
