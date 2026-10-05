const webpush = require("web-push");
const PushSubscription = require("../models/PushSubscription");

let configured = false;

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT) {
    try {
        webpush.setVapidDetails(
            process.env.VAPID_SUBJECT,
            process.env.VAPID_PUBLIC_KEY.trim(),
            process.env.VAPID_PRIVATE_KEY.trim()
        );
        configured = true;
    } catch (error) {
        console.error("Push notifications are off: " + error.message);
    }
} else {
    console.log("Push notifications are off: VAPID keys are missing in .env");
}

async function sendToStudent(studentId, message) {
    if (!configured) return;

    const subscriptions = await PushSubscription.findByStudent(studentId);
    for (const s of subscriptions) {
        try {
            await webpush.sendNotification(
                { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
                JSON.stringify({ title: "Placement Cell", body: message })
            );
        } catch (error) {
            if (error.statusCode === 404 || error.statusCode === 410) {
                await PushSubscription.removeByEndpoint(s.endpoint);
            } else {
                console.error("Push error:", error.message);
            }
        }
    }
}

module.exports = { sendToStudent };