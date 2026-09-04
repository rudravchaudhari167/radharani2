/* eslint-disable no-console */
import dotenv from "dotenv";
import path from "path";
import crypto from "crypto";
import fs from "fs";
import { createRequire } from "module";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const require = createRequire(import.meta.url);
const { connectToDatabase } = require("../src/lib/db");
const bcrypt = require("bcryptjs");
const User = require("../src/models/User").default;

const isTTY = Boolean(process.stdin.isTTY);
let pipedLines: string[] = [];
if (!isTTY) {
  try {
    const all = fs.readFileSync(0, "utf8");
    pipedLines = all.split("\n");
  } catch {
    /* noop */
  }
}

function ask(question: string): string {
  if (isTTY) {
    process.stdout.write(question);
    const buf = Buffer.alloc(4096);
    const bytes = fs.readSync(0, buf, 0, buf.length, null);
    return buf.toString("utf8", 0, bytes).trim();
  }
  return (pipedLines.shift() || "").trim();
}

function generatePassword(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

async function createAdmin() {
  await connectToDatabase();

  const existingAdmin = await User.findOne({ role: "ADMIN" });
  if (existingAdmin) {
    console.error(
      "❌ An admin account already exists. Use this account to manage the store."
    );
    process.exit(1);
  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  VRINDAV — Secure Admin Account Creation");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const email = ask("Admin email: ").toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error("❌ Invalid email address.");
    process.exit(1);
  }

  let password = ask("Admin password (leave blank to auto-generate): ");
  if (!password) {
    password = generatePassword();
    console.log(`\n🔑 Auto-generated password: ${password}`);
    console.log("   ⚠️  Save this now — it will not be shown again.");
  }

  if (password.length < 8) {
    console.error("❌ Password must be at least 8 characters.");
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const admin = await User.create({
    name: "Admin",
    email,
    phone: "",
    passwordHash: hashedPassword,
    role: "ADMIN",
    isActive: true,
  });

  console.log("\n✅ Admin account created successfully!");
  console.log(`   Email: ${email}`);
  console.log(`   Role:  ADMIN`);
  console.log(`   ID:    ${admin._id}`);

  console.log("\nRun the app and log in at /admin/login");
  console.log("\nFor non-interactive setups, set in .env.local:");
  console.log("   ADMIN_EMAIL=" + email);
  console.log("   ADMIN_PASSWORD_HASH=" + hashedPassword);

  process.exit(0);
}

createAdmin().catch((err) => {
  console.error("Failed to create admin:", err);
  process.exit(1);
});