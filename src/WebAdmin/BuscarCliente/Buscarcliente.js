import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, where, getDocs, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './buscarCliente.css';
import html2canvas from 'html2canvas';
import fondo from '../../fondo.png';
import { FaSave, FaTimes, FaFileAlt, FaTrash } from 'react-icons/fa';
import DetallesCliente from '../DetallesCliente/DetallesCliente'; // Importa el nuevo componente

const firestore = getFirestore();

const normalizarTexto = (texto) => {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

const convertirFecha = (fecha) => {
  const [dia, mes, anio] = fecha.split('/');
  return `${anio}-${mes}-${dia}`;
};

const convertirFechaInvertida = (fecha) => {
  const [anio, mes, dia] = fecha.split('-');
  return `${dia}/${mes}/${anio}`;
};

function BuscarCliente({ onClose }) {
  const [searchType, setSearchType] = useState('nombre');
  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientData, setClientData] = useState({
    ID: '',
    nombre: '',
    apellido: '',
    telefono: '',
    email: '',
    fechaInicial: '',
    fechaFinal: '',
    pagado: '',
    estado: '',
    grupo: '',
    servicio: '',
    notas: '',
    precio: '',
    SPOTIFY: {
      email: '',
      password: ''
    }
  });
  const [showDeleteConfirmationModal, setShowDeleteConfirmationModal] = useState(false);

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

  const handleDeleteClient = async () => {
    setShowDeleteConfirmationModal(true);
  };

  const confirmDeleteClient = async () => {
    try {
      const clientDocRef = doc(firestore, 'clientes', selectedClient.id);
      await deleteDoc(clientDocRef);
      toast.success('Cliente eliminado con éxito');
      setSelectedClient(null);
      setSearchResults(prevResults => prevResults.filter(client => client.id !== selectedClient.id));
      setShowDeleteConfirmationModal(false);
    } catch (error) {
      console.error('Error al eliminar cliente:', error);
      toast.error('Error al eliminar cliente: ' + error.message);
    }
  };

  const cancelDeleteClient = () => {
    setShowDeleteConfirmationModal(false);
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSearchTypeChange = (event) => {
    setSearchType(event.target.value);
    setSearchValue('');
  };

  const handleSearchValueChange = (event) => {
    setSearchValue(event.target.value);
  };

  const searchByName = async (searchValue) => {
    try {
      const clientesRef = collection(firestore, 'clientes');
      const searchValueUpper = normalizarTexto(searchValue).toUpperCase();

      const nombreQuery = query(clientesRef, where('nombre', '>=', searchValueUpper), where('nombre', '<=', searchValueUpper + '\uf8ff'));
      const apellidoQuery = query(clientesRef, where('apellido', '>=', searchValueUpper), where('apellido', '<=', searchValueUpper + '\uf8ff'));

      const [nombreSnapshot, apellidoSnapshot] = await Promise.all([
        getDocs(nombreQuery),
        getDocs(apellidoQuery)
      ]);

      const results = [
        ...nombreSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        ...apellidoSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      ];

      const uniqueResults = Array.from(new Map(results.map(item => [item.id, item])).values());

      const formattedResults = uniqueResults.map(data => ({
        id: data.id,
        nombre: data.nombre,
        apellido: data.apellido,
        estado: data.PENDEJOALEJANDRO?.estado || '',
        ID: data.ID,
        ...data
      }));

      setSearchResults(formattedResults);
    } catch (error) {
      console.error('Error al buscar clientes por nombre o apellido:', error);
    }
  };

  const searchByField = async (field, searchValue) => {
    try {
      const clientesRef = collection(firestore, 'clientes');
      const q = query(clientesRef, where(field, '==', searchValue));
      const querySnapshot = await getDocs(q);
      const results = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          nombre: data.nombre,
          apellido: data.apellido,
          estado: data.PENDEJOALEJANDRO?.estado || '',
          ID: data.ID,
          ...data
        };
      });

      setSearchResults(results);
    } catch (error) {
      console.error(`Error al buscar clientes por ${field}:`, error);
    }
  };

  const handleSearch = async () => {
    switch (searchType) {
      case 'nombre':
        await searchByName(searchValue);
        break;
      case 'estado':
        await searchByField('PENDEJOALEJANDRO.estado', searchValue);
        break;
      case 'ID':
        await searchByField('ID', searchValue);
        break;
      default:
        console.error('Tipo de búsqueda no soportado');
        break;
    }
  };

  const handleGenerateComprobante = async () => {
    if (selectedClient) {
      const servicios = Array.isArray(selectedClient.servicio) ? selectedClient.servicio : [];
      const grupo = Array.isArray(selectedClient.grupo) ? selectedClient.grupo : [];

      const precios = Array.isArray(selectedClient.precio)
        ? selectedClient.precio.map(Number)
        : [];

      const precioTotal = precios.reduce((acc, curr) => acc + curr, 0).toLocaleString('es-ES');

      const comprobanteContainer = document.createElement('div');
      comprobanteContainer.className = 'comprobante-container';
      comprobanteContainer.style.backgroundImage = `url(${fondo})`;
      comprobanteContainer.style.backgroundSize = 'cover';
      comprobanteContainer.style.width = '1080px';
      comprobanteContainer.style.height = '1080px';
      comprobanteContainer.style.color = 'white';
      comprobanteContainer.style.fontFamily = 'Comic Sans MS';
      comprobanteContainer.style.fontSize = '40px';
      comprobanteContainer.style.lineHeight = '3';
      comprobanteContainer.style.textAlign = 'center';
      comprobanteContainer.style.position = 'absolute';
      comprobanteContainer.style.left = '-9999px';
      comprobanteContainer.style.top = '-9999px';

      const date = new Date();
      const fechaGenerada = date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });

      const serviciosTexto = servicios.length > 0 ? servicios.join(', ') : 'Ninguno';
      const grupoTexto = grupo.length > 0 ? grupo.join(', ') : 'Ninguno';

      comprobanteContainer.innerHTML = `
        <p>Comprobante generado (${fechaGenerada})</p>
        <p>⭐ID: ${selectedClient.ID}</p>
        <p>⭐NOMBRE COMPLETO: ${selectedClient.nombre} ${selectedClient.apellido}</p>
        <p>⭐SERVICIO: ${serviciosTexto}</p>
        <p>⭐GRUPO: ${grupoTexto}</p>
        <p>⭐PRECIO: $${precioTotal}</p>
        <p>⭐FECHA FINAL: ${selectedClient.fechaFinal}</p>
        <p>⭐ESTADO: ${selectedClient.estado}</p>
      `;

      document.body.appendChild(comprobanteContainer);

      html2canvas(comprobanteContainer).then(async (canvas) => {
        const uniqueFileName = `comprobante_${selectedClient.ID}_${Date.now()}.png`;
        const clientFolder = selectedClient.ID;

        const dataUrl = canvas.toDataURL('image/png');

        const storage = getStorage();
        const storageRef = ref(storage, `comprobantes/${clientFolder}/${uniqueFileName}`);
        await uploadString(storageRef, dataUrl, 'data_url');

        const downloadURL = await getDownloadURL(storageRef);

        const mensaje = `_*🎉 ¡Gracias por tu Comprobante de Pago y Renovación Exitosa! 🎉*_

Hemos recibido con éxito tu comprobante de pago y renovación. 🎊 Apreciamos tu confianza en *JadePlatform* y estamos encantados de seguir siendo tu elección.

Si tienes alguna pregunta o necesitas asistencia, estamos aquí para ayudarte. ¡Disfruta al máximo de tu servicio renovado! 😊🙌

Haz click aquí para visualizar tu comprobante: ${downloadURL}`;
        await navigator.clipboard.writeText(mensaje);

        toast('El comprobante ha sido generado y guardado en Firebase Storage.');

        document.body.removeChild(comprobanteContainer);
      });
    }
  };

  // Nueva función para cargar datos frescos del cliente
  const handleShowDetails = async (client) => {
    try {
      const clientDocRef = doc(firestore, 'clientes', client.id);
      const clientSnap = await getDoc(clientDocRef);
      if (clientSnap.exists()) {
        setSelectedClient({ id: client.id, ...clientSnap.data() });
      } else {
        toast.error('No se encontró el cliente en la base de datos.');
      }
    } catch (error) {
      toast.error('Error al cargar datos del cliente.');
    }
  };

  return (
    <div className="BuscarCliente-modal-overlay" onClick={onClose}>
      <div className="BuscarCliente-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="BuscarCliente-boton-cerrar" onClick={onClose}>X</button>
        <div className="BuscarCliente-search-container">
          <h1>Buscar Cliente</h1>
          <div className="BuscarCliente-search-controls">
            <select value={searchType} onChange={handleSearchTypeChange} className="BuscarCliente-search-select">
              <option value="nombre">Nombre</option>
              <option value="estado">Estado</option>
              <option value="ID">ID</option>
            </select>
            {searchType === 'estado' ? (
              <select value={searchValue} onChange={handleSearchValueChange} className="BuscarCliente-search-select">
                <option value="⚠️">⚠️</option>
                <option value="❌">❌</option>
                <option value="✅">✅</option>
                <option value="😶‍🌫️">😶‍🌫️</option>
              </select>
            ) : (
              <input
                type="text"
                value={searchValue}
                onChange={handleSearchValueChange}
                className="BuscarCliente-search-input"
                onKeyPress={handleKeyPress}
                placeholder={`Buscar por ${searchType}`}
              />
            )}
            <button onClick={handleSearch} className="BuscarCliente-search-button">Buscar</button>
          </div>

          <div className="BuscarCliente-search-results">
            {searchResults.length > 0 ? (
              <ul>
                {searchResults.map((result) => (
                  <li key={result.id} className="BuscarCliente-search-result-item">
                    <div>ID: {result.ID}</div>
                    <div>Nombre: {result.nombre} {result.apellido}</div>
                    <div>Estado: {result.PENDEJOALEJANDRO?.estado || ''}</div>
                    <button onClick={() => handleShowDetails(result)}>Ver Detalles</button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No se encontraron resultados</p>
            )}
          </div>
        </div>
        {/* Renderiza el componente DetallesCliente si hay un cliente seleccionado */}
        {selectedClient && (
          <DetallesCliente
            client={selectedClient}
            onClose={() => setSelectedClient(null)}
            onSave={() => {
              setSelectedClient(null);
              handleSearch();
            }}
            onDelete={() => {
              setSelectedClient(null);
              handleSearch();
            }}
            fondo={fondo}
          />
        )}
        {showDeleteConfirmationModal && (
          <div className="confirmation-modal-overlay">
            <div className="confirmation-modal-content">
              <h2>¿Estás seguro de que deseas eliminar a este cliente? 💀</h2>
              <div className="confirmation-modal-buttons">
                <button className="no-button" onClick={cancelDeleteClient}>No, Quiero Continuar</button>
                <button className="yes-button" onClick={confirmDeleteClient}>Sí, Deseo Eliminarlo</button>
              </div>
            </div>
          </div>
        )}
      </div>
      <ToastContainer />
    </div>
  );
}

export default BuscarCliente;