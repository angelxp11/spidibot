import { ToastContainer, toast } from 'react-toastify'; // Importa toast
import 'react-toastify/dist/ReactToastify.css'; // Importa los estilos del toast

import React, { useState, useEffect } from 'react';
import { db } from '../../firebase'; // Importar la configuración de Firebase
import { collection, getDocs, doc, updateDoc, writeBatch, deleteField } from 'firebase/firestore'; // Importar funciones de Firestore
import { getAuth, sendPasswordResetEmail } from 'firebase/auth'; // Importar autenticación de Firebase
import './PasswordReset.css'; // Asegúrate de crear este archivo para los estilos del modal

const PasswordReset = ({ onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [clientsData, setClientsData] = useState([]);
  const [selectedClients, setSelectedClients] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  // Función para obtener los datos de clientes de Firestore
  const fetchClients = async () => {
    const clientsCollection = collection(db, 'clientes'); // Referencia a la colección "clientes"
    const clientsSnapshot = await getDocs(clientsCollection);
    const clientsList = clientsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    setClientsData(clientsList);
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // Filtrar clientes según el término de búsqueda en nombre y que tengan el campo metodoPago
  const filteredClients = clientsData.filter(client => 
    client.metodoPago !== undefined && (client.nombre).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectClient = (clientId) => {
    setSelectedClients(prevSelected => 
      prevSelected.includes(clientId)
        ? prevSelected.filter(id => id !== clientId)
        : [...prevSelected, clientId]
    );
  };

  const handleSelectAll = () => {
    setSelectAll(!selectAll);
    setSelectedClients(selectAll ? [] : filteredClients.map(client => client.id));
  };

  const handleClearmetodoPago = async () => {
    try {
      const batch = writeBatch(db);
      selectedClients.forEach(clientId => {
        const clientRef = doc(db, 'clientes', clientId);
        batch.update(clientRef, { metodoPago: deleteField() });
      });
      await batch.commit();
      toast.success('Campos metodoPago borrados correctamente.');
      await fetchClients();
    } catch (error) {
      console.error('Error al borrar los campos metodoPago:', error);
      toast.error('Error al borrar los campos metodoPago.');
    }
  };

  return (
    <div className="passwordmodal-overlay">
      <div className="passwordmodal-ajua">
        <h2>Restablecer Contraseña</h2>
        <input
          type="text"
          placeholder="Buscar cliente por nombre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="passwordclient-list">
          <div className="passwordclient-item">
            <input
              type="checkbox"
              checked={selectAll}
              onChange={handleSelectAll}
            />
            <label>Seleccionar todos</label>
          </div>
          {filteredClients.length > 0 ? (
            filteredClients.map(client => (
              <div key={client.id} className="passwordclient-item">
                <input
                  type="checkbox"
                  checked={selectedClients.includes(client.id)}
                  onChange={() => handleSelectClient(client.id)}
                />
                <span>{client.ID} - {client.nombre}</span>
                <span>{client.metodoPago}</span>
              </div>
            ))
          ) : (
            <p>No se encontraron clientes</p>
          )}
        </div>
        <button onClick={handleClearmetodoPago} disabled={selectedClients.length === 0}>
          Borrar Campos metodoPago
        </button>
        <button onClick={onClose}>Cerrar</button>
      </div>
      <ToastContainer autoClose={3000} hideProgressBar /> {/* Contenedor para los toasts */}
    </div>
  );
};

export default PasswordReset;
