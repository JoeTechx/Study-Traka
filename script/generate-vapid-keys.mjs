// scripts/generate-vapid-keys.mjs
// Run once: node scripts/generate-vapid-keys.mjs
// Then paste the output into your .env.local

import webpush from "web-push";

const keys = webpush.generateVAPIDKeys();
console.log("\n✅ VAPID Keys generated — add these to your .env.local:\n");
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`);
console.log(`VAPID_EMAIL=mailto:your@email.com`);
console.log("\n⚠️  Keep VAPID_PRIVATE_KEY secret — never expose it client-side.\n");
