import webpush from "web-push";

const vapidKeys = webpush.generateVAPIDKeys();

console.log("=== Generated CampusDesk VAPID Keys ===");
console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log("========================================");
