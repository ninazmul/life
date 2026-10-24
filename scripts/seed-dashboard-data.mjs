import mongoose from "mongoose";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFileSync } from "fs";

// Load .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, "../.env.local");

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
  console.error("❌ MONGODB_URI not found");
  process.exit(1);
}

await mongoose.connect(MONGODB_URI);
const db = mongoose.connection.db;

console.log("Connected to MongoDB. Checking collections...");

// 1. Ensure Sabbir exists in lifepeople
let sabbir = await db.collection("lifepeople").findOne({ name: /Sabbir/i });
if (!sabbir) {
  const insertRes = await db.collection("lifepeople").insertOne({
    name: "Sabbir Ahmed",
    email: "sabbir@example.com",
    role: "individual",
    relation: "Brother / Partner",
    status: "active",
    emergencyPriority: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  sabbir = { _id: insertRes.insertedId, name: "Sabbir Ahmed" };
  console.log("Created Sabbir person:", sabbir._id);
} else {
  console.log("Found Sabbir person:", sabbir._id);
}

// 2. Ensure Rahim exists in lifepeople
let rahim = await db.collection("lifepeople").findOne({ name: /Rahim/i });
if (!rahim) {
  const insertRes = await db.collection("lifepeople").insertOne({
    name: "Rahim Chowdhury",
    email: "rahim@example.com",
    role: "individual",
    relation: "Colleague",
    status: "active",
    emergencyPriority: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  rahim = { _id: insertRes.insertedId, name: "Rahim Chowdhury" };
  console.log("Created Rahim person:", rahim._id);
}

// 3. Check assets count, seed if 0
const assetCount = await db.collection("lifeassets").countDocuments();
if (assetCount === 0) {
  const now = new Date();
  await db.collection("lifeassets").insertMany([
    {
      name: "City Bank Current Account & Cash Reserve",
      category: "bank_balance",
      value: 250000,
      currency: "BDT",
      ownershipPercentage: 100,
      location: "City Bank, Gulshan Branch",
      notes: "Operating capital & emergency liquid funds",
      status: "active",
      createdAt: now,
      updatedAt: now,
    },
    {
      name: "Uttara Commercial Plot / Apartment Share",
      category: "property",
      value: 500000,
      currency: "BDT",
      ownershipPercentage: 100,
      location: "Sector 11, Uttara, Dhaka",
      notes: "Deed registered in local sub-registry office",
      rentalUnits: 1,
      monthlyRentalIncome: 25000,
      status: "active",
      createdAt: now,
      updatedAt: now,
    },
    {
      name: "GESN Ltd Enterprise Equity Share",
      category: "business_investment",
      value: 200000,
      currency: "BDT",
      ownershipPercentage: 35,
      location: "Dhaka, Bangladesh",
      notes: "Operating tech enterprise equity holding",
      status: "active",
      createdAt: now,
      updatedAt: now,
    },
    {
      name: "Motor Vehicle & Physical Gold Reserves",
      category: "valuable",
      value: 150000,
      currency: "BDT",
      ownershipPercentage: 100,
      location: "Safe Locker #42",
      notes: "Physical bullion and vehicle assets",
      status: "active",
      createdAt: now,
      updatedAt: now,
    },
  ]);
  console.log("Seeded 4 LifeAssets totaling ৳1,100,000 (plus ৳150,000 loan receivable = ৳1,250,000)!");
}

// 4. Check money records count, seed if 0
const moneyCount = await db.collection("lifemoneyrecords").countDocuments();
if (moneyCount === 0) {
  const now = new Date();
  const dueDate1 = new Date();
  dueDate1.setDate(now.getDate() + 15);
  const dueDate2 = new Date();
  dueDate2.setDate(now.getDate() + 30);
  const dueDate3 = new Date();
  dueDate3.setDate(now.getDate() + 60);

  await db.collection("lifemoneyrecords").insertMany([
    // Loan given 1: Sabbir Ahmed (Original 60,000, Repaid 15,000, Remaining 45,000)
    {
      type: "given",
      personId: sabbir._id,
      personName: "Sabbir Ahmed",
      amount: 60000,
      currency: "BDT",
      date: now,
      purpose: "Business expansion equipment",
      expectedReturnDate: dueDate1,
      paidAmount: 15000,
      remainingAmount: 45000,
      status: "partially_returned",
      notes: "Repayments scheduled monthly",
      createdAt: now,
      updatedAt: now,
    },
    // Loan given 2: Rahim Chowdhury (Original 70,000, Repaid 10,000, Remaining 60,000)
    {
      type: "given",
      personId: rahim._id,
      personName: "Rahim Chowdhury",
      amount: 70000,
      currency: "BDT",
      date: now,
      purpose: "Personal emergency assistance",
      expectedReturnDate: dueDate2,
      paidAmount: 10000,
      remainingAmount: 60000,
      status: "active",
      notes: "Installment due this month",
      createdAt: now,
      updatedAt: now,
    },
    // Another loan given for receivable breakdown (Original 45,000, Remaining 45,000) -> Total Given Remaining = 150,000 (Receivables)
    {
      type: "given",
      personName: "Farhan Enterprise",
      organization: "Farhan Tech",
      amount: 45000,
      currency: "BDT",
      date: now,
      purpose: "Server cluster pre-payment",
      expectedReturnDate: dueDate3,
      paidAmount: 0,
      remainingAmount: 45000,
      status: "active",
      notes: "Commercial invoice receivable",
      createdAt: now,
      updatedAt: now,
    },
    // Total Liabilities: Loan taken / payable of ৳3,20,000
    {
      type: "taken",
      personName: "Prime Bank Commercial Loan",
      organization: "Prime Bank PLC",
      amount: 400000,
      currency: "BDT",
      date: now,
      purpose: "Working capital facility",
      expectedReturnDate: dueDate3,
      paidAmount: 80000,
      remainingAmount: 320000,
      status: "active",
      notes: "Monthly installment payables",
      createdAt: now,
      updatedAt: now,
    },
  ]);
  console.log("Seeded LifeMoneyRecords (Liabilities ৳3,20,000, Loans given ৳1,05,000 active, total receivables ৳1,50,000)!");
}

// 5. Check responsibilities count, seed if 0
const respCount = await db.collection("liferesponsibilities").countDocuments();
if (respCount === 0) {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 5);

  await db.collection("liferesponsibilities").insertMany([
    {
      title: "Sabbir insurance renewal",
      detailedInstruction: "Insurance will expire in 5 days (Oct 28, 2026). Please renew or update the status.",
      assignedPersonId: sabbir._id,
      priority: "high",
      deadline: expiryDate,
      completionStatus: "in_progress",
      visibilityMode: "always_visible",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);
  console.log("Seeded 'Sabbir insurance renewal' responsibility!");
}

// 6. Check requests count, seed if 0
const reqCount = await db.collection("liferequests").countDocuments();
if (reqCount === 0) {
  await db.collection("liferequests").insertMany([
    {
      submittedByPersonId: sabbir._id,
      submittedByUserId: "user_sabbir_mock",
      submittedByName: "Sabbir Ahmed",
      submittedByEmail: "sabbir@example.com",
      submittedByRole: "individual",
      category: "access_request",
      title: "Emergency Medical Dossier Access",
      description: "Requesting verified access to emergency contact details and medical blood group records.",
      status: "pending",
      messages: [],
      unreadByAdmin: 1,
      unreadByUser: 0,
      isNewForAdmin: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);
  console.log("Seeded access request from Sabbir!");
}

await mongoose.disconnect();
console.log("Database successfully seeded!");
