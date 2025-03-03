import { toast } from 'react-toastify'; 
import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, doc, deleteDoc, addDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../../firebase'; // Asegúrate de tener la configuración de Firestore en firebase.js
import './notificaciones.css'; // Estilos para el modal
import { FaCheck, FaTimes, FaTrashAlt, FaRecycle } from 'react-icons/fa'; // Import icons from react-icons
import PaymentOverlay from '../metodosdepago/PaymentOverlay'; // Import PaymentOverlay component

const Notificaciones = ({ onClose }) => {
  const [pedidos, setPedidos] = useState([]);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null); // Estado para el pedido seleccionado
  const [pedidoIdDocumento, setPedidoIdDocumento] = useState(''); // Nuevo estado para guardar el ID del documento del pedido
  const [toastMessage, setToastMessage] = useState(''); // Estado para el mensaje del toast
  const [isToastVisible, setIsToastVisible] = useState(false); // Estado para mostrar el toast
  const [showPaymentOverlay, setShowPaymentOverlay] = useState(false); // New state for payment overlay
  const [paymentMethods, setPaymentMethods] = useState([]); // New state for payment methods

  // Pedir permiso para mostrar notificaciones
  const requestNotificationPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        // ...existing code...
      } else {
        // ...existing code...
      }
    } catch (error) {
      console.error("Error al solicitar permiso para notificaciones:", error);
    }
  };

  // Obtener pedidos desde Firestore
  useEffect(() => {
    requestNotificationPermission();
    fetchPedidos();
    fetchPaymentMethods(); // Fetch payment methods on component mount
    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, []);

  // Fetch payment methods from Firestore
  const fetchPaymentMethods = async () => {
    const financeRef = collection(db, 'finance');
    const financeSnapshot = await getDocs(financeRef);
    const methods = financeSnapshot.docs
      .map(doc => doc.id)
      .filter(id => id !== 'AHORRO'); // Filter out 'AHORRO'
    setPaymentMethods(methods);
  };

  // Función para generar ID con formato de 5 dígitos
  const generateId = (maxId) => {
    const newId = (maxId + 1).toString().padStart(5, '0');
    return newId;
  };

  // Función para obtener el ID más grande de la colección 'clientes'
  const obtenerNuevoID = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'clientes'));
      let maxID = 0;

      querySnapshot.forEach((doc) => {
        const clienteID = parseInt(doc.data().ID, 10); // Suponiendo que el campo es 'ID'
        if (clienteID > maxID) {
          maxID = clienteID;
        }
      });

      return generateId(maxID); // Generar el nuevo ID con formato
    } catch (error) {
      console.error('Error obteniendo el nuevo ID: ', error);
      return null;
    }
  };

  // Función para convertir la fecha al formato yyyy-mm-dd
  const convertDateToInputFormat = (date) => {
    if (!date) return '';
    const [day, month, year] = date.split('/');
    return `${year}-${month}-${day}`;
  };

  // Función para seleccionar un pedido y mostrar los detalles
  const handleVerPedido = async (pedido) => {
    if (pedido.renovacion) {
      setPedidoSeleccionado({
        ...pedido,
        id: pedido.clienteId, // Usar el clienteId como ID del cliente en caso de renovación
        fechaInicial: convertDateToInputFormat(pedido.fechaInicial), // Convertir fecha inicial a formato yyyy-mm-dd
        fechaFinal: convertDateToInputFormat(pedido.fechaFinal), // Convertir fecha final a formato yyyy-mm-dd
      });
    } else {
      const nuevoID = await obtenerNuevoID();
      setPedidoSeleccionado({
        ...pedido,
        id: nuevoID || '', // Establecer el nuevo ID o dejar en blanco si hay error
      });
    }

    // Guardar el ID del documento del pedido en la variable 'pedidoIdDocumento'
    setPedidoIdDocumento(pedido.id); // Aquí guardamos el ID del documento
  };

  // Función para cerrar el modal de detalles
  const handleCerrarDetalle = () => {
    setPedidoSeleccionado(null); // Cerrar el modal de detalles
  };

  // Función para manejar cambios en los inputs del formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setPedidoSeleccionado((prevState) => ({
      ...prevState,
      [name]: name === 'precio' ? value.split(',').map(item => item.trim()) : value,
    }));

    // Si se cambia la fecha inicial y no es una renovación, calcular la fecha final automáticamente
    if (name === 'fechaInicial' && !pedidoSeleccionado.renovacion) {
      const fechaInicial = new Date(value);
      const fechaFinal = new Date(fechaInicial.setMonth(fechaInicial.getMonth() + 1));
      setPedidoSeleccionado((prevState) => ({
        ...prevState,
        fechaFinal: fechaFinal.toISOString().split('T')[0], // Convertir a formato YYYY-MM-DD
      }));
    }
  };

  // Función para activar un cliente (crear si no existe)
  const formatDate = (date) => {
    if (!date) return '';
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year}`;
  };

  // Función para activar un cliente (crear si no existe)
  const handleActivarCliente = async () => {
    if (pedidoSeleccionado) {
      setShowPaymentOverlay(true); // Show payment overlay when activating client
    }
  };

  // ...existing code...
const handlePaymentMethodSelect = async (method) => {
  if (pedidoSeleccionado) {
    const {
      id, // Este es el ID del cliente que está en el input
      nombre,
      apellido,
      telefono,
      email,
      fechaInicial,
      fechaFinal,
      grupo,
      servicio, // Ahora servicio será un array de strings
      notas, // Ahora es un array
      precio, // Ahora es un array de strings
      clienteDocId, // ID del documento del cliente
      pagado, // Array de valores pagado
    } = pedidoSeleccionado;

    // Aplicamos el formato de fecha a fechaInicial y fechaFinal
    const fechaInicialFormateada = formatDate(fechaInicial);
    const fechaFinalFormateada = formatDate(fechaFinal);

    try {
      if (pedidoSeleccionado.renovacion) {
        // Crear un nuevo documento con el ID del documento guardado en la colección 'clientes'
        const clienteRef = doc(db, 'clientes', clienteDocId);
        await setDoc(clienteRef, {
          nombre: nombre || '',
          apellido: apellido || '',
          telefono: telefono || '',
          email: email || '',
          fechaInicial: fechaInicialFormateada || '', // Fecha inicial formateada
          fechaFinal: fechaFinalFormateada || '', // Fecha final formateada
          pagado: servicio.map(() => 'SI'), // Campo pagado como array con "SI" para cada servicio
          grupo: Array.isArray(grupo) ? grupo.map(g => g.toUpperCase()) : [grupo.toUpperCase()] || [], // Convertir a mayúsculas
          servicio: Array.isArray(servicio) ? servicio.map(s => String(s)) : [String(servicio)] || [], // Aseguramos que 'servicio' sea un array de strings
          notas: Array.isArray(notas) ? notas.map(nota => nota.toUpperCase()) : [notas.toUpperCase()] || [], // Aseguramos que 'notas' sea un array y en mayúsculas
          precio: Array.isArray(precio) ? precio.map(p => String(p)) : [String(precio)] || [], // Aseguramos que 'precio' sea un array de strings
          PENDEJOALEJANDRO: { 
            estado: '✅', // Estado fijo siempre "✅"
          },
          ID: id, // Guardar el ID del cliente dentro del documento
        });

        // Mostrar el toast de éxito cuando el cliente es renovado
        toast.success('¡Cliente renovado exitosamente!', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: true,
        });
      } else {
        // Crear un nuevo documento con ID aleatorio en la colección 'clientes'
        const clienteRef = await addDoc(collection(db, 'clientes'), {
          nombre: nombre || '',
          apellido: apellido || '',
          telefono: telefono || '',
          email: email || '',
          fechaInicial: fechaInicialFormateada || '', // Fecha inicial formateada
          fechaFinal: fechaFinalFormateada || '', // Fecha final formateada
          pagado: ['SI'], // Campo pagado como array con "SI" como elemento inicial
          grupo: Array.isArray(grupo) ? grupo.map(g => g.toUpperCase()) : [grupo.toUpperCase()] || [], // Convertir a mayúsculas
          servicio: Array.isArray(servicio) ? servicio.map(s => String(s)) : [String(servicio)] || [], // Aseguramos que 'servicio' sea un array de strings
          notas: Array.isArray(notas) ? notas.map(nota => nota.toUpperCase()) : [notas.toUpperCase()] || [], // Aseguramos que 'notas' sea un array y en mayúsculas
          precio: Array.isArray(precio) ? precio.map(p => String(p)) : [String(precio)] || [], // Aseguramos que 'precio' sea un array de strings
          PENDEJOALEJANDRO: { 
            estado: '✅', // Estado fijo siempre "✅"
          },
          ID: id, // Guardar el ID del cliente dentro del documento
        });

        // Mostrar el toast de éxito cuando el cliente es activado
        toast.success('¡Cliente activado exitosamente!', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: true,
        });
      }

      // Update the payment method balance
      const totalAmount = precio.reduce((acc, curr) => acc + Number(curr), 0);
      const gastosOperativos = totalAmount * 0.7;
      const utilidadNeta = totalAmount * 0.3;

      const paymentMethodRef = doc(db, 'finance', method);
      await updateDoc(paymentMethodRef, {
        IngresosBrutos: increment(totalAmount),
        GastosOperativos: increment(gastosOperativos),
        UtilidadNeta: increment(utilidadNeta)
      });

      const ahorroRef = doc(db, 'finance', 'AHORRO');
      const currentDate = new Date();
      const formattedDate = `${currentDate.getDate()}-${currentDate.getMonth() + 1}-${currentDate.getFullYear()}`;
      await updateDoc(ahorroRef, {
        [`${formattedDate}.GananciasNetas`]: increment(utilidadNeta)
      });

      // Verifica si la ID del pedido es válida antes de intentar eliminarlo
      if (pedidoIdDocumento) {
        // Ahora eliminamos el pedido de la colección 'notificaciones' usando la ID previamente guardada
        const pedidoRef = doc(db, 'notificaciones', pedidoIdDocumento);
        await deleteDoc(pedidoRef);
      } else {
        console.error('No se pudo obtener la ID del pedido para eliminarlo');
      }

      // Limpiar los detalles del pedido
      setPedidoSeleccionado(null);

      // Recargar la lista de pedidos
      await fetchPedidos();

    } catch (error) {
      console.error('Error activando/actualizando el cliente: ', error);
      toast.error('Hubo un error al activar el cliente.', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: true,
      });
    }
  }
  setShowPaymentOverlay(false); // Hide payment overlay after selection
};
// ...existing code...

  // Función para obtener pedidos ordenados por timestamp
  const fetchPedidos = async () => {
    try {
      // Crea una consulta que ordena los documentos por el campo 'timestamp' en orden descendente
      const pedidosQuery = query(
        collection(db, 'notificaciones'),
        orderBy('timestamp', 'desc') // Ordenar por 'timestamp' de más reciente a más antiguo
      );

      // Obtén todos los documentos de la colección 'notificaciones' con la consulta ordenada
      const querySnapshot = await getDocs(pedidosQuery);
      const pedidosArray = [];
      
      querySnapshot.forEach((doc) => {
        // Excluir documentos cuyo ID sea 'pedidoIdDocumento' o 'ajua'
        if (doc.id === pedidoIdDocumento || doc.id === 'hola') {
          return; // No se agrega a la lista
        }
        
        // Si el ID no coincide, agregamos el documento a la lista de pedidos
        pedidosArray.push({ id: doc.id, ...doc.data() });
      });

      // Actualizamos el estado con la lista de pedidos filtrados y ordenados
      setPedidos(pedidosArray);
    } catch (error) {
      console.error('Error obteniendo los pedidos:', error);
    }
  };

  const handleCancelarPedido = async () => {
    if (pedidoIdDocumento) {  // Verifica que haya un pedido seleccionado
      try {
        // Referencia al documento en la colección 'notificaciones' usando el ID
        const pedidoRef = doc(db, 'notificaciones', pedidoIdDocumento);
  
        // Elimina el documento
        await deleteDoc(pedidoRef);
  
        // Limpiar el estado del pedido
        setPedidoSeleccionado(null);
  
        // Recargar la lista de pedidos
        await fetchPedidos();
  
        // Mostrar el toast de éxito al cancelar el pedido
        toast.success('¡Pedido cancelado exitosamente!', {
          position: "top-right",  // Posición del mensaje
          autoClose: 3000,  // Duración del mensaje
          hideProgressBar: true,  // Opcional: para ocultar la barra de progreso
        });
        
      } catch (error) {
        console.error('Error cancelando el pedido: ', error);
  
        // Mostrar el toast de error si algo falla
        toast.error('Hubo un error al cancelar el pedido.', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: true,
        });
      }
    } else {
      console.error('No se seleccionó un pedido válido para cancelar.');
      toast.error('No se seleccionó un pedido válido para cancelar.', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: true,
      });
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('notificaciones-modal-overlay')) {
      onClose(); // Cierra el modal cuando se hace clic en el overlay
    }
  };

  // Función para manejar la tecla ESC
  const handleEscKey = (event) => {
    if (event.key === "Escape") {
      onClose();
    }
  };

  const handleAddOneMonth = () => {
    if (pedidoSeleccionado && pedidoSeleccionado.fechaFinal) {
      const fechaFinal = new Date(pedidoSeleccionado.fechaFinal);
      fechaFinal.setMonth(fechaFinal.getMonth() + 1);
      setPedidoSeleccionado((prevState) => ({
        ...prevState,
        fechaFinal: fechaFinal.toISOString().split('T')[0], // Convertir a formato YYYY-MM-DD
      }));

      // Añadir la clase highlight al input de fecha final
      const fechaFinalInput = document.querySelector('input[name="fechaFinal"]');
      if (fechaFinalInput) {
        fechaFinalInput.classList.add('highlight');
        setTimeout(() => {
          fechaFinalInput.classList.remove('highlight');
        }, 1500); // Remover la clase después de 1.5 segundos
      }
    }
  };

  return (
    <div className="notificaciones-modal-overlay" onClick={handleOverlayClick}>
      <div className="notificaciones-modal-content">
        <div className="notificaciones-lista-pedidos">
          <h2>Lista de Pedidos</h2>
          {pedidos.length > 0 ? (
            <ul>
              {pedidos
                .filter((pedido) => pedido.id !== 'hola') // Filtra los pedidos con id 'hola'
                .map((pedido) => (
                  <li 
                    key={pedido.id} 
                    className={`notificaciones-pedido-item ${pedido.compra ? 'notificaciones-compra' : 'notificaciones-renovacion'}`}>
                    <div>
                      <strong>{pedido.nombre} {pedido.apellido}</strong>
                      <span className={`notificaciones-label ${pedido.compra ? 'notificaciones-compra' : 'notificaciones-renovacion'}`}>
                        {pedido.compra ? 'COMPRA' : 'RENOVACIÓN'}
                      </span>
                    </div>
                    <button onClick={() => handleVerPedido(pedido)} className="notificaciones-ver-pedido-btn">
                      Ver Pedido
                    </button>
                  </li>
                ))}
            </ul>
          ) : (
            <p>No hay pedidos pendientes.</p>
          )}
        </div>
  
        <div className="notificaciones-pedido-detalles">
          {pedidoSeleccionado && (
            <div className="notificaciones-pedido-detalle-modal">
              <h3>Detalles del Pedido</h3>
              <p>
                <strong>ID:</strong>
                <input
                  type="text"
                  name="id"
                  value={pedidoSeleccionado.id || ''} // Mostrar el ID generado por Firestore
                  onChange={handleChange}
                  className="notificaciones-detail-inputxnon-editable"
                  placeholder="ID"
                  readOnly
                  disabled
                />
              </p>
              <p>
                <strong>Nombre:</strong>
                <input
                  type="text"
                  name="nombre"
                  value={pedidoSeleccionado.nombre || ''}
                  onChange={handleChange}
                  className="notificaciones-detail-inputxnon-editable"
                  placeholder="Nombre"
                  disabled
                />
              </p>
              <p>
                <strong>Apellido:</strong>
                <input
                  type="text"
                  name="apellido"
                  value={pedidoSeleccionado.apellido || ''}
                  onChange={handleChange}
                  className="notificaciones-detail-inputxnon-editable"
                  placeholder="Apellido"
                  disabled
                />
              </p>
              <p>
                <strong>Teléfono:</strong>
                <input
                  type="text"
                  name="telefono"
                  value={pedidoSeleccionado.telefono || ''}
                  onChange={handleChange}
                  className="notificaciones-detail-inputxnon-editable"
                  placeholder="Teléfono"
                  disabled
                />
              </p>
              <p>
                <strong>Email:</strong>
                <input
                  type="email"
                  name="email"
                  value={pedidoSeleccionado.email || ''}
                  onChange={handleChange}
                  disabled
                  className="notificaciones-detail-inputxnon-editable"
                  placeholder="Email"
                />
              </p>
              <p>
                <strong>Fecha Inicial:</strong>
                <input
                  type="date"
                  name="fechaInicial"
                  value={pedidoSeleccionado.fechaInicial || ''}
                  onChange={handleChange}
                  className="notificaciones-detail-input"
                />
              </p>
              <p>
                <strong>Fecha Final:</strong>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type="date"
                    name="fechaFinal"
                    value={pedidoSeleccionado.fechaFinal || ''}
                    readOnly
                    className="notificaciones-detail-input"
                    style={{ flex: 1 }}
                  />
                  <button onClick={handleAddOneMonth} className="notificaciones-recycle-btn">
                    <FaRecycle />
                  </button>
                </div>
              </p>
              <p>
                <strong>Estado:</strong>
                <input
                  type="text"
                  name="estado"
                  value={pedidoSeleccionado.estado || '✅'}
                  readOnly
                  disabled
                  className="notificaciones-detail-inputxnon-editable"
                  placeholder="Estado"
                />
              </p>
              <p>
                <strong>Grupo:</strong>
                <input
                  type="text"
                  name="grupo"
                  value={pedidoSeleccionado.grupo || ''}
                  onChange={handleChange}
                  className="notificaciones-detail-input"
                  placeholder="Grupo"
                />
              </p>
              <p>
                <strong>Servicio:</strong>
                <input
                  type="text"
                  name="servicio"
                  value={pedidoSeleccionado.servicio || ''}
                  onChange={handleChange}
                  className="notificaciones-detail-input"
                  placeholder="Servicio"
                />
              </p>
              <p>
                <strong>Notas:</strong>
                <textarea
                  name="notas"
                  value={pedidoSeleccionado.notas || ''}
                  onChange={handleChange}
                  className="notificaciones-detail-input"
                  placeholder="Notas"
                />
              </p>
              <p>
                <strong>Precio:</strong>
                <input
                  type="text"
                  name="precio"
                  value={pedidoSeleccionado.precio || ''}
                  onChange={handleChange}
                  className="notificaciones-detail-input"
                  placeholder="Precio"
                />
              </p>
              <div className="notificaciones-botones-container">
                <button onClick={handleActivarCliente} className="notificaciones-activar-btn">
                  <FaCheck /> Activar Cliente
                </button>
                <button onClick={handleCerrarDetalle} className="notificaciones-cerrar-btn">
                  <FaTimes /> Cerrar
                </button>
                <button onClick={handleCancelarPedido} className="notificaciones-cancelar-btn">
                  <FaTrashAlt /> Cancelar Pedido
                </button>
              </div>
            </div>
          )}
        </div>
  
        {/* Toast Notification */}
        {isToastVisible && (
          <div className="notificaciones-toast-message">
            {toastMessage}
          </div>
        )}
  
        {/* Botón para cerrar el overlay */}
        <button onClick={onClose} className="notificaciones-cerrar-overlay-btn">
          X
        </button>

        {/* Payment Overlay */}
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

};

export default Notificaciones;