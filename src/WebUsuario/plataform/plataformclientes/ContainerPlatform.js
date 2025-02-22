import React, { useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import '../../containerPlatform.css';
import DatosSpotify from './DatosSpotify.js'; // Importa el componente
import Renovar from '../../renovar/Renovar'; // Importa el componente Renovar

const ContainerPlatform = ({ title, grupo, estado, fechaFinal, onMoreInfo, clientId, clientName }) => {
  const [showDatosSpotify, setShowDatosSpotify] = useState(false);
  const [showRenovar, setShowRenovar] = useState(false); // Estado para mostrar Renovar

  // Normalizar el título para mostrar "NETFLIX" si corresponde
  const displayTitle = ['NETFLIX', 'NETFLIXME', 'NETFLIXTV'].includes(title) ? 'NETFLIX' : title;

  // Funciones para manejar la apertura y cierre del modal
  const handleOpenModal = () => setShowDatosSpotify(true);
  const handleCloseModal = () => setShowDatosSpotify(false);
  const handleOpenRenovar = () => setShowRenovar(true); // Abrir Renovar
  const handleCloseRenovar = () => setShowRenovar(false); // Cerrar Renovar

  // Función para mostrar el toast
  const handleShowToast = () => {
    handleOpenRenovar(); // Abrir Renovar en vez de mostrar toast
  };

  // Lógica para los botones según el servicio y su estado
  const renderButton = () => {
    if (title === 'SPOTIFY') { 
      if (estado === '❌') {
        return (
          <button className="container-platform-home-button" onClick={handleShowToast}>
            Renovar
          </button>
        );
      } else if (estado === '✅' || estado === '⚠️') {
        return (
          <button className="container-platform-home-button" onClick={handleOpenModal}>
            Ver enlace 
          </button>
        );
      } else if (estado === '😶‍🌫️') {
        return (
          <>
            <button className="container-platform-home-button" onClick={handleShowToast}>
              Renovar
            </button>
            <button className="container-platform-home-button" onClick={handleShowToast}>
              Borrar
            </button>
          </>
        );
      }
    } else {
      if (estado === '❌') {
        return (
          <button className="container-platform-home-button" onClick={handleShowToast}>
            Renovar
          </button>
        );
      } else if (estado === '✅' || estado === '⚠️') {
        return (
          <button className="container-platform-home-button" onClick={onMoreInfo}>
            Más información
          </button>
        );
      } else if (estado === '😶‍🌫️') {
        return (
          <>
            <button className="container-platform-home-button" onClick={handleShowToast}>
              Renovar
            </button>
            <button className="container-platform-home-button" onClick={handleShowToast}>
              Borrar
            </button>
          </>
        );
      }
    }
  };

  // Render principal
  return (
    <div className="container-platform">
      {/* Modal de DatosSpotify */}
      {showDatosSpotify && <DatosSpotify onClose={handleCloseModal} grupo={grupo} title={title} />}
      {/* Modal de Renovar */}
      {showRenovar && <Renovar onClose={handleCloseRenovar} clientId={clientId} clientName={clientName} serviceName={displayTitle} />}

      {/* Información del servicio */}
      <h2 className="container-platforms" style={{ color: "#121212" }}>{displayTitle}</h2>
      <p className="container-platform-grupo-text"><strong>Grupo:</strong> {grupo}</p>
      <p className="container-platform-estado-text"><strong>Estado:</strong> {estado}</p>
      <p className="container-platform-fecha-final-text"><strong>Fecha Final:</strong> {fechaFinal}</p>

      {/* Mostrar el botón adecuado */}
      {renderButton()}
    </div>
  );
};

export default ContainerPlatform;
