import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Configuración de Firebase desde variables de entorno
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Clave pública VAPID desde variables de entorno
const vapidKey = process.env.REACT_APP_VAPID_KEY;

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
      const token = await getToken(messaging, { vapidKey });
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
    icon: payload.notification.icon || 'path/to/icon.png', // Asegúrate de tener una imagen para el icono
  });
});

// Función para obtener documentos de la colección "finance"
export const getFinanceDocuments = async () => {
  const financeCollection = collection(db, 'finance');
  const financeSnapshot = await getDocs(financeCollection);
  const financeList = financeSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  return financeList;
};

// Exportar variables y funciones
export { auth, app, db, messaging };
