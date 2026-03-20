import React, { useState, useEffect } from 'react';
import { getFirestore, collection, addDoc, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { app } from '../../firebase';
import './RegistroCliente.css';
import { toast } from 'react-toastify'; // Importa toast


const firestore = getFirestore(app);


// Función para dar formato a la fecha
const formatDate = (date) => {
  if (!date) return '';
  const [year, month, day] = date.split('-');
  return `${day}/${month}/${year}`;
};

// Función para generar ID con formato de 5 dígitos
const generateId = (maxId) => {
  const newId = (maxId + 1).toString().padStart(5, '0');
  return newId;
};

function RegistroCliente({ onClose }) {
  const [clientData, setClientData] = useState({
    ID: '',
    nombre: '',
    apellido: '',
    telefono: '',
    fechaInicial: '',
    fechaFinal: '',
    pagado: 'NO', // Valor por defecto
    estado: '✅',
    grupo: '',
    servicio: '',
    notas: '',
    precio: ''
  });
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
  

  const [maxId, setMaxId] = useState(0);

  // Obtiene el ID máximo y actualiza el estado del ID
  useEffect(() => {
    const fetchMaxId = async () => {
      try {
        const clientCollection = collection(firestore, 'clientes');
        const q = query(clientCollection, orderBy('ID', 'desc'), limit(1));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0].data();
          setMaxId(parseInt(doc.ID, 10) || 0);
        }
      } catch (error) {
        console.error('Error fetching max ID:', error);
      }
    };

    fetchMaxId();
  }, []);

  useEffect(() => {
    // Set the new ID in the clientData state
    setClientData((prevData) => ({
      ...prevData,
      ID: generateId(maxId)
    }));
  }, [maxId]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setClientData((prevData) => ({
      ...prevData,
      [name]: value
    }));
  };
  const handleDateChange = (event) => {
    const { name, value } = event.target;
    
    if (name === 'fechaInicial') {
      const selectedDate = new Date(value);
      const nextMonthDate = new Date(selectedDate);
  
      // Sumar un mes
      nextMonthDate.setMonth(selectedDate.getMonth() + 1);
  
      // Manejar caso en que el día exceda los días del nuevo mes
      if (nextMonthDate.getDate() !== selectedDate.getDate()) {
        nextMonthDate.setDate(0); // Ajusta al último día del mes
      }
  
      setClientData((prevData) => ({
        ...prevData,
        fechaInicial: value,
        fechaFinal: nextMonthDate.toISOString().split('T')[0], // Formatear como YYYY-MM-DD
      }));
    } else {
      setClientData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }
  };
  

  const handleSaveClient = async () => {
    try {
      // Validar campos obligatorios
      if (!clientData.nombre || !clientData.apellido || !clientData.telefono || !clientData.email || !clientData.fechaInicial || !clientData.fechaFinal) {
        toast.error('Por favor, complete todos los campos obligatorios.', { autoClose: 2000 });
        return;
      }

      // Definir los arrays de grupo, servicio y precio y convertirlos a mayúsculas
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

      // Construir objeto de cliente
      const newClient = {
        ID: clientData.ID,
        nombre: clientData.nombre.toUpperCase(),
        apellido: clientData.apellido.toUpperCase(),
        email: clientData.email.toLowerCase(), // Guardar email en minúsculas
        telefono: clientData.telefono.toUpperCase(),
        grupo: grupoArray,
        servicio: servicioArray,
        notas: notasArray,
        precio: precioArray,
        fechaInicial: formatDate(clientData.fechaInicial),
        fechaFinal: formatDate(clientData.fechaFinal),
        PENDEJOALEJANDRO: { // Campo de tipo mapa
          estado: clientData.estado
        },
        pagado: ["SI"], // Initialize pagado as an array with "SI"
      };

      // Guardar en Firestore
      await addDoc(collection(firestore, 'clientes'), newClient);

      toast('Cliente registrado con éxito', { autoClose: 2000 });
      setTimeout(() => {
        onClose();
      }, 2000);

      setClientData({
        ID: '',
        nombre: '',
        apellido: '',
        telefono: '',
        email: '', // Restablecer email
        fechaInicial: '',
        fechaFinal: '',
        pagado: 'NO', // Valor por defecto
        estado: '✅',
        grupo: '',
        servicio: '',
        notas: '',
        precio: ''
      });
      setMaxId(parseInt(clientData.ID, 10)); // Actualiza el ID máximo

    } catch (error) {
      console.error('Error al registrar cliente:', error);
      toast.error('Error al registrar cliente: ' + error.message, { autoClose: 2000 });
    }
  };

  const handleOverlayClick = (event) => {
    if (event.target.classList.contains('registro-modal-overlay')) {
      onClose();
    }
  };

  return (
    <div className="registro-modal-overlay" onClick={handleOverlayClick}>
      <div className="registro-form-container">
        <button className="registro-boton-cerrar" onClick={onClose}>X</button>
        <h2 className="registro-h2">Registro de Cliente</h2>
        <div className="registro-form-input">
          <label>ID</label>
          <input
            type="text"
            name="ID"
            value={clientData.ID}
            readOnly
          />
        </div>
        <div className="registro-form-input">
          <label>Nombre</label>
          <input
            type="text"
            name="nombre"
            value={clientData.nombre}
            onChange={handleChange}
          />
        </div>
        <div className="registro-form-input">
          <label>Apellido</label>
          <input
            type="text"
            name="apellido"
            value={clientData.apellido}
            onChange={handleChange}
          />
        </div>
        <div className="registro-form-input">
          <label>Teléfono</label>
          <input
            type="text"
            name="telefono"
            value={clientData.telefono}
            onChange={handleChange}
          />
        </div>
        <div className="registro-form-input">
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={clientData.email}
            onChange={handleChange}
          />
        </div>
        <div className="registro-form-input">
  <label>Fecha Inicial</label>
  <input
    type="date"
    name="fechaInicial"
    value={clientData.fechaInicial}
    onChange={handleDateChange}
  />
</div>
<div className="registro-form-input">
  <label>Fecha Final</label>
  <input
    type="date"
    name="fechaFinal"
    value={clientData.fechaFinal}
    onChange={handleChange} // Permite editar manualmente si es necesario
  />
</div>

        <div className="registro-form-input">
          <label>Grupo</label>
          <input
            type="text"
            name="grupo"
            value={clientData.grupo}
            onChange={handleChange}
          />
        </div>
        <div className="registro-form-input">
          <label>Servicio</label>
          <input
            type="text"
            name="servicio"
            value={clientData.servicio}
            onChange={handleChange}
          />
        </div>
        <div className="registro-form-input">
          <label>Notas</label> {/* Nuevo campo Notas */}
          <input
            type="text"
            name="notas"
            value={clientData.notas}
            onChange={handleChange}
          />
        </div>
        <div className="registro-form-input">
          <label>Precio</label>
          <input
            type="text"
            name="precio"
            value={clientData.precio}
            onChange={handleChange}
          />
        </div>
        <button className="registro-submit-button" onClick={handleSaveClient}>
          Guardar Cliente
        </button>
      </div>
    </div>
  );
  
  
}

export default RegistroCliente;