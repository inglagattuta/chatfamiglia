importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
apiKey: "AIzaSyBlqLEYjO2_XcKRK2cQXlvT1BJyCOeNs74",
  projectId: "chat-famiglia",
  messagingSenderId: "384761033758",
  appId: "1:384761033758:web:93d243a6539eed2f602a0f"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(payload => {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: '/icon.png'
  });
});

