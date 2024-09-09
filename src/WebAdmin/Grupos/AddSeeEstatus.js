import React, { useState } from 'react';
import { getFirestore, collection, getDocs, doc,getDoc, updateDoc } from 'firebase/firestore';
import { app } from '../../firebase';
import './AddSeeEstatus.css'; // Asegúrate de crear este archivo para los estilos
import { toast } from 'react-toastify';


const firestore = getFirestore(app);

function AddSeeEstatus({ onClose }) {
  const [selectedStatus, setSelectedStatus] = useState('⚠️');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [addMonth, setAddMonth] = useState(false); // Estado para el checkbox

  const handleStatusChange = (event) => {
    setSelectedStatus(event.target.value);
  };

  const handleCheckboxChange = () => {
    setAddMonth(!addMonth);
  };

  const searchByStatus = async (status) => {
    try {
      // Limpiar los resultados anteriores
      setSearchResults([]);
      
      const serviciosRef = collection(firestore, 'Servicios');
      const querySnapshot = await getDocs(serviciosRef);
      
      const results = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        for (const [key, value] of Object.entries(data)) {
          if (typeof value === 'object' && value !== null) {
            const estado = value.estado;

            if (estado === status) {
              results.push({
                id: doc.id,
                groupName: key,
                estado: estado,
                ...data
              });
            }
          }
        }
      });

      setSearchResults(results);
    } catch (error) {
      console.error('Error al buscar servicios por estado:', error);
    }
  };

  const handleSearch = async () => {
    await searchByStatus(selectedStatus);
  };

  const handleViewDetails = (result) => {
    const groupDetails = result[result.groupName];
    setSelectedGroup({
      id: result.id,
      groupName: result.groupName,
      ...groupDetails
    });
  };

  const handleRenew = async (groupId) => {
    try {
      const docRef = doc(firestore, 'Servicios', groupId);
      const docSnap = await getDoc(docRef); // Obtener el documento
      const data = docSnap.data();
      const groupData = data[selectedGroup.groupName];
  
      if (addMonth) {
        const nuevaFechaComienzo = agregarMes(groupData.fechaComienzo);
        const nuevaFechaPago = agregarMes(groupData.fechaPago);
  
        await updateDoc(docRef, {
          [`${selectedGroup.groupName}.fechaComienzo`]: nuevaFechaComienzo,
          [`${selectedGroup.groupName}.fechaPago`]: nuevaFechaPago
        });
      }
  
      const nuevoEstado = calcularEstadoGrupo(groupData.fechaPago);
      await updateDoc(docRef, {
        [`${selectedGroup.groupName}.estado`]: nuevoEstado
      });
  
      // Refrescar los detalles del grupo renovado
      const updatedDocSnap = await getDoc(docRef); // Obtener los datos actualizados
      const updatedData = updatedDocSnap.data();
      const updatedGroupData = updatedData[selectedGroup.groupName];
  
      // Actualizar el estado del grupo seleccionado con los datos renovados
      setSelectedGroup({
        id: groupId,
        groupName: selectedGroup.groupName,
        ...updatedGroupData
      });
  
      // Actualizar los resultados de búsqueda
      await searchByStatus(selectedStatus);
  
      toast.success('Grupo renovado');
    } catch (error) {
      console.error('Error al renovar el grupo:', error);
      toast.error(`Error al renovar el grupo: ${error.message}`);
    }
  };
  

  const agregarMes = (fecha) => {
    const [day, month, year] = fecha.split('/');
    const sdf = new Date(year, month - 1, day);
    sdf.setMonth(sdf.getMonth() + 1); // Añadir un mes
    return `${sdf.getDate().toString().padStart(2, '0')}/${(sdf.getMonth() + 1).toString().padStart(2, '0')}/${sdf.getFullYear()}`;
  };

  const calcularEstadoGrupo = (fechaPago) => {
    const [day, month, year] = fechaPago.split('/');
    const sdf = new Date(year, month - 1, day); // Crear fecha en formato correcto
    const fechaActual = new Date();
    const diferencia = sdf - fechaActual;
    const diasRestantes = diferencia / (24 * 60 * 60 * 1000);

    if (diasRestantes > 2) {
      return '✅';
    } else if (diasRestantes >= 0) {
      return '⚠️';
    } else {
      return '❌';
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-button" onClick={onClose}>×</button>
        <div className="search-container">
          <h2>Buscar Estado de Servicios</h2>
          <div className="search-controls">
            <select value={selectedStatus} onChange={handleStatusChange} className="search-select">
              <option value="❌">❌</option>
              <option value="✅">✅</option>
              <option value="⚠️">⚠️</option>
            </select>
            <button onClick={handleSearch} className="search-button">Buscar</button>
          </div>
          <div className="search-results">
            {searchResults.length > 0 ? (
              <ul>
                {searchResults.map((result) => (
                  <li key={result.id} className="result-item">
                    <div>ID: {result.id}</div>
                    <div>Nombre del Grupo: {result.groupName}</div>
                    <div>Estado: {result.estado}</div>
                    <button onClick={() => handleViewDetails(result)} className="details-button">Ver Detalles</button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No hay resultados.</p>
            )}
          </div>
        </div>
        <div className="details-container">
          {selectedGroup && (
            <div className="details-content">
              <h3>Detalles del Grupo</h3>
              <div>
                <strong>ID:</strong> {selectedGroup.id}
              </div>
              <div>
                <strong>Nombre del Grupo:</strong> {selectedGroup.groupName}
              </div>
              <div>
                <strong>Email:</strong> {selectedGroup.email || 'No disponible'}
              </div>
              <div>
                <strong>Password:</strong> {selectedGroup.password || 'No disponible'}
              </div>
              <div>
                <strong>Fecha de Comienzo:</strong> {selectedGroup.fechaComienzo || 'No disponible'}
              </div>
              <div>
                <strong>Fecha de Pago:</strong> {selectedGroup.fechaPago || 'No disponible'}
              </div>
              <div>
                <strong>Estado:</strong> {selectedGroup.estado || 'No disponible'}
              </div>
              <label>
                <input 
                  type="checkbox" 
                  checked={addMonth}
                  onChange={handleCheckboxChange}
                />
                Agregar un mes
              </label>
              <button onClick={() => handleRenew(selectedGroup.id)} className="renew-button">Renovar</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AddSeeEstatus;
