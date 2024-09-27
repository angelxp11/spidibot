import React from 'react';
import { auth } from '../firebase'; // Asegúrate de que el path de firebase es correcto
import { signOut } from 'firebase/auth'; // Importa la función de cerrar sesión
import './home.css'; // Importa los estilos si los tienes

function Home() {
  // Obtén el email del usuario autenticado
  const user = auth.currentUser;

  // Extrae el nombre de usuario del email (antes del "@")
  const getUserName = () => {
    if (user && user.email) {
      const name = user.email.split('@')[0]; // Obtén la parte antes del '@'
      return name.charAt(0).toUpperCase() + name.slice(1); // Capitaliza la primera letra
    }
    return 'Usuario'; // Si no hay email, muestra 'Usuario' por defecto
  };

  // Función para cerrar sesión
  const handleLogout = async () => {
    try {
      await signOut(auth); // Cerrar sesión
      console.log('Sesión cerrada');
      // Redirigir al usuario a la página de inicio de sesión o hacer alguna otra acción
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <div className="home-container">
      <h1>Hola, {getUserName()}!</h1>
      <p>Bienvenido a tu panel de usuario.</p>

      {/* Botón de cerrar sesión */}
      <button onClick={handleLogout} className="logout-button">
        Cerrar Sesión
      </button>
    </div>
  );
}

export default Home;
