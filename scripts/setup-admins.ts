import dotenv from "dotenv";
import path from "path";
import { randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ Supabase URL or Service Role Key is missing in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TARGET_ADMINS = [
  {
    email: "rudravchaudhari167@gmail.com",
    name: "Rudra Chaudhari",
    defaultPassword: "Admin@12345",
  },
  {
    email: "vap1414@gmail.com",
    name: "Admin VAP",
    defaultPassword: "Admin@12345",
  },
];

async function setupAdmins() {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  VRINDAV — Provisioning Dedicated Admins");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  for (const admin of TARGET_ADMINS) {
    const email = admin.email.toLowerCase().trim();
    const { data: existing, error: fetchErr } = await supabase
      .from("users")
      .select("id, name, email, role, password_hash, is_active")
      .eq("email", email)
      .maybeSingle();

    if (fetchErr) {
      console.error(`Error querying user ${email}:`, fetchErr.message);
      continue;
    }

    if (existing) {
      console.log(`Found existing account for ${email} (current role: ${existing.role}).`);
      const { error: updateErr } = await supabase
        .from("users")
        .update({
          role: "ADMIN",
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (updateErr) {
        console.error(`❌ Failed to promote ${email}:`, updateErr.message);
      } else {
        console.log(`✅ Successfully promoted ${email} to ADMIN.`);
      }
    } else {
      console.log(`Creating new admin account for ${email}...`);
      const passwordHash = await bcrypt.hash(admin.defaultPassword, 12);
      const newId = randomUUID();

      const { error: insertErr } = await supabase.from("users").insert({
        id: newId,
        name: admin.name,
        email,
        phone: "",
        password_hash: passwordHash,
        role: "ADMIN",
        is_active: true,
      });

      if (insertErr) {
        console.error(`❌ Failed to create admin ${email}:`, insertErr.message);
      } else {
        console.log(`✅ Created admin ${email} with initial password "${admin.defaultPassword}".`);
      }
    }
  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Admin accounts ready!");
}

setupAdmins().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
