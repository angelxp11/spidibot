import React, { useState } from 'react';
import { getFirestore, collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { app } from '../../firebase';
import html2canvas from 'html2canvas';
import fondo from '../../fondo.png'; // Asegúrate de que la imagen fondo.png esté en la carpeta correcta
import './estados.css';

const firestore = getFirestore(app);

function Estados({ onClose }) {
  const [searchValue, setSearchValue] = useState('⚠️');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);

  const handleSearchValueChange = (event) => {
    setSearchValue(event.target.value);
  };

  const searchByState = async (searchValue) => {
    try {
      const clientesRef = collection(firestore, 'clientes');
      const q = query(clientesRef, where('PENDEJOALEJANDRO.estado', '==', searchValue));
      const querySnapshot = await getDocs(q);
      const results = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          nombre: data.nombre,
          apellido: data.apellido,
          estado: data.PENDEJOALEJANDRO?.estado || '',
          fechaFinal: data.fechaFinal,
          ID: data.ID,
          telefono: data.telefono || '', // Agregar el campo teléfono
          servicio: data.servicio || [], // Asegúrate de que sea un array
          grupo: data.grupo || [], // Asegúrate de que sea un array
          precio: data.precio || [], // Asegúrate de que sea un array
          ...data
        };
      });

      setSearchResults(results);
    } catch (error) {
      console.error('Error al buscar clientes por estado:', error);
    }
  };

  const handleSearch = async () => {
    await searchByState(searchValue);
  };

  const handleSelectClient = (client) => {
    setSelectedClient(client);
  };

  const calcularEstadoCliente = (fechaFinal) => {
    const [day, month, year] = fechaFinal.split('/').map(Number);
    const sdf = new Date(year, month - 1, day);
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

  const handleRenew = async () => {
    if (selectedClient) {
      const [day, month, year] = selectedClient.fechaFinal.split('/').map(Number);
      const fechaActual = new Date(year, month - 1, day);
      fechaActual.setDate(fechaActual.getDate() + 30);

      const nuevaFechaFinal = fechaActual.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });

      const nuevoEstado = calcularEstadoCliente(nuevaFechaFinal);

      const clientRef = doc(firestore, 'clientes', selectedClient.id);
      await updateDoc(clientRef, {
        fechaFinal: nuevaFechaFinal,
        'PENDEJOALEJANDRO.estado': nuevoEstado,
        pagado:"SI"
      });

      setSelectedClient({
        ...selectedClient,
        fechaFinal: nuevaFechaFinal,
        estado: nuevoEstado
      });

      alert('La fecha de finalización ha sido renovada y el estado actualizado.');
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
      comprobanteContainer.style.backgroundSize = 'cover'; // Ajustar al tamaño del contenedor
      comprobanteContainer.style.width = '1080px'; // Tamaño de la imagen 1:1
      comprobanteContainer.style.height = '1080px'; // Tamaño de la imagen 1:1
      comprobanteContainer.style.color = 'white'; // Color del texto
      comprobanteContainer.style.fontFamily = 'Comic Sans MS'; // Fuente Comic Sans MS
      comprobanteContainer.style.fontSize = '40px'; // Tamaño de la letra
      comprobanteContainer.style.lineHeight = '3'; // Espaciado entre líneas
      comprobanteContainer.style.textAlign = 'center'; // Centrar el texto
      comprobanteContainer.style.position = 'absolute'; // Posición absoluta para sacarlo del flujo del documento
      comprobanteContainer.style.left = '-9999px'; // Moverlo fuera de la vista
      comprobanteContainer.style.top = '-9999px'; // Moverlo fuera de la vista
  
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
  
      html2canvas(comprobanteContainer).then((canvas) => {
        const link = document.createElement('a');
        link.download = 'comprobante.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
  
        // WhatsApp Web message
        const mensaje = `Hola, te envío el comprobante generado. Aquí está el archivo:`; // Ajustar el mensaje
        const whatsappNumber = selectedClient.telefono; // Obtener el número de WhatsApp del cliente
        const encodedMessage = encodeURIComponent(mensaje);
        const whatsappUrl = `https://web.whatsapp.com/send?phone=${whatsappNumber}&text=${encodedMessage}`;
  
        // Abre WhatsApp Web
        window.open(whatsappUrl, '_blank');
  
        document.body.removeChild(comprobanteContainer);
      });
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-button" onClick={onClose}>×</button>
        <div className="search-container">
          <h1>Buscar Cliente por Estado</h1>
          <div className="search-controls">
            <select value={searchValue} onChange={handleSearchValueChange} className="search-select">
              <option value="⚠️">⚠️</option>
              <option value="❌">❌</option>
              <option value="✅">✅</option>
            </select>
            <button onClick={handleSearch}>Buscar</button>
          </div>
          <div className="search-results">
            {searchResults.length > 0 ? (
              <ul>
                {searchResults.map((result) => (
                  <li key={result.id}>
                    <div>ID: {result.ID}</div>
                    <div>Nombre: {result.nombre} {result.apellido}</div>
                    <div>Estado: {result.estado}</div>
                    <div>Fecha Final: {result.fechaFinal}</div>
                    <button onClick={() => handleSelectClient(result)}>Seleccionar</button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No hay resultados.</p>
            )}
          </div>
        </div>

        {selectedClient && (
          <div className="client-details">
            <h2>Detalles del Cliente</h2>
            <div>ID: {selectedClient.ID}</div>
            <div>Nombre: {selectedClient.nombre} {selectedClient.apellido}</div>
            <div>Estado: {selectedClient.estado}</div>
            <div>Fecha Final: {selectedClient.fechaFinal}</div>
            <button onClick={handleRenew}>Renovar</button>
            <button onClick={handleGenerateComprobante}>Generar Comprobante</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Estados;
