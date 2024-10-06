import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase'; // Asegúrate de que la ruta a firebase.js sea correcta
import './Pruebas.css';

const deletedocuments = ({ onClose }) => {
  const [clientIds, setClientIds] = useState([]);

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

  // Función para eliminar clientes
  const deleteClients = async () => {
    const clientCollection = collection(db, 'clientes');
    const clientQuery = query(clientCollection, where('ID', '>', '00257')); // Consulta para IDs mayores que '00257'
    const clientSnapshot = await getDocs(clientQuery);

    const deletePromises = clientSnapshot.docs.map(async (doc) => {
      await deleteDoc(doc.ref); // Eliminar documento
    });

    await Promise.all(deletePromises); // Esperar a que todas las promesas se resuelvan

    // Volver a cargar los IDs después de la eliminación
    fetchClientIds();
  };

  return (
    <div className="overlay">
      <div className="pruebas-container">
        <h2>Pruebas Component</h2>
        <p>Este es el componente de pruebas.</p>
        <button onClick={onClose} className="close-button">Cerrar</button>
        <div className="client-ids">
          <h3>Lista de IDs de Clientes:</h3>
          <ul className="client-ids-list">
            {clientIds.map((id, index) => (
              <li key={index}>{id}</li>
            ))}
          </ul>
        </div>
        <button onClick={deleteClients} className="delete-button">Eliminar Clientes con ID  00257</button>
      </div>
    </div>
  );
}

export default deletedocuments;
