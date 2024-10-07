import { ToastContainer, toast } from 'react-toastify'; // Importa toast
import 'react-toastify/dist/ReactToastify.css'; // Importa los estilos del toast

import React, { useState, useEffect } from 'react';
import { db } from '../../firebase'; // Importar la configuración de Firebase
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore'; // Importar funciones de Firestore
import { getAuth, sendPasswordResetEmail } from 'firebase/auth'; // Importar autenticación de Firebase
import './PasswordReset.css'; // Asegúrate de crear este archivo para los estilos del modal

const PasswordReset = ({ onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [clientsData, setClientsData] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [email, setEmail] = useState('');

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

  // Filtrar clientes según el término de búsqueda en nombre o apellido
  const filteredClients = clientsData.filter(client => 
    (client.nombre + ' ' + client.apellido).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePasswordReset = async () => {
    if (selectedClient) {
      const auth = getAuth(); // Obtiene la instancia de autenticación
      const emailToSend = email || selectedClient.email; // Usar el email del cliente seleccionado o el ingresado

      try {
        await sendPasswordResetEmail(auth, emailToSend); // Enviar el enlace de restablecimiento de contraseña
        toast.success('Email enviado con éxito.'); // Muestra el toast de éxito
      } catch (error) {
        toast.error(`Error: ${error.message}`); // Muestra el toast de error
      } finally {
        // Eliminar el mensaje después de 3 segundos y cerrar el modal
        setTimeout(() => {
          onClose(); // Cierra el modal después de 3 segundos
        }, 3000); // 3 segundos
      }
    }
  };

  // Función para guardar el email actualizado
  const handleSaveEmail = async () => {
    if (selectedClient) {
      try {
        const clientRef = doc(db, 'clientes', selectedClient.id); // Referencia al documento del cliente
        await updateDoc(clientRef, { email }); // Actualiza el email en Firestore

        // Mostrar mensaje de éxito en un toast
        toast.success('Email actualizado correctamente.');
        // Refrescar la lista de clientes
        await fetchClients();
      } catch (error) {
        console.error('Error al actualizar el email:', error);
        toast.error('Error al actualizar el email.'); // Muestra el toast de error
      }
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-ajua">
        <h2>Restablecer Contraseña</h2>
        <input
          type="text"
          placeholder="Buscar cliente por nombre o apellido..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="client-list">
          {filteredClients.length > 0 ? (
            filteredClients.map(client => (
              <div
                key={client.id}
                className={`client-item ${selectedClient?.id === client.id ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedClient(client);
                  setEmail(client.email); // Establecer el email del cliente seleccionado
                }}
              >
                {client.nombre} {client.apellido} - {client.email}
              </div>
            ))
          ) : (
            <p>No se encontraron clientes</p>
          )}
        </div>
        {selectedClient && ( // Mostrar el input de email solo si hay un cliente seleccionado
          <div>
            <input
              type="email"
              placeholder="Ingresa el email (opcional)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        )}
        <button onClick={handlePasswordReset} disabled={!selectedClient}>
          Enviar Enlace de Restablecimiento
        </button>
        <button onClick={handleSaveEmail} disabled={!selectedClient}>
          Guardar cambios
        </button>
        <button onClick={onClose}>Cerrar</button>
      </div>
      <ToastContainer autoClose={3000} hideProgressBar /> {/* Contenedor para los toasts */}
    </div>
  );
};

export default PasswordReset;
