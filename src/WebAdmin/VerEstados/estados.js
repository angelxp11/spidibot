import React, { useState } from 'react';
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage"; // Asegúrate de importar estas funciones


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
  ///funion para no ccontinuar
  const handleNoContinuar = async () => {
    if (selectedClient) {
      const nuevaFechaInicio = '07/07/2003';
      const nuevaFechaFinal = '07/07/2003';
      
      // Actualizar el documento en Firestore
      const clientRef = doc(firestore, 'clientes', selectedClient.id);
      await updateDoc(clientRef, {
        fechaInicial: nuevaFechaInicio,  // Si tienes este campo en tu base de datos
        fechaFinal: nuevaFechaFinal,
        'PENDEJOALEJANDRO.estado': '😶‍🌫️', // O cualquier otro estado que definas
        pagado: "NO"
      });
  
      // Actualizar el cliente seleccionado en el estado de la aplicación
      setSelectedClient({
        ...selectedClient,
        fechaInicio: nuevaFechaInicio,  // Si tienes este campo en tu base de datos
        fechaFinal: nuevaFechaFinal,
        estado: '❌'
      });
  
      alert('El cliente no continuara con los servicios.');
      await handleSearch();  // Vuelve a realizar la búsqueda para refrescar la lista
      setSelectedClient(null);
    }
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
      // Obtener día, mes y año de la fecha actual del cliente
      const [day, month, year] = selectedClient.fechaFinal.split('/').map(Number);
  
      // Crear la fecha actual
      const fechaActual = new Date(year, month - 1, day);
  
      // Sumar un mes a la fecha actual
      fechaActual.setMonth(fechaActual.getMonth() + 1);
  
      // Comprobar si el mes cambió debido a un desbordamiento de días
      if (fechaActual.getDate() !== day) {
        fechaActual.setDate(0); // Retrocede al último día del mes anterior
      }
  
      // Formatear la nueva fecha final en formato 'dd/mm/yyyy'
      const nuevaFechaFinal = fechaActual.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
  
      // Calcular el nuevo estado del cliente
      const nuevoEstado = calcularEstadoCliente(nuevaFechaFinal);
  
      // Actualizar el documento en Firestore
      const clientRef = doc(firestore, 'clientes', selectedClient.id);
      await updateDoc(clientRef, {
        fechaFinal: nuevaFechaFinal,
        'PENDEJOALEJANDRO.estado': nuevoEstado,
        pagado: "SI"
      });
  
      // Actualizar el cliente seleccionado en el estado de la aplicación
      setSelectedClient({
        ...selectedClient,
        fechaFinal: nuevaFechaFinal,
        estado: nuevoEstado
      });
  
      // Mostrar un mensaje de alerta al usuario
      alert('La fecha de finalización ha sido renovada y el estado actualizado.');
      await handleSearch();
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
        setSelectedClient(null);
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
              <option value="😶‍🌫️">😶‍🌫️</option>
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
            <button onClick={handleNoContinuar}>No deseo continuar</button>
            <button onClick={handleGenerateComprobante}>Generar Comprobante</button>
          </div>
        )}

      </div>
    </div>
  );
}

export default Estados;
