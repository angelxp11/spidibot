import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import { getFirestore, doc, getDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import '../../containerPlatform.css';
import DatosSpotify from './DatosSpotify.js'; // Importa el componente
import Renovar from '../../renovar/Renovar'; // Importa el componente Renovar
import MensajesSiNo from '../../../recursos/MensajesSiNo.js'; // Importa MensajesSiNo
import { app } from '../../../firebase'; // Importa la configuración de Firebase

const firestore = getFirestore(app);

// Export variables for MensajesSiNo
export const deleteHeader = async (clientId) => {
  if (!clientId) {
    return 'Cliente no encontrado';
  }
  const clientDoc = await getDoc(doc(firestore, 'clientes', clientId));
  const clientData = clientDoc.exists() ? clientDoc.data() : null;
  return clientData ? `¿Estás seguro que quieres borrar el registro de ${clientData.nombre.charAt(0).toUpperCase() + clientData.nombre.slice(1).toLowerCase()}?` : 'Cliente no encontrado';
};
export const deleteMessage = 'Al borrar este registro de cliente no habrá marcha atrás y simplemente será eliminado.';
export const deleteButtons = {
  no: 'No deseo eliminarlo',
  yes: 'Deseo eliminarlo'
};

const searchClientByID = async (clientID) => {
  const querySnapshot = await getDocs(collection(firestore, 'clientes'));
  querySnapshot.forEach((doc) => {
    if (doc.data().ID === clientID) {
      // No mostrar nada en consola
    }
  });
};

const ContainerPlatformP = ({ title, grupo, estado, fechaFinal, nombreCliente, onMoreInfo, providerId, providerName }) => {
  const [showDatosSpotify, setShowDatosSpotify] = useState(false);
  const [showRenovar, setShowRenovar] = useState(false); // Estado para mostrar Renovar
  const [showConfirmDelete, setShowConfirmDelete] = useState(false); // Estado para mostrar confirmación de eliminación
  const [deleteHeaderText, setDeleteHeaderText] = useState(''); // Estado para almacenar el encabezado de eliminación

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

  const handleDelete = async () => {
    const headerText = await deleteHeader(providerId);
    setDeleteHeaderText(headerText);
    setShowConfirmDelete(true);
    const clientDoc = await getDoc(doc(firestore, 'clientes', providerId));
    const clientData = clientDoc.exists() ? clientDoc.data() : null;
    if (clientData) {
      await searchClientByID(clientData.ID);
    }
  };

  const confirmDelete = async () => {
    setShowConfirmDelete(false);
    await deleteDoc(doc(firestore, 'clientes', providerId));
    toast.success('Cliente eliminado con éxito', { autoClose: 2000 });
  };

  const cancelDelete = () => {
    setShowConfirmDelete(false);
  };

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
            <button className="container-platform-delete-button" onClick={handleDelete}>
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
            <button className="container-platform-delete-button" onClick={handleDelete}>
              Borrar
            </button>
          </>
        );
      }
    }
  };

  return (
    <div className="container-platform">
      {/* Modal de DatosSpotify */}
      {showDatosSpotify && <DatosSpotify onClose={handleCloseModal} grupo={grupo} title={title} />}
      {/* Modal de Renovar */}
      {showRenovar && <Renovar onClose={handleCloseRenovar} providerId={providerId} providerName={providerName} serviceName={displayTitle} />}
      {/* Confirmación de eliminación */}
      {showConfirmDelete && (
        <MensajesSiNo 
          onClose={cancelDelete} 
          onConfirm={confirmDelete} 
          header={deleteHeaderText}
          message={deleteMessage}
          buttons={deleteButtons}
        />
      )}

      {/* Información del servicio */}
      <h2 className="container-platforms" style={{ color: "#121212" }}>{displayTitle}</h2>
      <p className="nombre-cliente-text"><strong>Cliente: </strong> {nombreCliente}</p>
      <p className="container-platform-grupo-text"><strong>Grupo:</strong> {grupo}</p>
      <p className="container-platform-estado-text"><strong>Estado:</strong> {estado}</p>
      <p className="container-platform-fecha-final-text"><strong>Fecha Final:</strong> {fechaFinal}</p>

      {/* Mostrar el botón adecuado */}
      {renderButton()}
      <ToastContainer /> {/* Ensure ToastContainer is included here */}
    </div>
  );
};

export default ContainerPlatformP;
