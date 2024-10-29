import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Configuración de Firebase
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

// Inicializa la aplicación Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const messaging = getMessaging(app);

// Configura la persistencia de autenticación
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log('Persistence set to local.');
  })
  .catch((error) => {
    console.error('Error setting persistence:', error);
  });

// Solicitar permiso y obtener el token de FCM
export const requestPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, { vapidKey: 'BPTQnOUzaxKQjsWX5O8T09A77fnKCy-renXG6dL6BOAm9YE1NFmdfMLCePYXAewEeGu-nHYKXd8F3Bz9aK15GNA' }); // Cambia a tu VAPID Key
      console.log('FCM Token:', token);
      return token;
    } else {
      console.error('Permiso para notificaciones denegado.');
    }
  } catch (error) {
    console.error('Error al obtener el token de FCM:', error);
  }
};

// Manejar mensajes en primer plano
onMessage(messaging, (payload) => {
  console.log('Mensaje recibido en primer plano: ', payload);
  // Mostrar notificación
  new Notification(payload.notification.title, {
    body: payload.notification.body,
    icon: payload.notification.icon, // Asegúrate de tener una imagen para el icono
  });
});

export { auth, app, db, messaging };
