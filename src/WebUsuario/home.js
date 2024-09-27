// src/WebAdmin/Home.js
import React, { useEffect, useState } from 'react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { getDocs, collection, query, where } from 'firebase/firestore';
import '../WebAdmin/home.css';
import ContainerPlatform from './ContainerPlatform';
import { db } from '../firebase';

function Home() {
  const user = auth.currentUser;
  const navigate = useNavigate();
  const [servicios, setServicios] = useState([]); // Estado para almacenar servicios

  useEffect(() => {
    if (!user) {
      navigate('/spidibot');
    } else {
      fetchUserGroups();
    }
  }, [user, navigate]);

  const fetchUserGroups = async () => {
    try {
      const email = user.email;
      const q = query(collection(db, 'clientes'), where('email', '==', email));
      const querySnapshot = await getDocs(q);
      const serviciosData = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.servicio) {
          serviciosData.push(...Object.values(data.servicio)); // Extrae todos los servicios
        }
      });

      setServicios(serviciosData);
    } catch (error) {
      console.error('Error al obtener los servicios:', error);
    }
  };

  const getUserName = () => {
    if (user && user.email) {
      const name = user.email.split('@')[0];
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
    return 'Usuario';
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/spidibot');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <div className="home-container">
      <h1 className="greeting">Hola, {getUserName()}!</h1>
      <p className="welcome-message">Bienvenido a tu panel de usuario.</p>

      <div className="button-group">
        <button onClick={handleLogout} className="logout-button">
          Cerrar Sesión
        </button>
      </div>

      <div className="platforms-container">
        {servicios.map((servicio, index) => (
          <ContainerPlatform key={index} title={servicio} servicio={servicio} /> // Muestra el nombre del servicio
        ))}
      </div>
    </div>
  );
}

export default Home;