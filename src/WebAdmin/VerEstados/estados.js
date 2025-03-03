import React, { useState, useEffect } from 'react';
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";
import { getFirestore, collection, query, where, getDocs, doc, updateDoc, increment, getDoc, writeBatch, addDoc } from 'firebase/firestore';
import { app } from '../../firebase';
import html2canvas from 'html2canvas';
import fondo from '../../fondo.png';
import './estados.css';
import { toast } from 'react-toastify'; // Asegúrate de instalar react-toastify
import { FaSyncAlt, FaTimes, FaFileAlt, FaDollarSign } from 'react-icons/fa';
import PaymentOverlay from '../metodosdepago/PaymentOverlay';

const firestore = getFirestore(app);


function Estados({ onClose }) {
  const [searchValue, setSearchValue] = useState('⚠️');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showPaymentOverlay, setShowPaymentOverlay] = useState(false); // New state for payment overlay
  const [paymentMethods, setPaymentMethods] = useState([]); // New state for payment methods

  // Agregar un listener para la tecla Esc
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose(); // Cerrar el modal
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Limpiar el listener cuando el componente se desmonta
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      const financeRef = collection(firestore, 'finance');
      const financeSnapshot = await getDocs(financeRef);
      const methods = financeSnapshot.docs
        .map(doc => doc.id)
        .filter(id => id !== 'AHORRO'); // Filter out 'AHORRO'
      setPaymentMethods(methods);
    };

    fetchPaymentMethods();
  }, []);


  
  const handleSearchValueChange = (event) => {
    setSearchValue(event.target.value);
  };

  const handleNoContinuar = async () => {
    if (selectedClient) {
      setShowConfirmationModal(true);
    }
  };

  const confirmNoContinuar = async () => {
    if (selectedClient) {
      const nuevaFechaFinal = '07/07/2003';
  
      const clientRef = doc(firestore, 'clientes', selectedClient.id);
      await updateDoc(clientRef, {
        fechaFinal: nuevaFechaFinal,
        'PENDEJOALEJANDRO.estado': '😶‍🌫️',
        pagado: "NO"
      });
  
      setSelectedClient({
        ...selectedClient,
        fechaFinal: nuevaFechaFinal,
        estado: '❌'
      });
  
      toast.success('El cliente no continuará con los servicios.', {
        autoClose: 2000
      });
      await handleSearch();
      setSelectedClient(null);
      setShowConfirmationModal(false);
    }
  };
  
  const cancelNoContinuar = () => {
    setShowConfirmationModal(false);
  };
  

  const searchByState = async (searchValue) => {
    try {
      const clientesRef = collection(firestore, 'clientes');
      const q = query(clientesRef, where('PENDEJOALEJANDRO.estado', '==', searchValue));
      const querySnapshot = await getDocs(q);
      let results = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          nombre: data.nombre,
          apellido: data.apellido,
          estado: data.PENDEJOALEJANDRO?.estado || '',
          fechaFinal: data.fechaFinal,
          ID: data.ID,
          telefono: data.telefono || '',
          servicio: data.servicio || [],
          grupo: data.grupo || [],
          precio: data.precio || [],
          ...data
        };
      });

      if (searchValue === '❌') {
        results = results.sort((a, b) => {
          const [dayA, monthA, yearA] = a.fechaFinal.split('/').map(Number);
          const [dayB, monthB, yearB] = b.fechaFinal.split('/').map(Number);
          const dateA = new Date(yearA, monthA - 1, dayA);
          const dateB = new Date(yearB, monthB - 1, dayB);
          return dateB - dateA;
        });
      } else if (searchValue === '⚠️') {
        results = results.sort((a, b) => {
          const [dayA, monthA, yearA] = a.fechaFinal.split('/').map(Number);
          const [dayB, monthB, yearB] = b.fechaFinal.split('/').map(Number);
          const dateA = new Date(yearA, monthA - 1, dayA);
          const dateB = new Date(yearB, monthB - 1, dayB);
          const diffA = Math.ceil((dateA - new Date()) / (1000 * 60 * 60 * 24));
          const diffB = Math.ceil((dateB - new Date()) / (1000 * 60 * 60 * 24));
          return diffA - diffB;
        });
      } else if (searchValue === '✅') {
        results = results.sort((a, b) => {
          const [dayA, monthA, yearA] = a.fechaFinal.split('/').map(Number);
          const [dayB, monthB, yearB] = b.fechaFinal.split('/').map(Number);
          const dateA = new Date(yearA, monthA - 1, dayA);
          const dateB = new Date(yearB, monthB - 1, dayB);
          const diffA = Math.abs(Math.ceil((dateA - new Date()) / (1000 * 60 * 60 * 24)) - 2);
          const diffB = Math.abs(Math.ceil((dateB - new Date()) / (1000 * 60 * 60 * 24)) - 2);
          return diffA - diffB;
        });
      }

      setSearchResults(results);
    } catch (error) {
      console.error('Error al buscar clientes por estado:', error);
    }
  };

  const handleSearch = async () => {
    await searchByState(searchValue);
  };

  const serviceDivisions = {
    YOUTUBE: 6,
    DISNEY: 7,
    MAX: 5,
    PRIMEVIDEO: 6,
    SPOTIFY: 6,
    PARAMOUNT: 6,
    CRUNCHY: 5
  };

  const handleSelectClient = async (client) => {
    setSelectedClient(client);
  
    if (client.servicio.length > 0 && client.grupo.length > 0) {
      const servicios = client.servicio; // Obtener todos los servicios del cliente
      let valoresServicios = [];
      let valoresPorCliente = [];
  
      const netflixPackages = {
        'PREMIUM4K+HDR+2MIEMBROSEXTRAS': 7,
        'PREMIUM4K+HDR': 5,
        'ESTÁNDAR+1MIEMBROEXTRA': 3,
        'ESTÁNDAR': 2
      };
  
      try {
        for (const servicioId of servicios) {
          let servicioDocId = servicioId;
          if (servicioId === 'NETFLIX' || servicioId === 'NETFLIXME' || servicioId === 'NETFLIXTV') {
            servicioDocId = 'NETFLIX,NETFLIXTV,NETFLIXME';
          }
  
          const servicioRef = doc(firestore, 'Servicios', servicioDocId);
          const servicioDoc = await getDoc(servicioRef);
  
          if (servicioDoc.exists()) {
            const grupoId = client.grupo[client.servicio.indexOf(servicioId)];
            const grupoData = servicioDoc.data()[grupoId];
            if (grupoData && grupoData.price) {
              let divisionFactor = serviceDivisions[servicioId] || 1;
              if (servicioId === 'NETFLIX' || servicioId === 'NETFLIXME' || servicioId === 'NETFLIXTV') {
                const packageType = grupoData.package;
                divisionFactor = netflixPackages[packageType] || divisionFactor;
              }
              let valorPorCliente = grupoData.price / divisionFactor;
              // Redondear al siguiente múltiplo de 100
              valorPorCliente = Math.ceil(valorPorCliente / 100) * 100;
              valoresServicios.push(grupoData.price);
              valoresPorCliente.push(valorPorCliente);
            }
          }
        }
  
        setSelectedClient({
          ...client,
          valoresServicios,
          valoresPorCliente
        });
  
        // Fetch clients in the same group and service position excluding those with state 😶‍🌫️
        const clientesRef = collection(firestore, 'clientes');
        const q = query(clientesRef, where('grupo', 'array-contains-any', client.grupo));
        const querySnapshot = await getDocs(q);
        const clientsInGroup = querySnapshot.docs
          .filter(doc => {
            const data = doc.data();
            return data.PENDEJOALEJANDRO?.estado !== '😶‍🌫️' && client.grupo.some(grupoId => data.grupo.includes(grupoId));
          })
          .map(doc => doc.data().nombre)
          .join(', ');
  
        setSelectedClient(prevState => ({
          ...prevState,
          clientsInGroup
        }));
      } catch (error) {
        console.error('Error fetching service value or clients in group:', error);
      }
    }
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
      setShowPaymentOverlay(true); // Show payment overlay when renewing
    }
  };

  const registrarMovimiento = async (id, tipo, monto, metodoPago, descripcion) => {
    const movimientosRef = collection(firestore, 'Movimientos');
    await addDoc(movimientosRef, {
      tipo,
      monto,
      metodoPago,
      timestamp: new Date(),
      descripcion
    });
  };

  const handlePaymentMethodSelect = async (method) => {
    if (selectedClient) {
      const [day, month, year] = selectedClient.fechaFinal.split('/').map(Number);
      const fechaActual = new Date(year, month - 1, day);
      fechaActual.setMonth(fechaActual.getMonth() + 1);
      if (fechaActual.getDate() !== day) {
        fechaActual.setDate(0);
      }
  
      const nuevaFechaFinal = fechaActual.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
  
      const nuevoEstado = calcularEstadoCliente(nuevaFechaFinal);
      const totalAmount = selectedClient.precio.reduce((acc, curr) => acc + Number(curr), 0);
      const totalPorCliente = selectedClient.valoresPorCliente.reduce((acc, curr) => acc + curr, 0);
      const valorAhorro = totalAmount - totalPorCliente;
  
      const clientRef = doc(firestore, 'clientes', selectedClient.id);
      await updateDoc(clientRef, {
        fechaFinal: nuevaFechaFinal,
        'PENDEJOALEJANDRO.estado': nuevoEstado,
      });
  
      const paymentMethodRef = doc(firestore, 'finance', method);
      await updateDoc(paymentMethodRef, {
        IngresosBrutos: increment(totalAmount),
        GastosOperativos: increment(totalPorCliente),
        UtilidadNeta: increment(valorAhorro)
      });
  
      const ahorroRef = doc(firestore, 'finance', 'AHORRO');
      const currentDate = new Date();
      const formattedDate = `${currentDate.getDate()}-${currentDate.getMonth() + 1}-${currentDate.getFullYear()}`;
      await updateDoc(ahorroRef, {
        [`${formattedDate}.GananciasNetas`]: increment(valorAhorro)
      });
  
      // Cambiar el valor del campo pagado de NO a SI para el cliente seleccionado
      await actualizarClientePagado(selectedClient.id);
  
      await registrarMovimiento(
        selectedClient.id,
        'Ingreso',
        totalAmount,
        method,
        `Pago de mensualidad de ${selectedClient.nombre} ${selectedClient.apellido}`
      );

      setSelectedClient({
        ...selectedClient,
        fechaFinal: nuevaFechaFinal,
        estado: nuevoEstado,
      });
  
      toast.success('La fecha de finalización ha sido renovada y el estado actualizado.', {
        autoClose: 2000
      });
      await handleSearch();
      setShowPaymentOverlay(false); // Hide payment overlay after selection
    }
  };
  
  const actualizarClientePagado = async (clienteId) => {
    const clienteRef = doc(firestore, 'clientes', clienteId);
    const clienteDoc = await getDoc(clienteRef);
    const data = clienteDoc.data();
    const pagado = data.pagado || [];
  
    const updatedPagado = pagado.map(() => 'SI');
  
    await updateDoc(clienteRef, { pagado: updatedPagado });
  };
  

  // Función para formatear el precio
const formatPrice = (price) => {
  const priceStr = price.toString();

  // Si el precio tiene exactamente 4 caracteres
  if (priceStr.length === 4) {
    return `$ ${priceStr.slice(0, 1)}.${priceStr.slice(1)}`;
  }

  // Si el precio tiene más de 4 caracteres, usamos el formato de miles estándar
  return `$ ${new Intl.NumberFormat('es-ES').format(price)}`;
};

const handleGenerateComprobante = async () => {
  if (selectedClient) {
    const servicios = Array.isArray(selectedClient.servicio) ? selectedClient.servicio : [];
    const grupo = Array.isArray(selectedClient.grupo) ? selectedClient.grupo : [];
    const precios = Array.isArray(selectedClient.precio) ? selectedClient.precio.map(Number) : [];
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
      const clientFolder = selectedClient.ID; // Usamos el ID del cliente como nombre de la carpeta

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
      toast('Comprobante copiado al portapapeles', { autoClose: 2000 });

      document.body.removeChild(comprobanteContainer);
      setSelectedClient(null);
    });
  }
};

const handleCobrar = async () => {
  if (selectedClient) {
    const nombreCliente = selectedClient.nombre.charAt(0).toUpperCase() + selectedClient.nombre.slice(1).toLowerCase();
    let servicios = selectedClient.servicio.map(servicio => {
      if (servicio === 'NETFLIXME') {
        return 'NETFLIXTV';
      } else if (servicio === 'NETFLIX') {
        return 'NETFLIXSINTV';
      }
      return servicio;
    }).join(', ') || 'Ninguno';
    
    const [day, month, year] = selectedClient.fechaFinal.split('/');
    const fechaFinal = new Date(year, month - 1, day);
    const fechaActual = new Date();
    const diasRestantes = Math.ceil((fechaFinal - fechaActual) / (1000 * 60 * 60 * 24));
    const totalAPagar = formatPrice(selectedClient.precio.reduce((acc, curr) => acc + Number(curr), 0));

    let mensaje = `*¡Hola, ${nombreCliente}!* 😊\n\n¿Cómo estás? Espero que todo vaya genial y que estés teniendo un excelente día. 💪🌟\n\n`;

    if (diasRestantes > 1) {
      mensaje += `Te quedan *${diasRestantes} días* de tus servicios de *${servicios}*. 🕒✨ No olvides realizar el pago para seguir disfrutando de tus servicios. 🎥🎶`;
    } else if (diasRestantes === 1) {
      mensaje += `Te queda *1 día* de tu servicio de *${servicios}*. 🕒✨ No olvides realizar el pago para seguir disfrutando de tus servicios. 🎥🎶`;
    } else if (diasRestantes === 0) {
      mensaje += `Hoy se vencen tus servicios de *${servicios}*. 🕒⚠️ ¡Recuerda realizar el pago para evitar interrupciones! 🎥🎶`;
    } else {
      mensaje += `*Los servicios de ${servicios} ya se han vencido*. 🕒⚠️ Por favor, realiza el pago lo antes posible. 🎥🎶`;
    }

    mensaje += `\n\nEl total a pagar es: *${totalAPagar}*.\n\nSi necesitas ayuda con algo, no dudes en decirme. ¡Que tengas un día increíble! 😊❤️`;

    try {
      await navigator.clipboard.writeText(mensaje);
      toast('Cobro copiado al portapapeles', { autoClose: 2000 });
    } catch (error) {
      console.error('Error al copiar el mensaje al portapapeles:', error);
      toast.error('Hubo un error al copiar el mensaje');
    }
  } else {
    toast.warning('Por favor, selecciona un cliente');
  }
};
  
  
  
  
  

  return (
    <div className="estado-modal-overlay" onClick={onClose}>
      <div className="estado-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="estado-boton-cerrar" onClick={onClose}>X</button>
        <div className="estado-search-container">
          <h1>Ver Estados</h1>
          <div className="estado-search-controls">
            <select value={searchValue} onChange={handleSearchValueChange} className="estado-search-select">
              <option value="⚠️">⚠️</option>
              <option value="❌">❌</option>
              <option value="✅">✅</option>
              <option value="😶‍🌫️">😶‍🌫️</option>
            </select>
            <button className="estado-search-button" onClick={handleSearch}>Buscar</button>
          </div>
          <div className="estado-search-results">
            {searchResults.length > 0 ? (
              <ul>
                {searchResults.map((result) => (
                  <li key={result.id} className="estado-estatusmod">
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
  <div className="estado-client-details">
    <h2>Detalles del Cliente</h2>
    <div>ID: {selectedClient.ID}</div>
    <div>Nombre: {selectedClient.nombre} {selectedClient.apellido}</div>
    <div>Estado: {selectedClient.estado}</div>
    <div>Fecha Final: {selectedClient.fechaFinal}</div>
    <div>Servicios a vencer: {Array.isArray(selectedClient.servicio) ? selectedClient.servicio.join(', ') : 'Ninguno'}</div>
    <div>Valor del servicio: {Array.isArray(selectedClient.valoresServicios) ? selectedClient.valoresServicios.map(formatPrice).join(', ') : 'No disponible'}</div>
    <div>Valor a pagar por cliente: {Array.isArray(selectedClient.valoresPorCliente) ? selectedClient.valoresPorCliente.map(formatPrice).join(', ') : 'No disponible'}</div>
    <div>Grupos: {Array.isArray(selectedClient.grupo) ? selectedClient.grupo.join(', ') : 'Ninguno'}</div>
    <div>
      Precios: {Array.isArray(selectedClient.precio) ? (
        <>
          {selectedClient.precio.map((precio, index) => (
            <span key={index}>
              {index > 0 ? ', ' : ''}{formatPrice(precio)}
            </span>
          ))}
          <br />
          <br />
          <strong>Total a Pagar: {formatPrice(selectedClient.precio.reduce((acc, curr) => acc + Number(curr), 0))}</strong>
        </>
      ) : 'Sin precios'}
    </div>
    <div>
      <strong>Total a Pagar por Cliente: {selectedClient.valoresPorCliente ? formatPrice(selectedClient.valoresPorCliente.reduce((acc, curr) => acc + curr, 0)) : 'No disponible'}</strong>
    </div>
    <div className="button-container">
      <button onClick={handleRenew}><FaSyncAlt /> Renovar</button>
      <button onClick={handleNoContinuar}><FaTimes /> No deseo continuar</button>
      <button onClick={handleGenerateComprobante}><FaFileAlt /> Generar Comprobante</button>
      <button className='estado-button-cobrar' onClick={handleCobrar}><FaDollarSign /> Cobrar</button>
    </div>
  </div>
)}

      {showConfirmationModal && (
        <div className="confirmation-modal-overlay">
          <div className="confirmation-modal-content">
            <h2>¿El cliente desea cancelar el servicio? 💀</h2>
            <div className="confirmation-modal-buttons">
              <button className="no-button" onClick={cancelNoContinuar}>No, Quiero Continuar</button>
              <button className="yes-button" onClick={confirmNoContinuar}>Sí, Deseo Cancelarlo</button>
              
            </div>
          </div>
        </div>
      )}

      {showPaymentOverlay && (
        <PaymentOverlay
          paymentMethods={paymentMethods}
          onSelect={handlePaymentMethodSelect}
          onClose={() => setShowPaymentOverlay(false)}
        />
      )}

      </div>
    </div>
  );
}

export default Estados;
