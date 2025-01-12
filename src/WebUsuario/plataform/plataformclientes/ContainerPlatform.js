import React, { useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import '../../containerPlatform.css';
import DatosSpotify from './DatosSpotify.js'; // Importa el componente

const ContainerPlatform = ({ title, grupo, estado, fechaFinal, onMoreInfo, onDelete }) => {
  const [showDatosSpotify, setShowDatosSpotify] = useState(false);

  // Normalizar el título para mostrar "NETFLIX" si corresponde
  const displayTitle = ['NETFLIX', 'NETFLIXME', 'NETFLIXTV'].includes(title) ? 'NETFLIX' : title;

  // Funciones para manejar la apertura y cierre del modal
  const handleOpenModal = () => setShowDatosSpotify(true);
  const handleCloseModal = () => setShowDatosSpotify(false);

  // Mostrar el toast
  const handleShowToast = () => {
    toast.info('Comunícate con un asesor', {
      position: 'bottom-right',
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      theme: 'colored',
    });
  };

  return (
    <div className="container-platform">
      {/* Componente de Toastify */}
      <ToastContainer />

      {/* Modal de DatosSpotify */}
      {showDatosSpotify && <DatosSpotify title={title} grupo={grupo} onClose={handleCloseModal} />}

      {/* Información del servicio */}
      <h2 className="servicio-title">{displayTitle}</h2>
      <p className="grupo-text">
        <strong>Grupo:</strong> {grupo}
      </p>
      <p className="estado-text">
        <strong>Estado:</strong> {estado}
      </p>
      <p className="fecha-final-text">
        <strong>Fecha Final:</strong> {fechaFinal}
      </p>

      {/* Botones para las acciones */}
      {estado === '❌' ? (
        <button className="home-button" onClick={onMoreInfo}>
          Renovar Servicio
        </button>
      ) : estado === '😶‍🌫️' ? (
        <div className="button-group">
          <button className="home-button" onClick={onMoreInfo}>
            Renovar Servicio
          </button>
          <button className="home-button" onClick={onDelete}>
            Eliminar Servicio
          </button>
        </div>
      ) : title === 'SPOTIFY' ? (
        <button className="home-button" onClick={handleOpenModal}>
          Ver Enlace
        </button>
      ) : (
        <button className="home-button" onClick={handleShowToast}>
          Más Información
        </button>
      )}
    </div>
  );
};

export default ContainerPlatform;
