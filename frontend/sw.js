// Shows a desktop notification when the server sends a push
self.addEventListener("push", function (event) {
    let data = { title: "Placement Cell", body: "You have a new update." };
    try {
        data = event.data.json();
    } catch (error) {
        // keep the default text
    }
    event.waitUntil(self.registration.showNotification(data.title, { body: data.body }));
});

// Clicking the notification opens the student dashboard
self.addEventListener("notificationclick", function (event) {
    event.notification.close();
    event.waitUntil(clients.openWindow("/student.html"));
});