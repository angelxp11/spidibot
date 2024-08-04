import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase'; // Ensure the path to firebase.js is correct
import './Pruebas.css';

const Pruebas = ({ onClose }) => {
  const [clientIds, setClientIds] = useState([]);

  useEffect(() => {
    const fetchClientIds = async () => {
      const clientCollection = collection(db, 'clientes');
      const clientSnapshot = await getDocs(clientCollection);
      const ids = clientSnapshot.docs.map(doc => doc.data().ID);
      ids.sort((a, b) => a.localeCompare(b)); // Sort IDs in ascending order
      setClientIds(ids);
    };

    fetchClientIds();
  }, []);

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
      </div>
    </div>
  );
}

export default Pruebas;