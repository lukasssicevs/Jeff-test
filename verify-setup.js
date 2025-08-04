#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

console.log("🔍 Verifying monorepo setup...\n");

// Check environment files
const checks = [
  {
    name: "Web environment file",
    path: "web/.env.local",
    required: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"],
  },
  {
    name: "Mobile environment file",
    path: "mobile/.env",
    required: ["EXPO_PUBLIC_SUPABASE_URL", "EXPO_PUBLIC_SUPABASE_ANON_KEY"],
  },
  {
    name: "Shared package build",
    path: "shared/dist/index.js",
  },
];

let allPassed = true;

checks.forEach((check) => {
  const exists = fs.existsSync(check.path);

  if (!exists) {
    console.log(`❌ ${check.name}: Missing ${check.path}`);
    allPassed = false;
    return;
  }

  if (check.required) {
    const content = fs.readFileSync(check.path, "utf8");
    const missing = check.required.filter((env) => !content.includes(env));

    if (missing.length > 0) {
      console.log(`❌ ${check.name}: Missing variables: ${missing.join(", ")}`);
      allPassed = false;
      return;
    }

    // Check if values are still placeholder
    const hasPlaceholders = check.required.some(
      (env) => content.includes("your_supabase_") || content.includes("=your_")
    );

    if (hasPlaceholders) {
      console.log(`⚠️  ${check.name}: Contains placeholder values`);
    } else {
      console.log(`✅ ${check.name}`);
    }
  } else {
    console.log(`✅ ${check.name}`);
  }
});

console.log(
  "\n" +
    (allPassed
      ? "🎉 Setup verification complete!"
      : "❌ Some checks failed. See above for details.")
);

if (!allPassed) {
  console.log("\n📖 Run the setup commands from README.md to fix issues.");
}
