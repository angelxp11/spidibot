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
import Bolsillos from './Bolsillos/Bolsillos.js';  // Importamos el nuevo componente
import Finance from './Finance/finance'; // Import the new Finance component
import { getFirestore, collection, onSnapshot } from 'firebase/firestore';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import './home.css';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import { FaBell } from 'react-icons/fa'; // Import the bell icon from react-icons
import { FaServicestack, FaSignOutAlt, FaUserPlus, FaSearch, FaUsers, FaLayerGroup, FaEnvelope, FaDatabase, FaExclamationTriangle, FaMoneyBillWave, FaWallet } from 'react-icons/fa'; // Import icons
import logo from '../recursos/spidilogo.png'; // Import the logo image

function Home() {
  const navigate = useNavigate();
  const [showBuscarCliente, setShowBuscarCliente] = useState(false);
  const [showEstados, setShowEstados] = useState(false);
  const [showActualizarBd, setShowActualizarBd] = useState(false);
  const [showBuscarCupo, setShowBuscarCupo] = useState(false);
  const [showRegistrarCliente, setShowRegistrarCliente] = useState(false);
  const [showPruebas, setShowPruebas] = useState(false);
  const [showAddSeeEstatus, setShowAddSeeEstatus] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [showNotificaciones, setShowNotificaciones] = useState(false);
  const [showCuentasDisponibles, setShowCuentasDisponibles] = useState(false); // Estado para mostrar "Cuentas Disponibles"
  const [showBolsillos, setShowBolsillos] = useState(false); // Estado para mostrar "Bolsillos"
  const [showFinance, setShowFinance] = useState(false); // Estado para mostrar "Finance"
  const [notificacionCount, setNotificacionCount] = useState(0);
  const [notificaciones, setNotificaciones] = useState([]); // Estado para almacenar las notificaciones
  const [isUpdating, setIsUpdating] = useState(false);
  const [showServices, setShowServices] = useState(false);

  const db = getFirestore();
  const messaging = getMessaging(); // Inicializa FCM

  // Solicitar permisos de notificación
  const requestNotificationPermission = async () => {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      getToken(messaging, { vapidKey: 'YOUR_PUBLIC_VAPID_KEY' }) // Cambia a tu VAPID Key
        .then((currentToken) => {
          if (currentToken) {
          } else {
          }
        })
        .catch((error) => {
        });
    } else {
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
      showBrowserNotification(payload.notification.title, payload.notification.body);
    });

    return () => unsubscribeFromMessages();
  }, [messaging]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/spidibot');
    } catch (error) {
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

  const handleActualizarClick = () => {
    setIsUpdating(true);
    setShowActualizarBd(true);
    // Simulate an update process
    setTimeout(() => {
      setIsUpdating(false);
    }, 4000); // Ensure the animation completes a full rotation
  };

  const toggleServices = () => {
    setShowServices(!showServices);
    if (showFinance) setShowFinance(false); // Close Finance if it's open
  };

  const toggleFinance = () => {
    setShowFinance(!showFinance);
    if (showServices) setShowServices(false); // Close Services if it's open
  };

  return (
    <div className="dashboard-base">
      <div className="dashboard-top">
        <h1 className="welcome-message">Welcome to Spidi Dashboard cabron</h1>
        <div className="notification-bell-container">
          <FaBell className={`notification-bell ${notificacionCount > 0 ? 'ringing' : ''}`} onClick={handleOpenNotificaciones} />
          {notificacionCount > 0 && (
            <span className="notification-count">{notificacionCount}</span>
          )}
        </div>
        <div className={`loader-container ${isUpdating ? 'updating' : ''}`} onClick={handleActualizarClick}>
          <div className="loader"></div>
        </div>
      </div>
      <div className="dashboard-main">
        <div className="dashboard-left">
          <div className="icon-container">
            <FaServicestack
              className={`service-icon ${showServices ? 'active' : ''}`}
              onClick={toggleServices}
              title="Service" // Add title attribute for tooltip
            />
            <FaMoneyBillWave
              className={`finance-icon ${showFinance ? 'active' : ''}`}
              onClick={toggleFinance}
              title="Finance" // Add title attribute for tooltip
            />
            <FaSignOutAlt className="exit-icon" onClick={handleSignOut} />
          </div>
        </div>
        <div className="dashboard-right">
          {showServices && (
            <div className="icon-grid">
              <div className="icon-item" onClick={() => setShowRegistrarCliente(true)}>
                <FaUserPlus className="grid-icon" />
                <span>Registrar Cliente</span>
              </div>
              <div className="icon-item" onClick={() => setShowBuscarCliente(true)}>
                <FaSearch className="grid-icon" />
                <span>Buscar Cliente</span>
              </div>
              <div className="icon-item" onClick={() => setShowEstados(true)}>
                <FaExclamationTriangle className="grid-icon" />
                <span>Estado</span>
              </div>
              <div className="icon-item-cupos" onClick={() => setShowBuscarCupo(true)}>
                <FaUsers className="grid-icon-cupos" />
                <span>Cupos</span>
              </div>
              <div className="icon-item" onClick={() => setShowAddSeeEstatus(true)}>
                <FaLayerGroup className="grid-icon" />
                <span>GruposEstados</span>
              </div>
              <div className="icon-item" onClick={() => setShowPasswordReset(true)}>
                <FaEnvelope className="grid-icon" />
                <span>Email Clientes</span>
              </div>
              <div className="icon-item" onClick={() => setShowCuentasDisponibles(true)}>
                <FaDatabase className="grid-icon" />
                <span>Cuentas Disponibles</span>
              </div>
              <div className="icon-item" onClick={() => setShowBolsillos(true)}>
                <FaWallet className="grid-icon" /> {/* Change icon to FaWallet */}
                <span>Bolsillos</span>
              </div>
            </div>
          )}
          {showFinance && (
            <div className="icon-grid">
              <Finance onClose={() => setShowFinance(false)} /> {/* Add the Finance component */}
            </div>
          )}
          {showBuscarCliente && <BuscarCliente onClose={() => setShowBuscarCliente(false)} />}
          {showEstados && <Estados onClose={() => setShowEstados(false)} />}
          {showActualizarBd && <ActualizarBd onClose={() => setShowActualizarBd(false)} />}
          {showBuscarCupo && <BuscarCupo onClose={() => setShowBuscarCupo(false)} />}
          {showRegistrarCliente && <RegistrarCliente onClose={() => setShowRegistrarCliente(false)} />}
          {showPruebas && <Pruebas onClose={() => setShowPruebas(false)} />}
          {showAddSeeEstatus && <AddSeeEstatus onClose={() => setShowAddSeeEstatus(false)} />}
          {showPasswordReset && <PasswordReset onClose={() => setShowPasswordReset(false)} />}
          {showNotificaciones && <Notificaciones onClose={handleCloseNotificaciones} />}
          {showCuentasDisponibles && <CuentasDisponibles onClose={() => setShowCuentasDisponibles(false)} />}
          {showBolsillos && <Bolsillos onClose={() => setShowBolsillos(false)} />}
          {!showBuscarCliente && !showEstados && !showActualizarBd && !showBuscarCupo && !showRegistrarCliente && !showPruebas && !showAddSeeEstatus && !showPasswordReset && !showNotificaciones && !showCuentasDisponibles && !showServices && !showFinance && (
            <div className="logo-container">
              <img src={logo} alt="Logo" className="spinning-logo" />
            </div>
          )}
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}

export default Home;