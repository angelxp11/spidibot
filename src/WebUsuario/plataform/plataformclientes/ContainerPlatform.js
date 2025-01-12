import React, { useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import '../../containerPlatform.css';
import DatosSpotify from './DatosSpotify.js'; // Importa el componente

const ContainerPlatform = ({ title, grupo, estado, fechaFinal, onMoreInfo }) => {
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

  // Render principal
  return (
    <div className="container-platform">
      {/* Modal de DatosSpotify */}
      {showDatosSpotify && <DatosSpotify onClose={handleCloseModal} />}

      {/* Información del servicio */}
      <h2 className="servicio-title">{displayTitle}</h2>
      <p className="grupo-text"><strong>Grupo:</strong> {grupo}</p>
      <p className="estado-text"><strong>Estado:</strong> {estado}</p>
      <p className="fecha-final-text"><strong>Fecha Final:</strong> {fechaFinal}</p>

      {/* Botones para las acciones */}
      {title === 'SPOTIFY' ? (
        // Botón para abrir el modal de SPOTIFY
        <button className="home-button" onClick={handleOpenModal}>
          Ver Enlace
        </button>
      ) : (
        // Botón para otros servicios
        <button className="home-button" onClick={onMoreInfo}>
          Más Información
        </button>
      )}
    </div>
  );
};

export default ContainerPlatform;