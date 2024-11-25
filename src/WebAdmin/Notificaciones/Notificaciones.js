import { toast } from 'react-toastify'; // Importa el toast para mostrar el mensaje
import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { db, messaging } from '../../firebase'; // Asegúrate de tener la configuración de Firestore en firebase.js
import './notificaciones.css'; // Estilos para el modal

const Notificaciones = ({ onClose }) => {
  const [pedidos, setPedidos] = useState([]);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null); // Estado para el pedido seleccionado
  const [pedidoIdDocumento, setPedidoIdDocumento] = useState(''); // Nuevo estado para guardar el ID del documento del pedido
  const [toastMessage, setToastMessage] = useState(''); // Estado para el mensaje del toast
  const [isToastVisible, setIsToastVisible] = useState(false); // Estado para mostrar el toast

    // Pedir permiso para mostrar notificaciones
const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      console.log("Permiso para notificaciones concedido.");
    } else {
      console.log("Permiso para notificaciones denegado.");
    }
  } catch (error) {
    console.error("Error al solicitar permiso para notificaciones:", error);
  }
};


  

  // Obtener pedidos desde Firestore
  useEffect(() => {
    requestNotificationPermission();
    const fetchPedidos = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'notificaciones'));
        const pedidosArray = [];
        querySnapshot.forEach((doc) => {
          pedidosArray.push({ id: doc.id, ...doc.data() });
        });
        setPedidos(pedidosArray); // Almacena los pedidos en el estado
      } catch (error) {
        console.error('Error obteniendo los pedidos: ', error);
      }
    };

    fetchPedidos();
  }, []);

  

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

  // Función para seleccionar un pedido y mostrar los detalles
  const handleVerPedido = async (pedido) => {
    const nuevoID = await obtenerNuevoID();
    setPedidoSeleccionado({
      ...pedido,
      id: nuevoID || '', // Establecer el nuevo ID o dejar en blanco si hay error
    });

    // Guardar el ID del documento del pedido en la variable 'pedidoIdDocumento'
    setPedidoIdDocumento(pedido.id); // Aquí guardamos el ID del documento
    console.log('ID del documento del pedido:', pedido.id); // Imprimir en consola
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
      [name]: value,
    }));

    // Si se cambia la fecha inicial, calcular la fecha final automáticamente
    if (name === 'fechaInicial') {
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

// Función para activar un cliente (crear si no existe)
  const handleActivarCliente = async () => {
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
        estado, // Extraemos el campo estado para incluirlo en PENDEJOALEJANDRO
      } = pedidoSeleccionado;

      // Aplicamos el formato de fecha a fechaInicial y fechaFinal
      const fechaInicialFormateada = formatDate(fechaInicial);
      const fechaFinalFormateada = formatDate(fechaFinal);

      // Guardar la ID del documento en la colección 'notificaciones' antes de crear el cliente
      const pedidoId = pedidoSeleccionado.id;

      try {
        // Crear un nuevo documento con ID aleatorio en la colección 'clientes'
        const clienteRef = await addDoc(collection(db, 'clientes'), {
          nombre: nombre || '',
          apellido: apellido || '',
          telefono: telefono || '',
          email: email || '',
          fechaInicial: fechaInicialFormateada || '', // Fecha inicial formateada
          fechaFinal: fechaFinalFormateada || '', // Fecha final formateada
          pagado: 'SI', // Campo pagado con valor fijo 'SI'
          grupo: Array.isArray(grupo) ? grupo.map(g => g.toUpperCase()) : [grupo.toUpperCase()] || [], // Convertir a mayúsculas
          servicio: Array.isArray(servicio) ? servicio.map(s => String(s)) : [String(servicio)] || [], // Aseguramos que 'servicio' sea un array de strings
          notas: Array.isArray(notas) ? notas.map(nota => nota.toUpperCase()) : [notas.toUpperCase()] || [], // Aseguramos que 'notas' sea un array y en mayúsculas
          precio: Array.isArray(precio) ? precio.map(p => String(p)) : [String(precio)] || [], // Aseguramos que 'precio' sea un array de strings
          PENDEJOALEJANDRO: { // Campo de mapa con un campo de tipo string
            estado: estado || 'pendiente', // Colocamos el campo 'estado' dentro de PENDEJOALEJANDRO
          },
          ID: id, // Guardar el ID del cliente dentro del documento
        });

        console.log('Cliente activado/actualizado con ID aleatorio:', clienteRef.id);

        // Verifica si la ID del pedido es válida antes de intentar eliminarlo
        if (pedidoIdDocumento) {
          // Ahora eliminamos el pedido de la colección 'notificaciones' usando la ID previamente guardada
          const pedidoRef = doc(db, 'notificaciones', pedidoIdDocumento);
          await deleteDoc(pedidoRef);
          console.log(`Pedido con ID ${pedidoIdDocumento} eliminado de la colección notificaciones`);
        } else {
          console.error('No se pudo obtener la ID del pedido para eliminarlo');
        }

        // Limpiar los detalles del pedido
        setPedidoSeleccionado(null);

        // Recargar la lista de pedidos
        await fetchPedidos();

        // Mostrar el toast de éxito cuando el cliente es activado
        toast.success('¡Cliente activado exitosamente!', {
          position: "top-right", // Cambié de toast.POSITION.TOP_RIGHT a la cadena "top-right"
          autoClose: 3000, // Se cierra en 3 segundos
          hideProgressBar: true, // Opcional: para ocultar la barra de progreso
        });

      } catch (error) {
        console.error('Error activando/actualizando el cliente: ', error);
        toast.error('Hubo un error al activar el cliente.', {
          position: "top-right", // Cambié de toast.POSITION.TOP_RIGHT a la cadena "top-right"
          autoClose: 3000, // Se cierra en 3 segundos
          hideProgressBar: true, // Opcional: para ocultar la barra de progreso
        });
      }
    }
  };


  // Función para obtener los pedidos
const fetchPedidos = async () => {
  try {
    // Obtén todos los documentos de la colección 'notificaciones'
    const querySnapshot = await getDocs(collection(db, 'notificaciones'));
    const pedidosArray = [];
    
    // Recorre los documentos de la colección
    querySnapshot.forEach((doc) => {
      // Excluir documentos cuyo ID sea 'pedidoIdDocumento' o 'ajua'
      if (doc.id === pedidoIdDocumento || doc.id === 'ajua') {
        return; // No se agrega a la lista
      }
      
      // Si el ID no coincide, agregamos el documento a la lista de pedidos
      pedidosArray.push({ id: doc.id, ...doc.data() });
    });

    // Actualizamos el estado con la lista de pedidos filtrados
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
  
        console.log(`Pedido con ID ${pedidoIdDocumento} cancelado (eliminado)`);
  
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

  
  



  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="lista-pedidos">
          <h2>Lista de Pedidos</h2>
          {pedidos.length > 0 ? (
            <ul>
            {pedidos
              .filter((pedido) => pedido.id !== 'hola') // Filtra los pedidos con id 'hola'
              .map((pedido) => (
                <li key={pedido.id}>
                  <strong>{pedido.nombre} {pedido.apellido}</strong>
                  <button onClick={() => handleVerPedido(pedido)} className="ver-pedido-btn">
                    Ver Pedido
                  </button>
                </li>
              ))}
          </ul>
          
          ) : (
            <p>No hay pedidos pendientes.</p>
          )}
        </div>
  
        <div className="pedido-detalles">
          {pedidoSeleccionado && (
            <div className="pedido-detalle-modal">
              <h3>Detalles del Pedido</h3>
              <p>
                <strong>ID:</strong>
                <input
                  type="text"
                  name="id"
                  value={pedidoSeleccionado.id || ''} // Mostrar el ID generado por Firestore
                  onChange={handleChange}
                  className="detail-input"
                  placeholder="ID"
                  readOnly
                />
              </p>
              <p>
                <strong>Nombre:</strong>
                <input
                  type="text"
                  name="nombre"
                  value={pedidoSeleccionado.nombre || ''}
                  onChange={handleChange}
                  className="detail-input"
                  placeholder="Nombre"
                />
              </p>
              <p>
                <strong>Apellido:</strong>
                <input
                  type="text"
                  name="apellido"
                  value={pedidoSeleccionado.apellido || ''}
                  onChange={handleChange}
                  className="detail-input"
                  placeholder="Apellido"
                />
              </p>
              <p>
                <strong>Teléfono:</strong>
                <input
                  type="text"
                  name="telefono"
                  value={pedidoSeleccionado.telefono || ''}
                  onChange={handleChange}
                  className="detail-input"
                  placeholder="Teléfono"
                />
              </p>
              <p>
                <strong>Email:</strong>
                <input
                  type="email"
                  name="email"
                  value={pedidoSeleccionado.email || ''}
                  onChange={handleChange}
                  className="detail-input"
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
                  className="detail-input"
                />
              </p>
              <p>
                <strong>Fecha Final:</strong>
                <input
                  type="date"
                  name="fechaFinal"
                  value={pedidoSeleccionado.fechaFinal || ''}
                  readOnly
                  className="detail-input"
                />
              </p>
              <p>
                <strong>Estado:</strong>
                <input
                  type="text"
                  name="estado"
                  value={pedidoSeleccionado.estado || ''}
                  onChange={handleChange}
                  className="detail-input"
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
                  className="detail-input"
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
                  className="detail-input"
                  placeholder="Servicio"
                />
              </p>
              <p>
                <strong>Notas:</strong>
                <textarea
                  name="notas"
                  value={pedidoSeleccionado.notas || ''}
                  onChange={handleChange}
                  className="detail-input"
                  placeholder="Notas"
                />
              </p>
              <p>
                <strong>Precio:</strong>
                <input
                  type="number"
                  name="precio"
                  value={pedidoSeleccionado.precio || ''}
                  onChange={handleChange}
                  className="detail-input"
                  placeholder="Precio"
                />
              </p>
              <button onClick={handleActivarCliente} className="activar-btn">Activar Cliente</button>
              <button onClick={handleCerrarDetalle} className="cerrar-btn">Cerrar</button>
              <button onClick={handleCancelarPedido} className="cancelar-btn">Cancelar Pedido</button>
            </div>
          )}
        </div>
  
        {/* Toast Notification */}
        {isToastVisible && (
          <div className="toast-message">
            {toastMessage}
          </div>
        )}
  
        {/* Botón para cerrar el overlay */}
        <button onClick={onClose} className="cerrar-overlay-btn">
          Cerrar Overlay
        </button>
      </div>
    </div>
  );
  
  
};

export default Notificaciones;
