import React, { useState, useEffect } from 'react';
import { getFirestore, collection, addDoc, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { app } from '../../firebase';
import './RegistroCliente.css';

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
    precio: ''
  });

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

  const handleSaveClient = async () => {
    try {
      // Definir los arrays de grupo, servicio y precio y convertirlos a mayúsculas
      const grupoArray = Array.isArray(clientData.grupo)
        ? clientData.grupo.map(item => item.toUpperCase())
        : (clientData.grupo ? clientData.grupo.split(',').map(item => item.trim().toUpperCase()) : []);
        
      const servicioArray = Array.isArray(clientData.servicio)
        ? clientData.servicio.map(item => item.toUpperCase())
        : (clientData.servicio ? clientData.servicio.split(',').map(item => item.trim().toUpperCase()) : []);
        
      const precioArray = Array.isArray(clientData.precio)
        ? clientData.precio.map(item => item.toUpperCase())
        : (clientData.precio ? clientData.precio.split(',').map(item => item.trim().toUpperCase()) : []);

      // Construir objeto de cliente
      const newClient = {
        ID: clientData.ID,
        nombre: clientData.nombre.toUpperCase(),
        apellido: clientData.apellido.toUpperCase(),
        telefono: clientData.telefono.toUpperCase(),
        grupo: grupoArray,
        servicio: servicioArray,
        precio: precioArray,
        fechaInicial: formatDate(clientData.fechaInicial),
        fechaFinal: formatDate(clientData.fechaFinal),
        PENDEJOALEJANDRO: { // Campo de tipo mapa
          estado: clientData.estado
        },
        pagado: clientData.pagado.toUpperCase()
      };

      // Guardar en Firestore
      await addDoc(collection(firestore, 'clientes'), newClient);

      alert('Cliente registrado con éxito');
      setClientData({
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
        precio: ''
      });
      setMaxId(parseInt(clientData.ID, 10)); // Actualiza el ID máximo
      onClose();
    } catch (error) {
      console.error('Error al registrar cliente:', error);
      alert('Error al registrar cliente: ' + error.message);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-button" onClick={onClose}>×</button>
        <div className="form-container">
          <h1>Registrar Cliente</h1>
          <label>
            ID:
            <input
              type="text"
              name="ID"
              value={clientData.ID}
              readOnly
              className="form-input"
            />
          </label>
          <label>
            Nombre:
            <input
              type="text"
              name="nombre"
              value={clientData.nombre}
              onChange={handleChange}
              className="form-input"
            />
          </label>
          <label>
            Apellido:
            <input
              type="text"
              name="apellido"
              value={clientData.apellido}
              onChange={handleChange}
              className="form-input"
            />
          </label>
          <label>
            Teléfono:
            <input
              type="text"
              name="telefono"
              value={clientData.telefono}
              onChange={handleChange}
              className="form-input"
            />
          </label>
          <label>
            Fecha Inicial:
            <input
              type="date"
              name="fechaInicial"
              value={clientData.fechaInicial}
              onChange={handleChange}
              className="form-input"
            />
          </label>
          <label>
            Fecha Final:
            <input
              type="date"
              name="fechaFinal"
              value={clientData.fechaFinal}
              onChange={handleChange}
              className="form-input"
            />
          </label>
          <label>
            Pagado:
            <select
              name="pagado"
              value={clientData.pagado}
              onChange={handleChange}
              className="form-input"
            >
              <option value="SI">SI</option>
              <option value="NO">NO</option>
            </select>
          </label>
          <label>
            Estado:
            <select
              name="estado"
              value={clientData.estado}
              onChange={handleChange}
              className="form-input"
            >
              <option value="✅">✅</option>
              <option value="⚠️">⚠️</option>
              <option value="❌">❌</option>
            </select>
          </label>
          <label>
            Grupo:
            <input
              type="text"
              name="grupo"
              value={clientData.grupo}
              onChange={handleChange}
              className="form-input"
            />
          </label>
          <label>
            Servicio: Netflix(cel), Netflixtv(5users), Netflixme(miembroex)
            <input
              type="text"
              name="servicio"
              value={clientData.servicio}
              onChange={handleChange}
              className="form-input"
            />
          </label>
          <label>
            Precio:
            <input
              type="text"
              name="precio"
              value={clientData.precio}
              onChange={handleChange}
              className="form-input"
            />
          </label>
          <button onClick={handleSaveClient} className="form-button">Registrar Cliente</button>
        </div>
      </div>
    </div>
  );
}

export default RegistroCliente;
