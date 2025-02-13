import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, where, getDocs, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";
import { toast, ToastContainer } from 'react-toastify'; // Import ToastContainer
import 'react-toastify/dist/ReactToastify.css'; // Import Toastify CSS
import './buscarCliente.css';
import html2canvas from 'html2canvas';
import fondo from '../../fondo.png';
import { FaSave, FaTimes, FaFileAlt, FaTrash } from 'react-icons/fa';

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
  const [showSpotifyInfo, setShowSpotifyInfo] = useState(false);

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

  const handleShowDetails = (client) => {
    setSelectedClient(client);
    setClientData({
      ID: client.ID,
      nombre: client.nombre,
      apellido: client.apellido,
      telefono: client.telefono,
      email: client.email,
      fechaInicial: convertirFecha(client.fechaInicial),
      fechaFinal: convertirFecha(client.fechaFinal),
      pagado: client.pagado,
      estado: client.PENDEJOALEJANDRO?.estado || '',
      grupo: client.grupo,
      servicio: client.servicio,
      notas: client.notas,
      precio: client.precio,
      SPOTIFY: {
        email: client.SPOTIFY?.email[0] || '',
        password: client.SPOTIFY?.password[0] || '',
        principal: client.SPOTIFY?.principal || [true]
      }
    });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    const [field, subfield] = name.split('.');

    if (subfield) {
      setClientData((prevData) => ({
        ...prevData,
        [field]: {
          ...prevData[field],
          [subfield]: value
        }
      }));
    } else {
      setClientData((prevData) => ({
        ...prevData,
        [name]: value
      }));
    }
  };

  const handleSpotifyCheckboxChange = (event) => {
    setShowSpotifyInfo(event.target.checked);
  };

  const handleSaveChanges = async () => {
    try {
      const clientDocRef = doc(firestore, 'clientes', selectedClient.id);

      const grupoArray = Array.isArray(clientData.grupo)
        ? clientData.grupo.map(item => item.toUpperCase())
        : (clientData.grupo ? clientData.grupo.split(',').map(item => item.trim().toUpperCase()) : []);

      const servicioArray = Array.isArray(clientData.servicio)
        ? clientData.servicio.map(item => item.toUpperCase())
        : (clientData.servicio ? clientData.servicio.split(',').map(item => item.trim().toUpperCase()) : []);

      const notasArray = Array.isArray(clientData.notas)
        ? clientData.notas.map(item => item.toUpperCase())
        : (clientData.notas ? clientData.notas.split(',').map(item => item.trim().toUpperCase()) : []);

      const precioArray = Array.isArray(clientData.precio)
        ? clientData.precio.map(item => item.toUpperCase())
        : (clientData.precio ? clientData.precio.split(',').map(item => item.trim().toUpperCase()) : []);

      const pagadoMap = typeof clientData.pagado === 'object' && clientData.pagado !== null
        ? clientData.pagado
        : {};

      const fechaInicial = clientData.fechaInicial ? convertirFechaInvertida(clientData.fechaInicial) : '';
      const fechaFinal = clientData.fechaFinal ? convertirFechaInvertida(clientData.fechaFinal) : '';

      const updates = {};
      if (clientData.nombre) {
        updates['nombre'] = clientData.nombre.toUpperCase();
      }
      if (clientData.apellido) {
        updates['apellido'] = clientData.apellido.toUpperCase();
      }
      if (clientData.telefono) {
        updates['telefono'] = clientData.telefono.toUpperCase();
      }
      if (clientData.email) {
        updates['email'] = clientData.email.toLowerCase();
      }
      if (fechaInicial) {
        updates['fechaInicial'] = fechaInicial;
      }
      if (fechaFinal) {
        updates['fechaFinal'] = fechaFinal;
      }
      if (Object.keys(pagadoMap).length > 0) {
        updates['pagado'] = pagadoMap;
      }
      if (clientData.estado !== '') {
        updates['PENDEJOALEJANDRO.estado'] = clientData.estado;
      }
      if (grupoArray.length > 0) {
        updates['grupo'] = grupoArray;
      }
      if (servicioArray.length > 0) {
        updates['servicio'] = servicioArray;
      }
      if (notasArray.length > 0) {
        updates['notas'] = notasArray;
      }
      if (precioArray.length > 0) {
        updates['precio'] = precioArray;
      }

      const clienteDoc = await getDoc(clientDocRef);
      const clienteData = clienteDoc.data();
      const updatedSpotify = {
        email: [clientData.SPOTIFY.email],
        password: [clientData.SPOTIFY.password],
        principal: [clientData.SPOTIFY.principal[0] === 'true']
      };

      updates['SPOTIFY'] = updatedSpotify;

      await updateDoc(clientDocRef, updates);
      toast.success('Datos guardados con éxito');
      handleSearch(null);
      setSelectedClient(null);
    } catch (error) {
      console.error('Error al guardar cambios:', error);
      toast.error('Error al guardar cambios: ' + error.message);
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

  const handleCloseDetails = () => {
    setSelectedClient(null);
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
        {selectedClient && (
          <div className="BuscarCliente-details-panel-container">
            <div className={`BuscarCliente-details-panel ${selectedClient ? 'show' : ''}`}>
              <h2>Detalles del Cliente</h2>
              <label>
                ID:
                <input
                  type="text"
                  name="ID"
                  value={clientData.ID}
                  onChange={handleChange}
                  className="BuscarCliente-detail-input"
                  placeholder="ID"
                />
              </label>
              <label>
                Nombre:
                <input
                  type="text"
                  name="nombre"
                  value={clientData.nombre}
                  onChange={handleChange}
                  className="BuscarCliente-detail-input"
                  placeholder="Nombre"
                />
              </label>
              <label>
                Apellido:
                <input
                  type="text"
                  name="apellido"
                  value={clientData.apellido}
                  onChange={handleChange}
                  className="BuscarCliente-detail-input"
                  placeholder="Apellido"
                />
              </label>
              <label>
                Teléfono:
                <input
                  type="text"
                  name="telefono"
                  value={clientData.telefono}
                  onChange={handleChange}
                  className="BuscarCliente-detail-input"
                  placeholder="Teléfono"
                />
              </label>
              <label>
                Email:
                <input
                  type="text"
                  name="email"
                  value={clientData.email}
                  onChange={handleChange}
                  className="BuscarCliente-detail-input"
                  placeholder="Email"
                />
              </label>
              <label>
                Fecha Inicial:
                <input
                  type="date"
                  name="fechaInicial"
                  value={clientData.fechaInicial}
                  onChange={handleChange}
                  className="BuscarCliente-detail-input"
                  placeholder="Fecha Inicial (dd/mm/yyyy)"
                />
              </label>
              <label>
                Fecha Final:
                <input
                  type="date"
                  name="fechaFinal"
                  value={clientData.fechaFinal}
                  onChange={handleChange}
                  className="BuscarCliente-detail-input"
                  placeholder="Fecha Final (dd/mm/yyyy)"
                />
              </label>
              <label>
                Pagado:
                <input
                  type="text"
                  name="pagado"
                  value={clientData.pagado}
                  onChange={handleChange}
                  className="BuscarCliente-detail-input"
                  placeholder="Pagado"
                />
              </label>
              <label>
                Estado:
                <select
                  name="estado"
                  value={clientData.estado}
                  onChange={handleChange}
                  className="BuscarCliente-detail-input"
                >
                  <option value="⚠️">⚠️</option>
                  <option value="❌">❌</option>
                  <option value="✅">✅</option>
                </select>
              </label>
              <label>
                Grupo:
                <input
                  type="text"
                  name="grupo"
                  value={clientData.grupo}
                  onChange={handleChange}
                  className="BuscarCliente-detail-input"
                  placeholder="Grupo"
                />
              </label>
              <label>
                Servicio:
                <input
                  type="text"
                  name="servicio"
                  value={clientData.servicio}
                  onChange={handleChange}
                  className="BuscarCliente-detail-input"
                  placeholder="Servicio"
                />
              </label>
              <label>
                Notas:
                <input
                  type="text"
                  name="notas"
                  value={clientData.notas}
                  onChange={handleChange}
                  className="BuscarCliente-detail-input"
                  placeholder="notas"
                />
              </label>
              <label>
                Precio:
                <input
                  type="text"
                  name="precio"
                  value={clientData.precio}
                  onChange={handleChange}
                  className="BuscarCliente-detail-input"
                  placeholder="Precio"
                />
              </label>
              <div className="BuscarCliente-checkbox-container">
                <input
                  type="checkbox"
                  id="spotify-checkbox"
                  checked={showSpotifyInfo}
                  onChange={handleSpotifyCheckboxChange}
                />
                <label htmlFor="spotify-checkbox">¿Deseas ingresar Spotify information?</label>
              </div>
              {showSpotifyInfo && (
                <>
                  <label>
                    SPOTIFY Email:
                    <input
                      type="text"
                      name="SPOTIFY.email"
                      value={clientData.SPOTIFY.email}
                      onChange={handleChange}
                      className="BuscarCliente-detail-input"
                      placeholder="SPOTIFY Email"
                    />
                  </label>
                  <label>
                    SPOTIFY Password:
                    <input
                      type="text"
                      name="SPOTIFY.password"
                      value={clientData.SPOTIFY.password}
                      onChange={handleChange}
                      className="BuscarCliente-detail-input"
                      placeholder="SPOTIFY Password"
                    />
                  </label>
                  <label>
                    Principal:
                    <select
                      name="SPOTIFY.principal"
                      value={clientData.SPOTIFY.principal[0]}
                      onChange={(e) => handleChange({ target: { name: 'SPOTIFY.principal', value: [e.target.value === 'true'] } })}
                      className="BuscarCliente-detail-input"
                    >
                      <option value="true">True</option>
                      <option value="false">False</option>
                    </select>
                  </label>
                </>
              )}
              <div className="button-container">
                <button onClick={handleSaveChanges} className="BuscarCliente-save-button">
                  <FaSave /> Guardar
                </button>
                <button onClick={handleCloseDetails} className="BuscarCliente-save-button">
                  <FaTimes /> Cerrar
                </button>
                <button onClick={handleGenerateComprobante} className="BuscarCliente-save-button">
                  <FaFileAlt /> Generar Comprobante
                </button>
                <button onClick={handleDeleteClient} className="BuscarCliente-save-button">
                  <FaTrash /> Eliminar
                </button>
              </div>
            </div>
          </div>
        )}
        {showDeleteConfirmationModal && (
          <>
            <div className="confirmation-modal-overlay"></div>
            <div className="confirmation-modal-content">
              <h2>¿Estás seguro de que deseas eliminar a este cliente? 💀</h2>
              <div className="confirmation-modal-buttons">
                <button className="no-button" onClick={cancelDeleteClient}>No, Quiero Continuar</button>
                <button className="yes-button" onClick={confirmDeleteClient}>Sí, Deseo Eliminarlo</button>
              </div>
            </div>
          </>
        )}
      </div>
      <ToastContainer /> {/* Add ToastContainer here */}
    </div>
  );
}

export default BuscarCliente;