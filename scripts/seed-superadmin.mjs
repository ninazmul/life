/**
 * Seed script: Upserts nazmulsaw@gmail.com as super_admin in MongoDB.
 * Run with: node scripts/seed-superadmin.mjs
 */

import mongoose from "mongoose";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFileSync } from "fs";

// Load .env.local manually
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, "../.env.local");

// Parse .env.local
const envContent = readFileSync(envPath, "utf8");
const envVars = Object.fromEntries(
  envContent
    .split("\n")
    .filter((line) => line.includes("=") && !line.startsWith("#"))
    .map((line) => {
      const [key, ...rest] = line.split("=");
      return [key.trim(), rest.join("=").trim()];
    })
);

const MONGODB_URI = envVars["MONGODB_URI"];
if (!MONGODB_URI) {
  console.error("❌  MONGODB_URI not found in .env.local");
  process.exit(1);
}

// Inline Admin Schema (no TypeScript imports needed)
const AdminSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: { type: String, trim: true, default: "" },
    role: {
      type: String,
      enum: ["super_admin", "admin", "editor", "moderator", "viewer", "custom"],
      default: "admin",
    },
    permissions: { type: Map, of: String, default: {} },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Admin =
  mongoose.models?.Admin || mongoose.model("Admin", AdminSchema);

async function seedSuperAdmin() {
  console.log("🔗 Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("✅  Connected.\n");

  const email = "nazmulsaw@gmail.com";
  const name = "N. I. Nazmul";

  const existing = await Admin.findOne({ email });

  if (existing) {
    existing.role = "super_admin";
    existing.isActive = true;
    existing.name = existing.name || name;
    await existing.save();
    console.log(`♻️  Updated existing admin → role: super_admin`);
    console.log(`   Email : ${existing.email}`);
    console.log(`   Name  : ${existing.name}`);
    console.log(`   Active: ${existing.isActive}`);
  } else {
    const created = await Admin.create({
      email,
      name,
      role: "super_admin",
      isActive: true,
    });
    console.log(`🌱 Created new super_admin:`);
    console.log(`   Email : ${created.email}`);
    console.log(`   Name  : ${created.name}`);
    console.log(`   ID    : ${created._id}`);
  }

  console.log("\n✅  Seed complete. nazmulsaw@gmail.com is now super_admin.");
  await mongoose.disconnect();
  process.exit(0);
}

seedSuperAdmin().catch((err) => {
  console.error("❌  Seed failed:", err.message);
  process.exit(1);
});
