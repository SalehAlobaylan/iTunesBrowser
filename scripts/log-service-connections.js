#!/usr/bin/env node

const cmsBaseUrl = process.env.NEXT_PUBLIC_CMS_BASE_URL || "http://localhost:8080";
const iamBaseUrl = process.env.NEXT_PUBLIC_IAM_BASE_URL || "http://localhost:4003";
const aggregationBaseUrl = process.env.NEXT_PUBLIC_AGGREGATION_BASE_URL || "(disabled)";
const rawMode = (process.env.NEXT_PUBLIC_AUTH_MODE || "bridge").toLowerCase();
const authMode = ["cms", "bridge", "iam"].includes(rawMode) ? rawMode : "bridge";

function authProviderSummary(mode) {
  if (mode === "iam") {
    return "IAM only (IAM issues and powers Console auth token)";
  }
  if (mode === "cms") {
    return "CMS only (legacy /admin/login powers Console auth token)";
  }
  return "Bridge mode (IAM login + CMS token bridge powers CMS API auth)";
}

console.log("[Platform-Console] Service connection config");
console.log(`- Auth mode: ${authMode}`);
console.log(`- Auth provider: ${authProviderSummary(authMode)}`);
console.log("- Database: none (frontend-only app)");
console.log(`- IAM service: ${iamBaseUrl}`);
console.log(`- CMS service: ${cmsBaseUrl}`);
console.log(`- Aggregation service: ${aggregationBaseUrl}`);
