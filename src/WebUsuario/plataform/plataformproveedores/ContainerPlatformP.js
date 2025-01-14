import React, { useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import '../../containerPlatform.css';
import DatosSpotify from './DatosSpotify.js'; // Importa el componente

const ContainerPlatformP = ({ title, grupo, estado, fechaFinal, nombreCliente, onMoreInfo }) => {
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

  // Determina el texto del botón dependiendo del estado del servicio
  let buttonText = '';
  if (estado === '✅' || estado === '⚠️') {
    buttonText = 'Ver enlace';
  } else if (estado === '❌') {
    buttonText = 'Renovación';
  } else if (estado === '😶‍🌫️') {
    buttonText = ''; // Se manejarán dos botones para este estado
  }

  return (
    <div className="container-platform">
      {/* Modal de DatosSpotify */}
      {showDatosSpotify && <DatosSpotify onClose={handleCloseModal} grupo={grupo} nombreCliente={nombreCliente} title={title} />}


      {/* Información del servicio */}
      <h2 className="servicio-title">{displayTitle}</h2>
      <p className="nombre-cliente-text"><strong>Nombre del Cliente:</strong> {nombreCliente}</p>
      <p className="grupo-text"><strong>Grupo:</strong> {grupo}</p>
      <p className="estado-text"><strong>Estado:</strong> {estado}</p>
      <p className="fecha-final-text"><strong>Fecha Final:</strong> {fechaFinal}</p>

      {/* Condicionalmente renderiza los botones según el estado */}
      {title === 'SPOTIFY' ? (
        // Lógica para cuando el título es 'SPOTIFY'
        <>
          {estado === '❌' ? (
            <button className="home-button" onClick={onMoreInfo}>Renovar</button>
          ) : estado === '✅' || estado === '⚠️' ? (
            <button className="home-button" onClick={handleOpenModal}>Ver enlace</button>
          ) : estado === '😶‍🌫️' ? (
            <>
              <button className="home-button" onClick={onMoreInfo}>Renovar</button>
              <button className="home-button" onClick={onMoreInfo}>Borrar</button>
            </>
          ) : null}
        </>
      ) : (
        // Lógica para cuando el título es diferente de 'SPOTIFY'
        <>
          {estado === '❌' ? (
            <button className="home-button" onClick={onMoreInfo}>Renovación</button>
          ) : estado === '✅' || estado === '⚠️' ? (
            <button className="home-button" onClick={onMoreInfo}>Más información</button>
          ) : estado === '😶‍🌫️' ? (
            <>
              <button className="home-button" onClick={onMoreInfo}>Renovar</button>
              <button className="home-button" onClick={onMoreInfo}>Borrar</button>
            </>
          ) : null}
        </>
      )}

      {/* Si el título es YOUTUBE o SPOTIFY, mostrar mensaje de contacto */}
    
    </div>
  );
};

export default ContainerPlatformP;
