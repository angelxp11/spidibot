import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './firebase'; // Asegúrate de importar la configuración correcta de Firebase
import Login from './IniciarSesion/Login';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AdminHome from './WebAdmin/home'; // Componente del admin
import UserHome from './WebUsuario/home'; // Componente del usuario
import Carga from './Loada/Carga'; // Asegúrate de que la ruta del componente Carga sea correcta
import { doc, getDoc } from 'firebase/firestore'; // Importar funciones necesarias de Firestore
import CustomSelect from './WebAdmin/VerEstados/Select';

function App() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(null); // Estado para determinar si es admin o no
  const [loading, setLoading] = useState(true); // Mostrar pantalla de carga mientras se determina el tipo de usuario
  const [selectedOption, setSelectedOption] = useState('Selecciona una opción'); // Opción seleccionada para el CustomSelect

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        setLoading(true); // Mostrar la carga mientras se verifica si es admin

        // Verificar en la colección "admin" si el usuario es admin
        const adminDocRef = doc(db, 'admin', user.email); // Buscar por el ID igual al email del usuario
        const adminDocSnap = await getDoc(adminDocRef);

        if (adminDocSnap.exists()) {
          setIsAdmin(true); // Si el documento existe, es admin
        } else {
          setIsAdmin(false); // Si no existe, es usuario normal
        }
      } else {
        setUser(null);
        setIsAdmin(null); // Reiniciar el estado
      }
      setLoading(false); // Ocultar la carga después de verificar
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <Carga />; // Mostrar pantalla de carga mientras se verifica el tipo de usuario
  }

  // Opciones para el CustomSelect
  const options = ['Opción 1', 'Opción 2', 'Opción 3'];

  return (
    <div className="App">
      {user ? (
        <>
          {isAdmin ? (
            <>
              <AdminHome />
              <CustomSelect
                options={options}
                selectedOption={selectedOption}
                onOptionChange={(option) => setSelectedOption(option)}
              />
            </>
          ) : (
            <>
              <UserHome />
              <CustomSelect
                options={options}
                selectedOption={selectedOption}
                onOptionChange={(option) => setSelectedOption(option)}
              />
            </>
          )}
        </>
      ) : (
        <Login />
      )}
      <ToastContainer />
    </div>
  );
}

export default App;
