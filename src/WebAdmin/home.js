import React, { useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import BuscarCliente from './BuscarCliente/Buscarcliente';
import Estados from './VerEstados/estados';
import ActualizarBd from './ActualizarBd/ActualizarBd';
import BuscarCupo from './Grupos/BuscarCupo';
import RegistrarCliente from './Registro/RegistroCliente';
import Pruebas from './Pruebas/Pruebas'; // Import the Pruebas component
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
  const [showPruebas, setShowPruebas] = useState(false); // State for showing Pruebas component

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/'); // Redirect to login after signing out
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const handleButtonClick = (route) => {
    navigate(route);
  };

  const handleDownloadNoticias = async () => {
    setShowActualizarBd(true);
  };

  const handleOpenBuscarCliente = () => {
    setShowBuscarCliente(true);
  };

  const handleCloseBuscarCliente = () => {
    setShowBuscarCliente(false);
  };

  const handleOpenEstados = () => {
    setShowEstados(true);
  };

  const handleCloseEstados = () => {
    setShowEstados(false);
  };

  const handleCloseActualizarBd = () => {
    setShowActualizarBd(false);
  };

  const handleOpenBuscarCupo = () => {
    setShowBuscarCupo(true);
  };

  const handleCloseBuscarCupo = () => {
    setShowBuscarCupo(false);
  };

  const handleOpenRegistrarCliente = () => {
    setShowRegistrarCliente(true);
  };

  const handleCloseRegistrarCliente = () => {
    setShowRegistrarCliente(false);
  };

  const handleOpenPruebas = () => {
    setShowPruebas(true);
  };

  const handleClosePruebas = () => {
    setShowPruebas(false);
  };

  return (
    <div className="home-container">
      <h1>Bienvenido {user ? user.email : 'Admin'} a la página principal</h1>
      <div className="button-group">
        <button onClick={handleOpenRegistrarCliente} className="home-button">Registrar Cliente</button>
        <button onClick={handleOpenBuscarCliente} className="home-button">Buscar Cliente</button>
        <button onClick={handleOpenEstados} className="home-button">Estado</button>
        <button onClick={handleOpenBuscarCupo} className="home-button">Cupos</button>
        <button onClick={handleDownloadNoticias} className="home-button">Actualizar</button>
        <button onClick={handleOpenPruebas} className="home-button">Pruebas</button> {/* New Test Button */}
      </div>
      <button onClick={handleSignOut} className="logout-button">Cerrar Sesión</button>

      {showBuscarCliente && <BuscarCliente onClose={handleCloseBuscarCliente} />}
      {showEstados && <Estados onClose={handleCloseEstados} />}
      {showActualizarBd && <ActualizarBd onClose={handleCloseActualizarBd} />}
      {showBuscarCupo && <BuscarCupo onClose={handleCloseBuscarCupo} />}
      {showRegistrarCliente && <RegistrarCliente onClose={handleCloseRegistrarCliente} />}
      {showPruebas && <Pruebas onClose={handleClosePruebas} />} {/* Render Pruebas component */}

      <ToastContainer />
    </div>
  );
}

export default Home;
