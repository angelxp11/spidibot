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
import FusionarCuentas from './FusionarCuentas/fusionarcuentas'; // Importa el nuevo componente
import CambiarFechaPago from './CambiarFechaPago/cambiarfechapago'; // Importa el nuevo componente
import Precios from './Precios/Precios'; // Importa el nuevo componente Precios
import { getFirestore, collection, onSnapshot } from 'firebase/firestore';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import './home.css';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import { FaBell } from 'react-icons/fa'; // Import the bell icon from react-icons
import { FaServicestack, FaSignOutAlt, FaUserPlus, FaSearch, FaUsers, FaLayerGroup, FaEnvelope, FaDatabase, FaExclamationTriangle, FaMoneyBillWave, FaWallet, FaSyncAlt, FaCalendarAlt, FaTag, FaBoxes } from 'react-icons/fa'; // Añadido FaBoxes
import logo from '../recursos/spidilogo.png'; // Import the logo image
import Inventario from './Inventario/Inventario'; // Nuevo componente Inventario

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
  const [showFusionarCuentas, setShowFusionarCuentas] = useState(false); // Estado para mostrar el modal de fusionar cuentas
  const [showCambiarFechaPago, setShowCambiarFechaPago] = useState(false); // Estado para mostrar CambiarFechaPago
  const [showPrecios, setShowPrecios] = useState(false); // Estado para mostrar Precios
  const [showInventario, setShowInventario] = useState(false); // Nuevo estado para Inventario
  const [notificacionCount, setNotificacionCount] = useState(0);
  const [notificaciones, setNotificaciones] = useState([]); // Estado para almacenar las notificaciones
  const [isUpdating, setIsUpdating] = useState(false);
  const [showServices, setShowServices] = useState(false);
  const [windowTitle, setWindowTitle] = useState("Spidibot V1");

  const db = getFirestore();
  const messaging = getMessaging(); // Inicializa FCM

  // Efecto para cambiar el título de la ventana
  useEffect(() => {
    document.title = windowTitle;
  }, [windowTitle]);

  // Funciones para abrir y cerrar modales con cambio de título
  const handleOpenBuscarCliente = () => {
    setShowBuscarCliente(true);
    setWindowTitle("Buscar Cliente - Spidibot V1");
  };

  const handleCloseBuscarCliente = () => {
    setShowBuscarCliente(false);
    setWindowTitle("Spidibot V1");
  };

  const handleOpenEstados = () => {
    setShowEstados(true);
    setWindowTitle("Ver Estados - Spidibot V1");
  };

  const handleCloseEstados = () => {
    setShowEstados(false);
    setWindowTitle("Spidibot V1");
  };

  const handleOpenActualizarBd = () => {
    setShowActualizarBd(true);
    setWindowTitle("Actualizar Base de Datos - Spidibot V1");
  };

  const handleCloseActualizarBd = () => {
    setShowActualizarBd(false);
    setWindowTitle("Spidibot V1");
  };

  const handleOpenBuscarCupo = () => {
    setShowBuscarCupo(true);
    setWindowTitle("Buscar Cupo - Spidibot V1");
  };

  const handleCloseBuscarCupo = () => {
    setShowBuscarCupo(false);
    setWindowTitle("Spidibot V1");
  };

  const handleOpenRegistrarCliente = () => {
    setShowRegistrarCliente(true);
    setWindowTitle("Registrar Cliente - Spidibot V1");
  };

  const handleCloseRegistrarCliente = () => {
    setShowRegistrarCliente(false);
    setWindowTitle("Spidibot V1");
  };

  const handleOpenPruebas = () => {
    setShowPruebas(true);
    setWindowTitle("Pruebas - Spidibot V1");
  };

  const handleClosePruebas = () => {
    setShowPruebas(false);
    setWindowTitle("Spidibot V1");
  };

  const handleOpenAddSeeEstatus = () => {
    setShowAddSeeEstatus(true);
    setWindowTitle("Grupos y Estados - Spidibot V1");
  };

  const handleCloseAddSeeEstatus = () => {
    setShowAddSeeEstatus(false);
    setWindowTitle("Spidibot V1");
  };

  const handleOpenPasswordReset = () => {
    setShowPasswordReset(true);
    setWindowTitle("Restablecer Contraseña - Spidibot V1");
  };

  const handleClosePasswordReset = () => {
    setShowPasswordReset(false);
    setWindowTitle("Spidibot V1");
  };

  const handleOpenNotificaciones = () => {
    setShowNotificaciones(true);
    setWindowTitle("Notificaciones - Spidibot V1");
  };

  const handleCloseNotificaciones = () => {
    setShowNotificaciones(false);
    setWindowTitle("Spidibot V1");
  };

  const handleOpenCuentasDisponibles = () => {
    setShowCuentasDisponibles(true);
    setWindowTitle("Cuentas Disponibles - Spidibot V1");
  };

  const handleCloseCuentasDisponibles = () => {
    setShowCuentasDisponibles(false);
    setWindowTitle("Spidibot V1");
  };

  const handleOpenBolsillos = () => {
    setShowBolsillos(true);
    setWindowTitle("Bolsillos - Spidibot V1");
  };

  const handleCloseBolsillos = () => {
    setShowBolsillos(false);
    setWindowTitle("Spidibot V1");
  };

  const handleOpenFusionarCuentas = () => {
    setShowFusionarCuentas(true);
    setWindowTitle("Fusionar Cuentas - Spidibot V1");
  };

  const handleCloseFusionarCuentas = () => {
    setShowFusionarCuentas(false);
    setWindowTitle("Spidibot V1");
  };

  const handleOpenCambiarFechaPago = () => {
    setShowCambiarFechaPago(true);
    setWindowTitle("Cambiar Fecha de Pago - Spidibot V1");
  };

  const handleCloseCambiarFechaPago = () => {
    setShowCambiarFechaPago(false);
    setWindowTitle("Spidibot V1");
  };

  const handleOpenPrecios = () => {
    setShowPrecios(true);
    setWindowTitle("Precios - Spidibot V1");
  };

  const handleClosePrecios = () => {
    setShowPrecios(false);
    setWindowTitle("Spidibot V1");
  };

  const handleOpenInventario = () => {
    setShowInventario(true);
    setWindowTitle("Inventario - Spidibot V1");
  };

  const handleCloseInventario = () => {
    setShowInventario(false);
    setWindowTitle("Spidibot V1");
  };

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
      navigate('');
    } catch (error) {
    }
  };

  useEffect(() => {
    navigate('');
  }, [navigate]);

  const handleActualizarClick = () => {
    setIsUpdating(true);
    handleOpenActualizarBd();
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
        <h1 className="welcome-message">Welcome to Spidi Dashboard</h1>
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
              <div className="icon-item" onClick={handleOpenRegistrarCliente}>
                <FaUserPlus className="grid-icon" />
                <span>Registrar Cliente</span>
              </div>
              <div className="icon-item" onClick={handleOpenBuscarCliente}>
                <FaSearch className="grid-icon" />
                <span>Buscar Cliente</span>
              </div>
              <div className="icon-item" onClick={handleOpenEstados}>
                <FaExclamationTriangle className="grid-icon" />
                <span>Estado</span>
              </div>
              <div className="icon-item-cupos" onClick={handleOpenBuscarCupo}>
                <FaUsers className="grid-icon-cupos" />
                <span>Cupos</span>
              </div>
              <div className="icon-item" onClick={handleOpenAddSeeEstatus}>
                <FaLayerGroup className="grid-icon" />
                <span>GruposEstados</span>
              </div>
              <div className="icon-item" onClick={handleOpenPasswordReset}>
                <FaEnvelope className="grid-icon" />
                <span>Email Clientes</span>
              </div>
              <div className="icon-item" onClick={handleOpenCuentasDisponibles}>
                <FaDatabase className="grid-icon" />
                <span>Cuentas Disponibles</span>
              </div>
              <div className="icon-item" onClick={handleOpenBolsillos}>
                <FaWallet className="grid-icon" /> {/* Change icon to FaWallet */}
                <span>Bolsillos</span>
              </div>
              <div className="icon-item" onClick={handleOpenFusionarCuentas}>
                <FaSyncAlt className="grid-icon" /> {/* Cambiado a FaSyncAlt */}
                <span>Fusionar Cuentas</span>
              </div>
              <div className="icon-item" onClick={handleOpenCambiarFechaPago}>
                <FaCalendarAlt className="grid-icon" />
                <span>Cambiar Fecha Pago</span>
              </div>
              <div className="icon-item" onClick={handleOpenPrecios}>
                <FaTag className="grid-icon" />
                <span>Precios</span>
              </div>

              {/* Inventario como icono (FaBoxes) justo después de Precios */}
              <div className="icon-item" onClick={handleOpenInventario}>
                <FaBoxes className="grid-icon" />
                <span>Inventario</span>
              </div>
            </div>
          )}
          {showFinance && (
            <div className="icon-grid">
              <Finance onClose={() => setShowFinance(false)} /> {/* Add the Finance component */}
            </div>
          )}
          {showBuscarCliente && <BuscarCliente onClose={handleCloseBuscarCliente} />}
          {showEstados && <Estados onClose={handleCloseEstados} />}
          {showActualizarBd && <ActualizarBd onClose={handleCloseActualizarBd} />}
          {showBuscarCupo && <BuscarCupo onClose={handleCloseBuscarCupo} />}
          {showRegistrarCliente && <RegistrarCliente onClose={handleCloseRegistrarCliente} />}
          {showPruebas && <Pruebas onClose={handleClosePruebas} />}
          {showAddSeeEstatus && <AddSeeEstatus onClose={handleCloseAddSeeEstatus} />}
          {showPasswordReset && <PasswordReset onClose={handleClosePasswordReset} />}
          {showNotificaciones && <Notificaciones onClose={handleCloseNotificaciones} />}
          {showCuentasDisponibles && <CuentasDisponibles onClose={handleCloseCuentasDisponibles} />}
          {showBolsillos && <Bolsillos onClose={handleCloseBolsillos} />}
          {showFusionarCuentas && (
            <FusionarCuentas onClose={handleCloseFusionarCuentas} />
          )}
          {showPrecios && <Precios onClose={handleClosePrecios} />}
          {showInventario && <Inventario onClose={handleCloseInventario} />}
          {showCambiarFechaPago && (
            <CambiarFechaPago onClose={handleCloseCambiarFechaPago} />
          )}
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