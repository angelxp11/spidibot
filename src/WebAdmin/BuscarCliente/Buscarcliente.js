import React, { useState } from 'react';
import { getFirestore, collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { app } from '../../firebase';
import './buscarCliente.css';

const firestore = getFirestore(app);

// Función para normalizar texto
const normalizarTexto = (texto) => {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // Elimina acentos
};

// Función para convertir la fecha de dd/mm/yyyy a yyyy-mm-dd
const convertirFecha = (fecha) => {
  const [dia, mes, anio] = fecha.split('/');
  return `${anio}-${mes}-${dia}`;
};
// Función para convertir la fecha de yyyy-mm-dd a dd/mm/yyyy
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
    fechaInicial: '',  // Inicialmente vacío o en formato yyyy-mm-dd
    fechaFinal: '',    // Inicialmente vacío o en formato yyyy-mm-dd
    pagado: '',
    estado: '',
    grupo: '',
    servicio: '',
    precio: ''
  });
  
  

  const handleSearchTypeChange = (event) => {
    setSearchType(event.target.value);
    setSearchValue(''); // Limpiar valor de búsqueda al cambiar el tipo
  };

  const handleSearchValueChange = (event) => {
    setSearchValue(event.target.value);
  };

  const searchByName = async (searchValue) => {
    try {
      const clientesRef = collection(firestore, 'clientes');
      const searchValueUpper = normalizarTexto(searchValue).toUpperCase();

      // Obtener todos los documentos en la colección
      const querySnapshot = await getDocs(query(clientesRef));
      const results = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          nombre: data.nombre,
          apellido: data.apellido,
          estado: data.PENDEJOALEJANDRO?.estado || '', // Acceso al campo estado en el mapa
          ID: data.ID,
          ...data
        };
      });

      // Filtrar resultados para coincidencias en nombre o apellido
      const filteredResults = results.filter(result => {
        const nombreUpper = normalizarTexto(result.nombre).toUpperCase();
        const apellidoUpper = normalizarTexto(result.apellido).toUpperCase();
        return nombreUpper.includes(searchValueUpper) || apellidoUpper.includes(searchValueUpper);
      });

      setSearchResults(filteredResults);
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
          estado: data.PENDEJOALEJANDRO?.estado || '', // Acceso al campo estado en el mapa
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
      fechaInicial: convertirFecha(client.fechaInicial), // Convertir fecha a formato yyyy-mm-dd
      fechaFinal: convertirFecha(client.fechaFinal),     // Convertir fecha a formato yyyy-mm-dd
      pagado: client.pagado,
      estado: client.PENDEJOALEJANDRO?.estado || '', // Acceso al campo estado en el mapa
      grupo: client.grupo,
      servicio: client.servicio,
      precio: client.precio // Nuevo campo de precio
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

    // Convierte fechas a formato dd/mm/yyyy
    const fechaInicial = clientData.fechaInicial ? convertirFechaInvertida(clientData.fechaInicial) : '';
    const fechaFinal = clientData.fechaFinal ? convertirFechaInvertida(clientData.fechaFinal) : '';

    // Construye el objeto de actualización
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
      updates['grupo'] = grupoArray; // Agregar grupo en mayúsculas
    }
    if (servicioArray.length > 0) {
      updates['servicio'] = servicioArray; // Agregar servicio en mayúsculas
    }
    if (precioArray.length > 0) {
      updates['precio'] = precioArray; // Agregar precio en mayúsculas
    }

    console.log('Datos a actualizar:', updates);

    await updateDoc(clientDocRef, updates);

    // En lugar de usar Toast, puedes usar un alert o simplemente loguear un mensaje
    alert('Cambios guardados con éxito');
    setSelectedClient(null); // Cierra el modal de detalles del cliente
  } catch (error) {
    console.error('Error al guardar cambios:', error);
    // En lugar de usar Toast, puedes usar un alert o simplemente loguear un mensaje
    alert('Error al guardar cambios: ' + error.message);
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
                Nombre:
                <input
                  type="text"
                  name="nombre"
                  value={clientData.nombre}
                  onChange={handleChange}
                  className="detail-input"
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
                />
              </label>
              <label>
                Servicio:Netflix(cel),Netflixtv(5users),Netflixme(miembroex)
                <input
                  type="text"
                  name="servicio"
                  value={clientData.servicio}
                  onChange={handleChange}
                  className="detail-input"
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
                />
              </label>
              <button onClick={handleSaveChanges} className="save-button">Guardar Cambios</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default BuscarCliente;
