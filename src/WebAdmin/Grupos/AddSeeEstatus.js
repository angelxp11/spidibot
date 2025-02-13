import React, { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs, doc, getDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { app } from '../../firebase';
import './AddSeeEstatus.css'; // Asegúrate de crear este archivo para los estilos
import { toast } from 'react-toastify';
import { FaSyncAlt, FaCopy } from 'react-icons/fa';
import Carga from '../../Loada/Carga'; // Import the loading component

const firestore = getFirestore(app);

function AddSeeEstatus({ onClose }) {
  const [selectedStatus, setSelectedStatus] = useState('⚠️');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedCheckbox, setSelectedCheckbox] = useState(null); // Estado para seleccionar un checkbox
  const [selectedResultId, setSelectedResultId] = useState(null); // Estado para el ID del resultado seleccionado
  const [paymentMethods, setPaymentMethods] = useState([]); // Estado para métodos de pago
  const [showPaymentOverlay, setShowPaymentOverlay] = useState(false); // Estado para mostrar el overlay de pago
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null); // Estado para el método de pago seleccionado
  const [loading, setLoading] = useState(false); // Estado de carga
  const [isSuspended, setIsSuspended] = useState(false); // Estado para cuenta suspendida

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
  
  const handleStatusChange = (event) => {
    setSelectedStatus(event.target.value);
  };
  useEffect(() => {
    setSelectedStatus('⚠️'); // Valor predeterminado
    handleSearch(); // Ejecutar búsqueda
  }, []);

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      const financeRef = collection(firestore, 'finance');
      const financeSnapshot = await getDocs(financeRef);
      const methods = financeSnapshot.docs
        .map(doc => doc.id)
        .filter(id => id !== 'AHORRO'); // Filtrar 'AHORRO'
      setPaymentMethods(methods);
    };
  
    fetchPaymentMethods();
  }, []);

  const handleCheckboxChange = (checkbox) => {
    if (checkbox === 'suspend') {
      setIsSuspended(!isSuspended);
    } else {
      setSelectedCheckbox(checkbox); // Actualizar el estado con el checkbox seleccionado
    }
  };

  const searchByStatus = async (status) => {
    try {
      setSearchResults([]);

      const serviciosRef = collection(firestore, 'Servicios');
      const querySnapshot = await getDocs(serviciosRef);
      
      let results = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        for (const [key, value] of Object.entries(data)) {
          if (typeof value === 'object' && value !== null) {
            const estado = value.estado;

            if (estado === status) {
              results.push({
                id: `${doc.id}-${key}`, // Ensure unique key by appending group name
                groupName: key,
                estado: estado,
                fechaPago: value.fechaPago,
                ...data
              });
            }
          }
        }
      });

      if (status === '❌') {
        results = results.sort((a, b) => {
          const [dayA, monthA, yearA] = a.fechaPago.split('/').map(Number);
          const [dayB, monthB, yearB] = b.fechaPago.split('/').map(Number);
          const dateA = new Date(yearA, monthA - 1, dayA);
          const dateB = new Date(yearB, monthB - 1, dayB);
          return dateB - dateA;
        });
      } else if (status === '⚠️') {
        results = results.sort((a, b) => {
          const [dayA, monthA, yearA] = a.fechaPago.split('/').map(Number);
          const [dayB, monthB, yearB] = b.fechaPago.split('/').map(Number);
          const dateA = new Date(yearA, monthA - 1, dayA);
          const dateB = new Date(yearB, monthB - 1, dayB);
          const diffA = Math.ceil((dateA - new Date()) / (1000 * 60 * 60 * 24));
          const diffB = Math.ceil((dateB - new Date()) / (1000 * 60 * 60 * 24));
          return diffA - diffB;
        });
      } else if (status === '✅') {
        results = results.sort((a, b) => {
          const [dayA, monthA, yearA] = a.fechaPago.split('/').map(Number);
          const [dayB, monthB, yearB] = b.fechaPago.split('/').map(Number);
          const dateA = new Date(yearA, monthA - 1, dayA);
          const dateB = new Date(yearB, monthB - 1, dayB);
          const diffA = Math.abs(Math.ceil((dateA - new Date()) / (1000 * 60 * 60 * 24)) - 2);
          const diffB = Math.abs(Math.ceil((dateB - new Date()) / (1000 * 60 * 60 * 24)) - 2);
          return diffA - diffB;
        });
      }

      setSearchResults(results);
    } catch (error) {
      console.error('Error al buscar servicios por estado:', error);
    }
  };

  const handleSearch = async () => {
    try {
      await searchByStatus(selectedStatus);
    } catch (error) {
      toast.error(`Error al realizar la búsqueda: ${error.message}`);
    }
  };

  const handleViewDetails = (result) => {
    const groupDetails = result[result.groupName];
    setSelectedGroup({
      id: result.id,
      groupName: result.groupName,
      ...groupDetails
    });
    setSelectedResultId(result.id); // Establecer el ID del resultado seleccionado
    setSelectedCheckbox(null); // Reset checkboxes
    setIsSuspended(false); // Reset suspended state
  };

  const handleRenew = () => {
    setShowPaymentOverlay(true); // Mostrar overlay de selección de método de pago
  };

  const handlePaymentMethodSelect = async (method) => {
    try {
      setLoading(true); // Mostrar el componente de carga
      setSelectedPaymentMethod(method);
      setShowPaymentOverlay(false);
  
      const originalDocId = selectedGroup.id.split('-')[0];
      if (!originalDocId) {
        throw new Error('ID del documento original no válido');
      }
  
      const docRef = doc(firestore, 'Servicios', originalDocId); // Extract original document ID
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        throw new Error('Documento no encontrado');
      }
      const data = docSnap.data();
      const groupData = data[selectedGroup.groupName];
      if (!groupData) {
        throw new Error('Datos del grupo no encontrados');
      }
      const metodoPagoRef = doc(firestore, 'finance', method); // Referencia al método de pago
      const metodoPagoSnap = await getDoc(metodoPagoRef);
      if (!metodoPagoSnap.exists()) {
        throw new Error('Método de pago no encontrado');
      }
      const metodoPagoData = metodoPagoSnap.data();
  
      let nuevaFechaComienzo = groupData.fechaComienzo;
      let nuevaFechaPago = groupData.fechaPago;
      let montoADescontar = 0;
  
      // Lógica de renovación
      if (isSuspended) {
        const today = new Date();
        nuevaFechaComienzo = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
      }
  
      if (selectedCheckbox === 'addMonth') {
        if (isSuspended) {
          nuevaFechaPago = agregarMes(nuevaFechaComienzo);
        } else {
          nuevaFechaComienzo = agregarMes(nuevaFechaComienzo);
          nuevaFechaPago = agregarMes(nuevaFechaPago);
        }
        montoADescontar = parseFloat(groupData.price); // Usar el campo price del grupo
      } else if (selectedCheckbox === 'netflixFamiliar') {
        if (isSuspended) {
          nuevaFechaPago = agregarDias(nuevaFechaComienzo, 10);
        } else {
          nuevaFechaComienzo = agregarDias(nuevaFechaComienzo, 10);
          nuevaFechaPago = agregarDias(nuevaFechaPago, 10); // Sumar 10 días
        }
        montoADescontar = 20000;
      } else if (selectedCheckbox === 'netflixDuoExtra') {
        if (isSuspended) {
          nuevaFechaPago = agregarDias(nuevaFechaComienzo, 16);
        } else {
          nuevaFechaComienzo = agregarDias(nuevaFechaComienzo, 16);
          nuevaFechaPago = agregarDias(nuevaFechaPago, 16); // Sumar 16 días
        }
        montoADescontar = 20000;
      } else if (selectedCheckbox === 'netflixDuo') {
        if (isSuspended) {
          nuevaFechaPago = agregarDias(nuevaFechaComienzo, 23);
        } else {
          nuevaFechaComienzo = agregarDias(nuevaFechaComienzo, 23);
          nuevaFechaPago = agregarDias(nuevaFechaPago, 23); // Sumar 23 días
        }
        montoADescontar = 20000;
      }
  
      // Verificar si el saldo es suficiente
      if (metodoPagoData.saldo < montoADescontar) {
        toast.error('Saldo insuficiente en el método de pago seleccionado');
        setLoading(false); // Ocultar el componente de carga
        return;
      }
  
      // Actualizar las fechas en Firestore
      await updateDoc(docRef, {
        [`${selectedGroup.groupName}.fechaComienzo`]: nuevaFechaComienzo,
        [`${selectedGroup.groupName}.fechaPago`]: nuevaFechaPago
      });
  
      const nuevoEstado = calcularEstadoGrupo(nuevaFechaPago);
      await updateDoc(docRef, {
        [`${selectedGroup.groupName}.estado`]: nuevoEstado
      });
  
      // Descontar el monto del saldo del método de pago
      const nuevoSaldo = metodoPagoData.saldo - montoADescontar;
      await updateDoc(metodoPagoRef, { saldo: nuevoSaldo });
  
      // Refrescar los detalles del grupo renovado
      const updatedDocSnap = await getDoc(docRef);
      const updatedData = updatedDocSnap.data();
      const updatedGroupData = updatedData[selectedGroup.groupName];
  
      setSelectedGroup({
        id: selectedGroup.id,
        groupName: selectedGroup.groupName,
        ...updatedGroupData
      });
  
      await searchByStatus(selectedStatus);
      setSelectedGroup(null);
  
      // Cambiar el valor del campo pagado de SI a NO para los clientes del grupo
      await actualizarClientesPagado(selectedGroup.id.split('-')[0], selectedGroup.groupName);
  
      toast.success('Grupo renovado');
    } catch (error) {
      console.error('Error al renovar el grupo:', error);
      toast.error(`Error al renovar el grupo: ${error.message}`);
    } finally {
      setLoading(false); // Ocultar el componente de carga
    }
  };

  const actualizarClientesPagado = async (docId, groupName) => {
    const clientesRef = collection(firestore, 'clientes');
    const querySnapshot = await getDocs(clientesRef);
    const batch = writeBatch(firestore);

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const servicios = data.servicio || [];
      const grupos = data.grupo || [];
      const pagado = data.pagado || [];

      servicios.forEach((servicio, index) => {
        if (grupos[index] === groupName) {
          pagado[index] = 'NO';
        }
      });

      batch.update(doc.ref, { pagado });
    });

    await batch.commit();
  };

  const agregarMes = (fecha) => {
    const [day, month, year] = fecha.split('/');
    const sdf = new Date(year, month - 1, day);
    sdf.setMonth(sdf.getMonth() + 1); // Añadir un mes
    return `${sdf.getDate().toString().padStart(2, '0')}/${(sdf.getMonth() + 1).toString().padStart(2, '0')}/${sdf.getFullYear()}`;
  };

  // Función para sumar días a una fecha
  const agregarDias = (fecha, dias) => {
    const [day, month, year] = fecha.split('/');
    const sdf = new Date(year, month - 1, day);
    sdf.setDate(sdf.getDate() + dias); // Sumar los días
    return `${sdf.getDate().toString().padStart(2, '0')}/${(sdf.getMonth() + 1).toString().padStart(2, '0')}/${sdf.getFullYear()}`;
  };

  const calcularEstadoGrupo = (fechaPago) => {
    const [day, month, year] = fechaPago.split('/');
    const sdf = new Date(year, month - 1, day); // Crear fecha en formato correcto
    const fechaActual = new Date();
    const diferencia = sdf - fechaActual;
    const diasRestantes = diferencia / (24 * 60 * 60 * 1000);

    if (diasRestantes > 3) {
      return '✅';
    } else if (diasRestantes >= -1) {
      return '⚠️';
    } else {
      return '❌';
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      toast('Información copiada al portapapeles.');
    }).catch(err => {
      console.error('Error al copiar al portapapeles: ', err);
    });
  };

  return (
    <div className="addseeestatus-modal-overlay" onClick={onClose}>
      <div className="addseeestatus-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="addseeestatus-boton-cerrar" onClick={onClose}>X</button>
        <div className="addseeestatus-search-container">
          <h2>Buscar Estado de Servicios</h2>
          <div className="addseeestatus-search-controls">
            <select value={selectedStatus} onChange={handleStatusChange} className="addseeestatus-search-select">
              <option value="❌">❌</option>
              <option value="✅">✅</option>
              <option value="⚠️">⚠️</option>
            </select>
            <button onClick={handleSearch} className="addseeestatus-search-button">Buscar</button>
          </div>
          <div className="addseeestatus-search-results">
            {searchResults.length > 0 ? (
              <ul>
                {searchResults.map((result) => (
                  <li
                    key={result.id}
                    className={`addseeestatus-estatusmod ${selectedResultId === result.id ? 'selected' : ''}`}
                  >
                    <div>ID: {result.id}</div>
                    <div>Nombre del Grupo: {result.groupName}</div>
                    <div>Estado: {result.estado}</div>
                    <button onClick={() => handleViewDetails(result)} className="addseeestatus-details-button">Ver Detalles</button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No hay resultados.</p>
            )}
          </div>
        </div>
        <div className="addseeestatus-details-container">
          {selectedGroup && (
            <div className="addseeestatus-details-content">
              <h3>Detalles del Grupo</h3>
              <div>
                <strong>ID:</strong> {selectedGroup.id}
              </div>
              <div>
                <strong>Nombre del Grupo:</strong> {selectedGroup.groupName}
              </div>
              <div>
                <strong>Email:</strong> {selectedGroup.email || 'No disponible'}
                {selectedGroup.email && (
                  <FaCopy className="copy-icon" onClick={() => handleCopy(selectedGroup.email)} />
                )}
              </div>
              <div>
                <strong>Password:</strong> {selectedGroup.password || 'No disponible'}
                {selectedGroup.password && (
                  <FaCopy className="copy-icon" onClick={() => handleCopy(selectedGroup.password)} />
                )}
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
              <div>
                <strong>Price:</strong> {selectedGroup.price || 'No disponible'}
              </div>
              <label>
                <input 
                  type="checkbox" 
                  checked={isSuspended}
                  onChange={() => handleCheckboxChange('suspend')}
                  className="addseeestatus-checkbox"
                />
                ¿Tu cuenta fue suspendida?
              </label>
              <label>
                <input 
                  type="checkbox" 
                  checked={selectedCheckbox === 'addMonth'}
                  onChange={() => handleCheckboxChange('addMonth')}
                  className="addseeestatus-checkbox"
                />
                Renovación 1 mes todos los servicios (30 días)
              </label>
              <label>
                <input 
                  type="checkbox" 
                  checked={selectedCheckbox === 'netflixFamiliar'}
                  onChange={() => handleCheckboxChange('netflixFamiliar')}
                  className="addseeestatus-checkbox"
                />
                Renovación Netflix Familiar 20k con dos miembros extras (10 días)
              </label>
              <label>
                <input 
                  type="checkbox" 
                  checked={selectedCheckbox === 'netflixDuoExtra'}
                  onChange={() => handleCheckboxChange('netflixDuoExtra')}
                  className="addseeestatus-checkbox"
                />
                Renovación Netflix Duo 20k con un miembro extra (16 días)
              </label>
              <label>
                <input 
                  type="checkbox" 
                  checked={selectedCheckbox === 'netflixDuo'}
                  onChange={() => handleCheckboxChange('netflixDuo')}
                  className="addseeestatus-checkbox"
                />
                Renovación Netflix Duo 20k sin miembros extras (23 días)
              </label>
              <button onClick={() => handleRenew(selectedGroup.id)} className="addseeestatus-renew-button">
                <FaSyncAlt /> Renovar
              </button>
            </div>
          )}
        </div>
        {showPaymentOverlay && (
          <div className="confirmation-modal-overlay" onClick={() => setShowPaymentOverlay(false)}>
            <div className="confirmation-modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Selecciona el método de pago</h2>
              <div className="confirmation-modal-buttons">
                {paymentMethods.map((method) => (
                  <button key={method} className="payment-method-button" onClick={() => handlePaymentMethodSelect(method)}>{method}</button>
                ))}
              </div>
            </div>
          </div>
        )}
        {loading && <Carga />} {/* Mostrar el componente de carga */}
      </div>
    </div>
  );
}

export default AddSeeEstatus;
