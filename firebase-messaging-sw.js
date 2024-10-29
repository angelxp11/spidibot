// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging.js');

// Inicializa Firebase
const firebaseConfig = {
    apiKey: "AIzaSyD9trSuw-JqhT70wND-apjE8H6UvAYU8Q0",
    authDomain: "spidijade.firebaseapp.com",
    databaseURL: "https://spidijade-default-rtdb.firebaseio.com",
    projectId: "spidijade",
    storageBucket: "spidijade.appspot.com",
    messagingSenderId: "1004590831928",
    appId: "1:1004590831928:web:d1b037cb0b71082d4409cd",
    measurementId: "G-5F3JLQFPCN"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Manejar mensajes en segundo plano
messaging.onBackgroundMessage((payload) => {
    console.log('Mensaje en segundo plano recibido: ', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: payload.notification.icon,
    };

    // Muestra la notificación
    self.registration.showNotification(notificationTitle, notificationOptions);
});
