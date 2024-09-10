import React, { useState } from 'react';
import { getFirestore, collection, query, where, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { app } from '../../firebase';
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage"; // Asegúrate de importar estas funciones
import './buscarCliente.css';
import html2canvas from 'html2canvas';
import fondo from '../../fondo.png'; // Asegúrate de que la imagen fondo.png esté en la carpeta correcta
import { toast } from 'react-toastify'; // Asegúrate de instalar react-toastify

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
    fechaInicial: '',
    fechaFinal: '',
    pagado: '',
    estado: '',
    grupo: '',
    servicio: '',
    precio: ''
  });

  const handleDeleteClient = async () => {
    if (window.confirm('¿Estás seguro de que deseas eliminar a este cliente?')) {
      try {
        const clientDocRef = doc(firestore, 'clientes', selectedClient.id);
        await deleteDoc(clientDocRef);
        toast.success('Cliente eliminado con éxito');
        setSelectedClient(null);
        setSearchResults(prevResults => prevResults.filter(client => client.id !== selectedClient.id));
      } catch (error) {
        console.error('Error al eliminar cliente:', error);
        toast.error('Error al eliminar cliente: ' + error.message);
      }
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
  
      // Utilizamos el índice de Firestore para hacer la búsqueda por nombre
      const q = query(clientesRef, where('nombre', '>=', searchValueUpper), where('nombre', '<=', searchValueUpper + '\uf8ff'));
  
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
      console.error('Error al buscar clientes por nombre:', error);
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
      fechaInicial: convertirFecha(client.fechaInicial),
      fechaFinal: convertirFecha(client.fechaFinal),
      pagado: client.pagado,
      estado: client.PENDEJOALEJANDRO?.estado || '',
      grupo: client.grupo,
      servicio: client.servicio,
      precio: client.precio
    });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setClientData((prevData) => ({
      ...prevData,
      [name]: value
    }));
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

      const precioArray = Array.isArray(clientData.precio)
        ? clientData.precio.map(item => item.toUpperCase())
        : (clientData.precio ? clientData.precio.split(',').map(item => item.trim().toUpperCase()) : []);

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
      if (fechaInicial) {
        updates['fechaInicial'] = fechaInicial;
      }
      if (fechaFinal) {
        updates['fechaFinal'] = fechaFinal;
      }
      if (clientData.pagado) {
        updates['pagado'] = clientData.pagado.toUpperCase();
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
      if (precioArray.length > 0) {
        updates['precio'] = precioArray;
      }

      await updateDoc(clientDocRef, updates);
      alert('Cambios guardados con éxito');
      setSelectedClient(null);
    } catch (error) {
      console.error('Error al guardar cambios:', error);
      alert('Error al guardar cambios: ' + error.message);
    }
  };

  const handleGenerateComprobante = async () => {
    if (selectedClient) {
      // Verificar que las propiedades necesarias existan y sean arrays
      const servicios = Array.isArray(selectedClient.servicio) ? selectedClient.servicio : [];
      const grupo = Array.isArray(selectedClient.grupo) ? selectedClient.grupo : [];
  
      // Asegurarse de que los precios sean números
      const precios = Array.isArray(selectedClient.precio)
        ? selectedClient.precio.map(Number) // Convertir todos los precios a números
        : [];
  
      // Sumar los precios
      const precioTotal = precios.reduce((acc, curr) => acc + curr, 0).toLocaleString('es-ES');
  
      // Crear el contenedor del comprobante
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
  
      // Convertir servicio y grupo en cadenas de texto unidas por comas
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
        // Generar un nombre de archivo único de 16 caracteres
        const generateUniqueFileName = () => {
          return Math.random().toString(36).substring(2, 18) + Date.now().toString(36);
        };
  
        const uniqueFileName = `${generateUniqueFileName()}.png`;
  
        // Obtener el URL del archivo como base64
        const dataUrl = canvas.toDataURL('image/png');
  
        // Subir a Firebase Storage
        const storage = getStorage(); // Inicializa Firebase Storage
        const storageRef = ref(storage, `comprobantes/${uniqueFileName}`);
        await uploadString(storageRef, dataUrl, 'data_url');
  
        // Obtener la URL de descarga
        const downloadURL = await getDownloadURL(storageRef);
  
        // WhatsApp Web message
        const mensaje = `_*🎉 ¡Gracias por tu Comprobante de Pago y Renovación Exitosa! 🎉*_

Hemos recibido con éxito tu comprobante de pago y renovación. 🎊 Apreciamos tu confianza en *JadePlatform* y estamos encantados de seguir siendo tu elección.

Si tienes alguna pregunta o necesitas asistencia, estamos aquí para ayudarte. ¡Disfruta al máximo de tu servicio renovado! 😊🙌

Haz click aquí para visualizar tu comprobante: ${downloadURL}`;
        await navigator.clipboard.writeText(mensaje);
        alert('Mensaje copiado al portapapeles');
        const whatsappNumber = selectedClient.telefono; // Obtener el número de WhatsApp del cliente
        const encodedMessage = encodeURIComponent(mensaje);
        const whatsappUrl = `https://web.whatsapp.com/send?phone=${whatsappNumber}&text=${encodedMessage}`;
  
        // Abre WhatsApp Web
        window.open(whatsappUrl, '_blank');
  
        alert('El comprobante ha sido generado, guardado en Firebase Storage y enviado por WhatsApp.');
  
        document.body.removeChild(comprobanteContainer);
      });
    }
  };
  

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-button" onClick={onClose}>×</button>
        <div className="search-container">
          <h1>Buscar Cliente</h1>
          <div className="search-controls">
            <select value={searchType} onChange={handleSearchTypeChange} className="search-select">
              <option value="nombre">Nombre</option>
              <option value="estado">Estado</option>
              <option value="ID">ID</option>
            </select>
            {searchType === 'estado' ? (
              <select value={searchValue} onChange={handleSearchValueChange} className="search-select">
                <option value="⚠️">⚠️</option>
                <option value="❌">❌</option>
                <option value="✅">✅</option>
              </select>
            ) : (
              <input
                type="text"
                value={searchValue}
                onChange={handleSearchValueChange}
                className="search-input"
                placeholder={`Buscar por ${searchType}`}
              />
            )}
            <button onClick={handleSearch} className="search-button">Buscar</button>
          </div>
  
          <div className="search-results">
            {searchResults.length > 0 ? (
              <ul>
                {searchResults.map((result) => (
                  <li key={result.id} className="search-result-item">
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
          <div className="details-panel-container">
            <div className={`details-panel ${selectedClient ? 'show' : ''}`}>
              <h2>Detalles del Cliente</h2>
              <label>
                ID:
                <input
                  type="text"
                  name="ID"
                  value={clientData.ID}
                  onChange={handleChange}
                  className="detail-input"
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
                  className="detail-input"
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
                  className="detail-input"
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
                  className="detail-input"
                  placeholder="Teléfono"
                />
              </label>
              <label>
                Fecha Inicial:
                <input
                  type="date"
                  name="fechaInicial"
                  value={clientData.fechaInicial}
                  onChange={handleChange}
                  className="detail-input"
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
                  className="detail-input"
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
                  className="detail-input"
                  placeholder="Pagado"
                />
              </label>
              <label>
                Estado:
                <select
                  name="estado"
                  value={clientData.estado}
                  onChange={handleChange}
                  className="detail-input"
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
                  className="detail-input"
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
                  className="detail-input"
                  placeholder="Servicio"
                />
              </label>
              <label>
                Precio:
                <input
                  type="text"
                  name="precio"
                  value={clientData.precio}
                  onChange={handleChange}
                  className="detail-input"
                  placeholder="Precio"
                />
              </label>
              <button onClick={handleSaveChanges} className="save-button">Guardar Cambios</button>
              <button onClick={onClose} className="close-button">Cerrar</button>
              <button onClick={handleGenerateComprobante} className="generate-button">Generar Comprobante</button>
              <button onClick={handleDeleteClient}>Eliminar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default BuscarCliente;