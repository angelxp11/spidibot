import React, { useEffect, useState } from 'react';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../../firebase'; // Asegúrate de que la ruta a firebase.js sea correcta
import './Pruebas.css';

const Pruebas = ({ onClose }) => {
  const [clientIds, setClientIds] = useState([]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose(); // Cierra el modal
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Limpiar el listener cuando el componente se desmonta
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Función para obtener los IDs de clientes
  const fetchClientIds = async () => {
    const clientCollection = collection(db, 'clientes');
    const clientSnapshot = await getDocs(clientCollection);
    const ids = clientSnapshot.docs.map(doc => doc.data().ID);
    ids.sort((a, b) => a.localeCompare(b)); // Ordenar IDs en orden ascendente
    setClientIds(ids);
  };

  // useEffect para cargar los IDs al montar el componente
  useEffect(() => {
    fetchClientIds();
  }, []);

  // Función para crear una nueva notificación
  const createNotification = async () => {
    const notificationData = {
      title: "Nuevo Servicio Solicitado",
      body: "Un cliente quiere un servicio.",
      timestamp: new Date(), // Guarda la fecha y hora actual
    };

    try {
      // Agregar el documento a la colección de notificaciones
      await addDoc(collection(db, 'notificaciones'), notificationData);
      console.log('Notificación creada con éxito');
    } catch (error) {
      console.error('Error al crear notificación:', error);
    }
  };

  return (
    <div className="overlay">
      <div className="pruebas-container">
        <h2>Pruebas Component</h2>
        <p>Este es el componente de pruebas.</p>
        <button onClick={onClose} className="boton-cerrar">x</button>
        <div className="client-ids">
          <h3>Lista de IDs de Clientes:</h3>
          <ul className="client-ids-list">
            {clientIds.map((id, index) => (
              <li key={index}>{id}</li>
            ))}
          </ul>
        </div>
        <button onClick={createNotification} className="create-notification-button">
          Crear Notificación
        </button>
      </div>
    </div>
  );
}

export default Pruebas;
