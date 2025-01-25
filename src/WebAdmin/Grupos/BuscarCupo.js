import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import './BuscarCupo.css';
import { toast } from 'react-toastify'; // Importa toast
import { FaSearch, FaInfoCircle, FaSave, FaCopy } from 'react-icons/fa'; // Importa iconos


// Define la función para obtener colores
const getColorForIndex = (index) => {
  const colors = ['#df1821', '#209ce2', '#1dcd5b', '#FFD700', '#8A2BE2', '#FF4500', '#DA70D6', '#00BFFF', '#FF1493'];
  return colors[index % colors.length];
};

// Función para convertir la fecha de 'yyyy-mm-dd' a 'dd/mm/yyyy'
const guardarFechas = (fecha) => {
  if (!fecha || !/\d{4}-\d{2}-\d{2}/.test(fecha)) {
    console.error('Formato de fecha no válido');
    return '';
  }
  const [year, month, day] = fecha.split('-');
  return `${day}/${month}/${year}`;
};

// Función para convertir la fecha de 'dd/mm/yyyy' a 'yyyy-mm-dd'
const verFechas = (fecha) => {
  if (!fecha || !/\d{2}\/\d{2}\/\d{4}/.test(fecha)) {
    console.error('Formato de fecha no válido');
    return '';
  }
  const [day, month, year] = fecha.split('/');
  return `${year}-${month}-${day}`;
};

const formatPrice = (value) => {
  if (!value) return '';
  const numberValue = parseFloat(value.replace(/[$,]/g, ''));
  return `$${numberValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

const parsePrice = (value) => {
  return value.replace(/[$,]/g, '');
};

const packages = [
  "Premium4K+HDR+2miembrosExtras",
  "Premium4K+HDR",
  "Estándar+1miembroextra",
  "Estándar",
  "Básico"
];

function BuscarCupo({ onClose }) {
  const [servicio, setServicio] = useState('');
  const [grupo, setGrupo] = useState('');
  const [gruposDisponibles, setGruposDisponibles] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [selectedClientes, setSelectedClientes] = useState({});
  const [clientesColores, setClientesColores] = useState({});
  const [info, setInfo] = useState({
    email: '',
    password: '',
    fechaComienzo: '',
    fechaPago: '',
    notas: '',
    direccion: '',
    enlace: '',
    price: '', // Nuevo campo
    package: '' // Nuevo campo
  });
    const [infoDocId, setInfoDocId] = useState('');
  const [isResultadosVisible, setIsResultadosVisible] = useState(false);
  const [isInfoVisible, setIsInfoVisible] = useState(false);
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

  const handleOverlayClick = (event) => {
    if (event.target.classList.contains('BuscarCupo-overlay')) {
      onClose();
    }
  };
  

  // Función para obtener los grupos disponibles del servicio seleccionado
  const fetchGruposDisponibles = async (servicioSeleccionado) => {
    try {
      const serviciosRef = collection(db, 'Servicios');
      const qServicio = query(
        serviciosRef,
        where('__name__', '==', servicioSeleccionado.trim().toUpperCase())
      );
      const querySnapshotServicio = await getDocs(qServicio);
  
      if (!querySnapshotServicio.empty) {
        const servicioDoc = querySnapshotServicio.docs[0];
        const servicioData = servicioDoc.data();
  
        // Obtener los grupos y ordenarlos numéricamente
        const gruposOrdenados = Object.keys(servicioData).sort((a, b) => {
          const numeroA = parseInt(a.replace(/\D/g, '')); // Extraer el número de "g1", "g2", etc.
          const numeroB = parseInt(b.replace(/\D/g, ''));
          return numeroA - numeroB; // Ordenar en orden ascendente
        });
  
        setGruposDisponibles(gruposOrdenados);
      } else {
        setGruposDisponibles([]);
      }
    } catch (error) {
      console.error('Error al obtener grupos disponibles:', error);
    }
  };

  useEffect(() => {
    if (servicio) {
      fetchGruposDisponibles(servicio);
    }
  }, [servicio]);

  const handleSearch = async () => {
    try {
      const clientesRef = collection(db, 'clientes');
      const serviciosArray = servicio.split(',').map(s => s.trim().toUpperCase());
      const clientesFiltrados = [];
      const coloresClientes = {};
  
      for (let i = 0; i < serviciosArray.length; i++) {
        const servActual = serviciosArray[i];
        
        const qServicio = query(
          clientesRef,
          where('servicio', 'array-contains', servActual)
        );
        const querySnapshot = await getDocs(qServicio);
        
        const clientesServicio = querySnapshot.docs.map(doc => ({
          id: doc.data().ID,
          nombre: doc.data().nombre,
          apellido: doc.data().apellido,
          PENDEJOALEJANDRO: doc.data().PENDEJOALEJANDRO,
          ...doc.data()
        }));
  
        clientesServicio.forEach(cliente => {
          const servicios = cliente.servicio || [];
          const grupos = cliente.grupo || [];
          
          // Verificar si el grupo y servicio coinciden
          const coincide = servicios.some((serv, index) => 
            serv === servActual && grupos[index] === grupo
          );
          
          // Verificar el estado en el campo PENDEJOALEJANDRO
          const estadoCliente = cliente.PENDEJOALEJANDRO?.estado;
          
          // Mostrar cliente si su estado es diferente de 😶‍🌫️
          if (coincide && estadoCliente !== '😶‍🌫️') {
            if (!clientesFiltrados.some(c => c.id === cliente.id)) {
              clientesFiltrados.push(cliente);
              if (serviciosArray.length > 1) {
                coloresClientes[cliente.id] = getColorForIndex(i);
              }
            }
          }
        });
      }
  
      setClientes(clientesFiltrados);
      setClientesColores(serviciosArray.length > 1 ? coloresClientes : {});
      setIsResultadosVisible(true);
    } catch (error) {
      console.error('Error en la búsqueda:', error);
    }
  };
  

const handleInfoClick = async () => {
  try {
    const serviciosRef = collection(db, 'Servicios');
    const qServicio = query(
      serviciosRef,
      where('__name__', '==', servicio.trim().toUpperCase())
    );
    const querySnapshotServicio = await getDocs(qServicio);

    if (!querySnapshotServicio.empty) {
      const servicioDoc = querySnapshotServicio.docs[0];
      const servicioData = servicioDoc.data();
      const grupoInfo = servicioData[grupo];

      if (grupoInfo) {
        setInfo({
          email: grupoInfo.email || '',
          password: grupoInfo.password || '',
          fechaComienzo: verFechas(grupoInfo.fechaComienzo) || '',
          fechaPago: verFechas(grupoInfo.fechaPago) || '',
          notas: grupoInfo.notas || '',
          direccion: grupoInfo.direccion || '',
          enlace: grupoInfo.enlace || '',
          price: grupoInfo.price || '',
          package: grupoInfo.package || '' // Asegúrate de que el valor del paquete se muestre correctamente
        });
        setInfoDocId(servicioDoc.id); // Guarda el ID del documento
        setIsInfoVisible(true); // Muestra la información del grupo
      } else {
        toast('No se encontró información para el grupo especificado.');
      }
    } else {
      toast('No se encontró el servicio especificado.');
    }
  } catch (error) {
    console.error('Error al obtener información del servicio:', error);
  }
};
  
  
  const handleCopyPaste = () => {
    const { email, password } = info; // Asume que `info` tiene el email y la contraseña
    const serviceName = servicio; // Asume que `servicio` tiene el nombre del servicio seleccionado
    const textToCopy = `*🔑 Aquí tienes tu información de acceso:*
📧 Correo: ${email}
🔒 Contraseña: ${password}
👤 Perfil: _*Actualizacion de claves*_
    
Utiliza esta información para acceder a *${serviceName}*. Si tienes alguna pregunta, no dudes en preguntar. ❓🙌
    
¡Gracias por confiar en nosotros! 💖
  
¡Saludos cordiales! 👋🌟`;
    
    // Copiar al portapapeles
    navigator.clipboard.writeText(textToCopy).then(() => {
      toast('Información copiada al portapapeles.');
    }).catch(err => {
      console.error('Error al copiar al portapapeles: ', err);
    });
  };
  
  

const handleSaveChanges = async () => {
  const updatedFields = {};
  
  if (info.email !== '') updatedFields[`${grupo}.email`] = info.email;
  if (info.password !== '') updatedFields[`${grupo}.password`] = info.password;
  if (info.fechaComienzo !== '') updatedFields[`${grupo}.fechaComienzo`] = guardarFechas(info.fechaComienzo);
  if (info.fechaPago !== '') updatedFields[`${grupo}.fechaPago`] = guardarFechas(info.fechaPago);
  if (info.notas !== '') updatedFields[`${grupo}.notas`] = info.notas;
  if (info.price !== '') updatedFields[`${grupo}.price`] = parsePrice(info.price); // Nuevo campo
  if (info.package !== '') updatedFields[`${grupo}.package`] = info.package.toUpperCase(); // Guardar en mayúsculas
  
  if (servicio === 'SPOTIFY') {
    // Crea siempre los campos, incluso si están vacíos
    updatedFields[`${grupo}.direccion`] = info?.direccion || '';
    updatedFields[`${grupo}.enlace`] = info?.enlace || '';
} else {
    // Asegúrate de eliminar los campos si no es SPOTIFY
    delete updatedFields[`${grupo}.direccion`];
    delete updatedFields[`${grupo}.enlace`];
}



  try {
    const servicioRef = doc(db, 'Servicios', infoDocId);
    
    // Actualizar solo los campos modificados
    await updateDoc(servicioRef, updatedFields);

    toast('Cambios guardados con éxito.');
    setIsInfoVisible(false); // Opcional: cerrar el modal después de guardar
  } catch (error) {
    console.error('Error al guardar cambios:', error);
    alert('Error al guardar cambios. Por favor, intenta nuevamente.');
  }
};
  
  

  const handleInputChange = (e, setter) => {
    setter(e.target.value);
  };

  const handleSelectChange = (e) => {
    setServicio(e.target.value);
  };

  const handleGrupoChange = (e) => {
    setGrupo(e.target.value);
  };

  const handleCheckboxChange = (id) => {
    setSelectedClientes((prevSelected) => ({
      ...prevSelected,
      [id]: !prevSelected[id]
    }));
  };

  return (
    <div className="BuscarCupo-overlay" onClick={handleOverlayClick}>
      <div className="BuscarCupo-buscarclientes">
        <h2>Buscar Clientes</h2>
        <div className="BuscarCupo-form-group">
          <label>Servicio:</label>
          <select value={servicio} onChange={handleSelectChange}>
            <option value="">Selecciona un servicio</option>
            <option value="NETFLIX,NETFLIXTV,NETFLIXME">NETFLIX</option>
            <option value="DISNEY">DISNEY</option>
            <option value="PRIMEVIDEO">PRIMEVIDEO</option>
            <option value="MAX">MAX</option>
            <option value="PARAMOUNT">PARAMOUNT</option>
            <option value="CRUNCHY">CRUNCHY</option>
            <option value="SPOTIFY">SPOTIFY</option>
            <option value="YOUTUBE">YOUTUBE</option>
          </select>
        </div>
        <div className="BuscarCupo-form-group">
          <label>Grupo:</label>
          <select value={grupo} onChange={handleGrupoChange} disabled={!servicio}>
            <option value="">Selecciona un grupo</option>
            {gruposDisponibles.map((grupo) => (
              <option key={grupo} value={grupo}>{grupo}</option>
            ))}
          </select>
        </div>
        <div className="BuscarCupo-buttons">
          <button className="BuscarCupo-info-button" onClick={handleInfoClick}>
            <FaInfoCircle /> Información
          </button>
          <button className="BuscarCupo-search-button" onClick={handleSearch}>
            Buscar <FaSearch />
          </button>
        </div>
        <button className="BuscarCupo-boton-cerrar" onClick={onClose}>x</button>

      </div>

      {isResultadosVisible && (
        <div className="BuscarCupo-resultadoclientes">
          <div className="BuscarCupo-modal-content1">
            <button className="BuscarCupo-boton-cerrar" onClick={() => setIsResultadosVisible(false)}>x</button>
            <h3>Resultados:</h3>
            <ul>
              {clientes.length === 0 ? (
                <li>No se encontraron clientes.</li>
              ) : (
                clientes.map(cliente => (
                  <li
                    key={cliente.id}
                    className="BuscarCupo-cliente-item"
                    style={{ backgroundColor: clientesColores[cliente.id] || 'transparent' }}
                  >
                    <input
  type="checkbox"
  className="BuscarCupo-custom-checkbox"
  checked={!!selectedClientes[cliente.id]}
  onChange={() => handleCheckboxChange(cliente.id)}
/>

                    <span>{cliente.id}🔛{cliente.pagado === 'SI' ? '✔️' : '✖️'}</span> {/* Mostrar ✔️ o ✖️ basado en el valor de "pagado" */}
                    <span>{cliente.nombre} {cliente.apellido}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      )}

{isInfoVisible && (
  <div className="BuscarCupo-informacionclientes">
    <div className="BuscarCupo-modal-content1">
      <button className="BuscarCupo-boton-cerrar" onClick={() => setIsInfoVisible(false)}>x</button>
      <h3>Información del Grupo:</h3>
      
      <div className="BuscarCupo-form-group">
        <label>Email:</label>
        <input
          type="text"
          value={info.email}
          onChange={(e) => handleInputChange(e, (value) => setInfo(prev => ({ ...prev, email: value })))}
        />
      </div>
      
      <div className="BuscarCupo-form-group">
        <label>Contraseña:</label>
        <input
          type="text"
          value={info.password}
          onChange={(e) => handleInputChange(e, (value) => setInfo(prev => ({ ...prev, password: value })))}
        />
      </div>
      
      <div class="BuscarCupo-form-group">
        <label>Fecha de Comienzo:</label>
        <input
          type="date"
          value={info.fechaComienzo}
          onChange={(e) => handleInputChange(e, (value) => setInfo(prev => ({ ...prev, fechaComienzo: value })))}
        />
      </div>
      
      <div className="BuscarCupo-form-group">
        <label>Fecha de Pago:</label>
        <input
          type="date"
          value={info.fechaPago}
          onChange={(e) => handleInputChange(e, (value) => setInfo(prev => ({ ...prev, fechaPago: value })))}
        />
      </div>
      
      <div className="BuscarCupo-form-group">
        <label>Notas:</label>
        <input
          type="text"
          value={info.notas}
          onChange={(e) => handleInputChange(e, (value) => setInfo(prev => ({ ...prev, notas: value })))}
        />
      </div>
      {servicio == 'SPOTIFY' && (
              <>
                <div className="BuscarCupo-form-group">
                  <label>Dirección:</label>
                  <input
                    type="text"
                    value={info.direccion}
                    onChange={(e) => handleInputChange(e, (value) => setInfo(prev => ({ ...prev, direccion: value })))}
                  />
                </div>
                <div className="BuscarCupo-form-group">
                  <label>Enlace:</label>
                  <input
                    type="text"
                    value={info.enlace}
                    onChange={(e) => handleInputChange(e, (value) => setInfo(prev => ({ ...prev, enlace: value })))}
                  />
                </div>
              </>
            )}
            <div className="BuscarCupo-form-group">
        <label>Paquete:</label>
        <select
          value={info.package}
          onChange={(e) => handleInputChange(e, (value) => setInfo(prev => ({ ...prev, package: value })))}
        >
          <option value="">Selecciona un paquete</option>
          {packages.map((pkg) => (
            <option key={pkg} value={pkg}>{pkg}</option>
          ))}
        </select>
      </div>
      <div className="BuscarCupo-form-group">
        <label>Precio:</label>
        <input
          type="text"
          value={formatPrice(info.price)}
          onChange={(e) => handleInputChange(e, (value) => setInfo(prev => ({ ...prev, price: parsePrice(value) })))}
        />
      </div>
      
      <button onClick={handleSaveChanges}><FaSave /> Guardar Cambios</button>
      <button onClick={handleCopyPaste}><FaCopy /> Copiar Información</button>
    </div>
  </div>
)}



    </div>
  );
}

export default BuscarCupo;