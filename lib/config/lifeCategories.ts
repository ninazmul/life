/**
 * Static configuration for the 6 main Life Vault categories.
 * NOTE: This file must NOT have "use server" — it is a shared constant
 * imported by both server actions and client components.
 */

import { MainCategoryKey } from "@/types";

export interface MainCategoryConfig {
  key: MainCategoryKey;
  title: string;
  description: string;
  defaultSubcategories: string[];
}

export const MAIN_CATEGORIES: MainCategoryConfig[] = [
  {
    key: "financial_care",
    title: "Financial Care",
    description: "Support payments, debts, receivables, and capital tracking",
    defaultSubcategories: [
      "Family & Dependent Allowances",
      "Education & Healthcare Support",
      "Personal Loans & Debt Settlements",
      "Venture Capital & Investments",
    ],
  },
  {
    key: "estate_wasiyyah",
    title: "Estate & Wasiyyah",
    description: "Testaments, asset allocations, property deeds, and nominee declarations",
    defaultSubcategories: [
      "Wasiyyah & Testament Directives",
      "Heir & Nominee Allocations",
      "Real Estate Deeds & Valuables",
      "Private Equity & Company Shares",
    ],
  },
  {
    key: "roles_responsibilities",
    title: "Roles & Responsibilities",
    description: "Operational continuity tasks, family guardianship, and business duties",
    defaultSubcategories: [
      "Immediate Family Caretaking",
      "Business Operational Continuity",
      "Payroll & Supplier Obligations",
      "Legal & Representation Duties",
    ],
  },
  {
    key: "emergency_contacts",
    title: "Emergency Contacts & Help",
    description: "Key people, doctors, lawyers, accountants, and priority call tree",
    defaultSubcategories: [
      "Immediate Emergency Call Tree",
      "Primary Physicians & Hospitals",
      "Legal Advisors & Notaries",
      "System Engineers & Cloud Admins",
    ],
  },
  {
    key: "security_access",
    title: "Security & Access",
    description: "Master security PIN, emergency protocol triggers, and vault recovery",
    defaultSubcategories: [
      "Master PIN Gate & Audit Rules",
      "Emergency Protocol Delegation",
      "Vault Passwords & Recovery Keys",
      "Role-Based Access Matrices",
    ],
  },
  {
    key: "instructions_messages",
    title: "Instructions & Messages",
    description: "Sealed legacy letters, operational instructions, and funeral wishes",
    defaultSubcategories: [
      "Sealed Legacy & Farewell Letters",
      "Operational Handover Protocols",
      "Digital Accounts & Passwords Access",
      "Religious Directives & Final Wishes",
    ],
  },
];
