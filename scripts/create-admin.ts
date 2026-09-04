import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "❌ Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

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
  const { data: existingAdmin } = await supabase
    .from("users")
    .select("id")
    .eq("role", "ADMIN")
    .limit(1)
    .maybeSingle();
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

  const { data: admin, error } = await supabase
    .from("users")
    .insert({
      id: randomUUID(),
      name: "Admin",
      email,
      phone: "",
      password_hash: hashedPassword,
      role: "ADMIN",
      is_active: true,
    })
    .select("id, email, role")
    .single();

  if (error) {
    console.error("❌ Failed to create admin:", error.message);
    process.exit(1);
  }

  console.log("\n✅ Admin account created successfully!");
  console.log(`   Email: ${email}`);
  console.log(`   Role:  ADMIN`);
  console.log(`   ID:    ${admin.id}`);

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