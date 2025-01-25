import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './firebase'; 
import Login from './IniciarSesion/Login';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AdminHome from './WebAdmin/home'; 
import UserHome from './WebUsuario/home'; 
import Carga from './Loada/Carga'; 
import { doc, getDoc } from 'firebase/firestore'; 


function App() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        setLoading(true);

        // Verificar en la colección "admin" si el usuario es admin
        const adminDocRef = doc(db, 'admin', user.email);
        const adminDocSnap = await getDoc(adminDocRef);

        if (adminDocSnap.exists()) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }

        // Solo actualizar la base de datos si es la primera vez que se autentica el usuario
        if (!user.metadata.lastSignInTime) { // Verifica si es el primer inicio de sesión
          // Aquí llamas a tu función para actualizar la base de datos
          await actualizarBaseDeDatos();
        }

      } else {
        setUser(null);
        setIsAdmin(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const actualizarBaseDeDatos = async () => {
    // Aquí llamas a tu lógica para actualizar la base de datos.
    // Asegúrate de que esta lógica no cause múltiples ejecuciones.
  };

  if (loading) {
    return <Carga />;
  }

  return (
    <div className="App">
      {user ? (
        isAdmin ? <AdminHome /> : <UserHome />
      ) : (
        <Login />
      )}
    </div>
  );
}

export default App;
