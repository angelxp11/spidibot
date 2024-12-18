// src/Home.js
import React, { useEffect, useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import BuscarCliente from './BuscarCliente/Buscarcliente';
import Estados from './VerEstados/estados';
import ActualizarBd from './ActualizarBd/ActualizarBd';
import BuscarCupo from './Grupos/BuscarCupo';
import RegistrarCliente from './Registro/RegistroCliente';
import Pruebas from './Pruebas/Pruebas';
import AddSeeEstatus from './Grupos/AddSeeEstatus';
import PasswordReset from './PasswordReset/PasswordReset';
import Notificaciones from './Notificaciones/Notificaciones';
import CuentasDisponibles from './CuentasDisponibles.js';  // Importamos el nuevo componente
import { getFirestore, collection, onSnapshot } from 'firebase/firestore';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import './home.css';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';

function Home() {
  const navigate = useNavigate();
  const user = auth.currentUser;
  const [showBuscarCliente, setShowBuscarCliente] = useState(false);
  const [showEstados, setShowEstados] = useState(false);
  const [showActualizarBd, setShowActualizarBd] = useState(false);
  const [showBuscarCupo, setShowBuscarCupo] = useState(false);
  const [showRegistrarCliente, setShowRegistrarCliente] = useState(false);
  const [showPruebas, setShowPruebas] = useState(false);
  const [showAddSeeEstatus, setShowAddSeeEstatus] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [showNotificaciones, setShowNotificaciones] = useState(false);
  const [showCuentasDisponibles, setShowCuentasDisponibles] = useState(true); // Estado para mostrar "Cuentas Disponibles"
  const [notificacionCount, setNotificacionCount] = useState(0);
  const [notificaciones, setNotificaciones] = useState([]); // Estado para almacenar las notificaciones

  const db = getFirestore();
  const messaging = getMessaging(); // Inicializa FCM

  // Solicitar permisos de notificación
  const requestNotificationPermission = async () => {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('Permiso para notificaciones concedido.');
      // Obtiene el token para enviar notificaciones
      getToken(messaging, { vapidKey: 'YOUR_PUBLIC_VAPID_KEY' }) // Cambia a tu VAPID Key
        .then((currentToken) => {
          if (currentToken) {
            console.log('Token FCM:', currentToken);
            // Aquí puedes enviar el token a tu servidor si es necesario
          } else {
            console.warn('No se pudo obtener el token de FCM. Asegúrate de haber habilitado las notificaciones.');
          }
        })
        .catch((error) => {
          console.error('Error al obtener el token de FCM:', error);
        });
    } else {
      console.error('Permiso para notificaciones denegado.');
    }
  };

  useEffect(() => {
    requestNotificationPermission(); // Solicitar permiso al cargar el componente

    const unsubscribe = onSnapshot(collection(db, 'notificaciones'), (snapshot) => {
      const notificacionesData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setNotificaciones(notificacionesData);
      setNotificacionCount(notificacionesData.filter(notificacion => notificacion.id !== "hola").length); // Contar solo las notificaciones que no tienen id "hola"
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          // Mostrar notificación en el navegador
          const notificationData = change.doc.data();
          showBrowserNotification(notificationData.title, notificationData.body);
        }
      });
    }, (error) => {
      console.error('Error al obtener notificaciones:', error);
    });

    return () => unsubscribe();
  }, [db, messaging]);

  // Función para mostrar notificaciones del navegador
  const showBrowserNotification = (title, body) => {
    new Notification(title, {
      body: body,
      icon: '/icon.png', // Ruta del icono en la carpeta public
    });
  };

  // Manejar mensajes en primer plano
  useEffect(() => {
    const unsubscribeFromMessages = onMessage(messaging, (payload) => {
      console.log('Mensaje recibido en primer plano: ', payload);
      showBrowserNotification(payload.notification.title, payload.notification.body);
    });

    return () => unsubscribeFromMessages();
  }, [messaging]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/spidibot');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  useEffect(() => {
    navigate('/spidibot');
  }, [navigate]);

  const handleOpenNotificaciones = () => {
    setShowNotificaciones(true);
  };

  const handleCloseNotificaciones = () => {
    setShowNotificaciones(false);
  };

  return (
    <div className="home-container">
      <h1>Bienvenido {user ? user.email : 'Admin'} a la página principal</h1>
      <div className="button-groups">
        <button onClick={() => setShowRegistrarCliente(true)} className="home-button">Registrar Cliente</button>
        <button onClick={() => setShowBuscarCliente(true)} className="home-button">Buscar Cliente</button>
        <button onClick={() => setShowEstados(true)} className="home-button">Estado</button>
        <button onClick={() => setShowBuscarCupo(true)} className="home-button">Cupos</button>
        <button onClick={() => setShowActualizarBd(true)} className="home-button">Actualizar</button>
        <button onClick={() => setShowPruebas(true)} className="home-button">Pruebas</button>
        <button onClick={() => setShowAddSeeEstatus(true)} className="home-button">GruposEstados</button>
        <button onClick={() => setShowPasswordReset(true)} className="home-button">Email Clientes</button>
        
        {/* Nuevo botón para mostrar "Cuentas Disponibles" */}
        <button onClick={() => setShowCuentasDisponibles(true)} className="home-button">Cuentas Disponibles</button>

        {/* Botón de Notificaciones con contador */}
        <div className="notification-button" onClick={handleOpenNotificaciones}>
          Notificaciones
          {notificacionCount > 0 && (
            <span className="notification-count">{notificacionCount}</span>
          )}
        </div>
      </div>
      <button onClick={handleSignOut} className="logout-button">Cerrar Sesión</button>

      {showBuscarCliente && <BuscarCliente onClose={() => setShowBuscarCliente(false)} />}
      {showEstados && <Estados onClose={() => setShowEstados(false)} />}
      {showActualizarBd && <ActualizarBd onClose={() => setShowActualizarBd(false)} />}
      {showBuscarCupo && <BuscarCupo onClose={() => setShowBuscarCupo(false)} />}
      {showRegistrarCliente && <RegistrarCliente onClose={() => setShowRegistrarCliente(false)} />}
      {showPruebas && <Pruebas onClose={() => setShowPruebas(false)} />}
      {showAddSeeEstatus && <AddSeeEstatus onClose={() => setShowAddSeeEstatus(false)} />}
      {showPasswordReset && <PasswordReset onClose={() => setShowPasswordReset(false)} />}
      {showNotificaciones && <Notificaciones onClose={handleCloseNotificaciones} />}
      
      {/* Mostrar el componente CuentasDisponibles si está activado */}
      {showCuentasDisponibles && <CuentasDisponibles onClose={() => setShowCuentasDisponibles(false)} />}

      <ToastContainer />
    </div>
  );
}

export default Home;
