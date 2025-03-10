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
  if (value === null || value === undefined || value === '') return '0';
  const stringValue = value.toString(); // Ensure value is a string
  const numberValue = parseFloat(stringValue.replace(/[$,]/g, ''));
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
  const [selectedClientInfo, setSelectedClientInfo] = useState({ email: '', password: '' });
  const [isClientInfoVisible, setIsClientInfoVisible] = useState(false);
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
  
        // Filtrar los grupos que no tienen un estado de 😶‍🌫️
        const gruposFiltrados = gruposOrdenados.filter(grupo => servicioData[grupo]?.estado !== '😶‍🌫️');
  
        setGruposDisponibles(gruposFiltrados);
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

  useEffect(() => {
    if (grupo && isInfoVisible) {
      handleInfoClick();
    }
  }, [grupo, isInfoVisible]);

  useEffect(() => {
    if (grupo && isResultadosVisible) {
      handleSearch();
    }
  }, [grupo, isResultadosVisible]);

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
        SPOTIFY: doc.data().SPOTIFY,
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
          email: Array.isArray(grupoInfo.email) ? grupoInfo.email[0] : grupoInfo.email || '',
          password: Array.isArray(grupoInfo.password) ? grupoInfo.password[0] : grupoInfo.password || '',
          fechaComienzo: verFechas(grupoInfo.fechaComienzo) || '',
          fechaPago: verFechas(grupoInfo.fechaPago) || '',
          notas: grupoInfo.notas || '',
          direccion: grupoInfo.direccion || '',
          enlace: grupoInfo.enlace || '',
          price: typeof grupoInfo.price === 'number' && grupoInfo.price !== 0 ? grupoInfo.price : 0,
          package: grupoInfo.package || '' // Ensure the package value is correctly set
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
  if (info.price !== '' || info.price === 0) { // Allow editing if price is zero
    const priceString = info.price.toString(); // Ensure price is a string
    updatedFields[`${grupo}.price`] = parseFloat(priceString.replace(/[$,]/g, '')); // Ensure price is a number
  }
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
    setGrupo(''); // Reset the group when the service changes
    setIsInfoVisible(false); // Hide the info modal when the service changes
    setIsResultadosVisible(false); // Hide the results modal when the service changes
  };

  const handleGrupoChange = (e) => {
    setGrupo(e.target.value);
  };

const handleCheckboxChange = (id, cliente) => {
  const newSelectedClientes = { [id]: !selectedClientes[id] }; // Ensure only one checkbox is selected at a time

  setSelectedClientes(newSelectedClientes);

  if (servicio === 'SPOTIFY' && newSelectedClientes[id]) {
    const index = cliente.servicio?.findIndex((serv, idx) => serv === servicio && cliente.grupo[idx] === grupo);
    if (index !== -1) {
      setSelectedClientInfo({
        email: cliente.SPOTIFY?.email[index] || '',
        password: cliente.SPOTIFY?.password[index] || ''
      });
      setIsClientInfoVisible(true);
    }
  } else {
    setSelectedClientInfo({ email: '', password: '' });
    setIsClientInfoVisible(false);
  }
};

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      toast('Información copiada al portapapeles.');
    }).catch(err => {
      console.error('Error al copiar al portapapeles: ', err);
    });
  };

  const handleClientInfoOverlayClick = (event) => {
    if (event.target.classList.contains('BuscarCupo-info-modal')) {
      setIsClientInfoVisible(false);
    }
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
          clientes.map(cliente => {
            // Encontrar el índice donde coinciden servicio y grupo
            const servicioIndex = cliente.servicio.findIndex((s, i) => 
              servicio.split(',').map(serv => serv.trim().toUpperCase()).includes(s) && cliente.grupo[i] === grupo
            );


            // Determinar el estado de pago
            let pagadoStatus = '❓';
            if (servicioIndex !== -1) {
              const pagado = cliente.pagado[servicioIndex];
              if (pagado === 'SI') {
                pagadoStatus = '✔️';
              } else if (pagado === 'NO') {
                pagadoStatus = '✖️';
              }
            }

            // Verificar si es principal en este servicio y grupo
            const isPrincipal = servicioIndex !== -1 && cliente.SPOTIFY?.principal?.[servicioIndex];

            // Obtener el estado de PENDEJOALEJANDRO
            const estadoPendejoAlejandro = cliente.PENDEJOALEJANDRO?.estado || 'Desconocido';

            return (
              <li
                key={cliente.id}
                className="BuscarCupo-cliente-item"
                style={{ backgroundColor: isPrincipal ? 'green' : (clientesColores[cliente.id] || 'transparent') }}
              >
                <input
                  type="checkbox"
                  className="BuscarCupo-custom-checkbox"
                  checked={!!selectedClientes[cliente.id]}
                  onChange={() => handleCheckboxChange(cliente.id, cliente)}
                />
                <div className="BuscarCupo-cliente-info">
                  <span>{cliente.id}{estadoPendejoAlejandro}{pagadoStatus}</span>
                </div>
                <div className="BuscarCupo-cliente-nombre">
                  <span>{cliente.nombre} {cliente.apellido}</span>
                </div>
              </li>
            );
          })
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
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <input
            type="text"
            value={info.email}
            onChange={(e) => handleInputChange(e, (value) => setInfo(prev => ({ ...prev, email: value })))}
          />
          <FaCopy className="copy-icon" onClick={() => handleCopy(info.email)} />
        </div>
      </div>
      
      <div className="BuscarCupo-form-group">
        <label>Contraseña:</label>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <input
            type="text"
            value={info.password}
            onChange={(e) => handleInputChange(e, (value) => setInfo(prev => ({ ...prev, password: value })))}
          />
          <FaCopy className="copy-icon" onClick={() => handleCopy(info.password)} />
        </div>
      </div>
      
      <div className="BuscarCupo-form-group">
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
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={info.enlace}
                      onChange={(e) => handleInputChange(e, (value) => setInfo(prev => ({ ...prev, enlace: value })))}
                    />
                    <FaCopy className="copy-icon" onClick={() => handleCopy(info.enlace)} />
                  </div>
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
          {!packages.includes(info.package) && (
            <option value={info.package}>{info.package}</option>
          )}
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

{isClientInfoVisible && (
  <div className="BuscarCupo-info-modal" onClick={handleClientInfoOverlayClick}>
    <div className="BuscarCupo-informacionclientes">
      <h3>Información del Cliente:</h3>
      <div className="BuscarCupo-info-item">
        <span>Email: {selectedClientInfo.email}</span>
        <FaCopy className="copy-icon" onClick={() => handleCopy(selectedClientInfo.email)} />
      </div>
      <div className="BuscarCupo-info-item">
        <span>Password: {selectedClientInfo.password}</span>
        <FaCopy className="copy-icon" onClick={() => handleCopy(selectedClientInfo.password)} />
      </div>
    </div>
  </div>
)}



    </div>
  );
}

export default BuscarCupo;