const fs = require("fs");
const path = require("path");
const webpush = require("web-push");

const keys = webpush.generateVAPIDKeys();
const envPath = path.join(__dirname, "../.env");

let text = fs.readFileSync(envPath, "utf8");
if (!text.endsWith("\n")) text += "\n";

text += "VAPID_PUBLIC_KEY=" + keys.publicKey + "\n";
text += "VAPID_PRIVATE_KEY=" + keys.privateKey + "\n";
text += "VAPID_SUBJECT=mailto:your-email@example.com\n";

fs.writeFileSync(envPath, text);
console.log("VAPID keys added to .env (public key length " + keys.publicKey.length + ").");