import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

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

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log('Persistence set to local.');
  })
  .catch((error) => {
    console.error('Error setting persistence:', error);
  });

export { auth, app, db };
