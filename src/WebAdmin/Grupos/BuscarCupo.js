import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import './BuscarCupo.css';

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

function BuscarCupo({ onClose }) {
  const [servicio, setServicio] = useState('');
  const [grupo, setGrupo] = useState('');
  const [gruposDisponibles, setGruposDisponibles] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [selectedClientes, setSelectedClientes] = useState({});
  const [clientesColores, setClientesColores] = useState({});
  const [info, setInfo] = useState({ email: '', password: '', fechaComienzo: '', fechaPago: '' });
  const [infoDocId, setInfoDocId] = useState('');
  const [isResultadosVisible, setIsResultadosVisible] = useState(false);
  const [isInfoVisible, setIsInfoVisible] = useState(false);

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
            notas: grupoInfo.notas || '' // Asegúrate de incluir el campo notas
          });
          setInfoDocId(servicioDoc.id); // Guarda el ID del documento
          setIsInfoVisible(true); // Muestra la información del grupo
        } else {
          alert('No se encontró información para el grupo especificado.');
        }
      } else {
        alert('No se encontró el servicio especificado.');
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
      alert('Información copiada al portapapeles.');
    }).catch(err => {
      console.error('Error al copiar al portapapeles: ', err);
    });
  };
  
  

  const handleSaveChanges = async () => {
    // Verificar si el campo notas existe en el objeto de servicio
    const updatedInfo = {
      email: info.email,
      password: info.password,
      fechaComienzo: guardarFechas(info.fechaComienzo),
      fechaPago: guardarFechas(info.fechaPago),
      notas: info.notas || '' // Asegúrate de que el campo notas se incluya
    };
  
    try {
      const servicioRef = doc(db, 'Servicios', infoDocId);
      
      // Actualizar el grupo con la información
      await updateDoc(servicioRef, {
        [grupo]: updatedInfo // Actualiza el grupo con toda la información, incluyendo notas
      });
  
      alert('Cambios guardados con éxito.');
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
    <div className="overlay">
      <div className="buscar-cupo">
        <h2>Buscar Clientes</h2>
        <div className="form-group">
          <label>Servicio:</label>
          <select value={servicio} onChange={handleSelectChange}>
            <option value="">Selecciona un servicio</option>
            <option value="NETFLIX,NETFLIXTV,NETFLIXME">NETFLIX,NETFLIXTV,NETFLIXME</option>
            <option value="DISNEY">DISNEY</option>
            <option value="PRIMEVIDEO">PRIMEVIDEO</option>
            <option value="MAX">MAX</option>
            <option value="PARAMOUNT">PARAMOUNT</option>
            <option value="CRUNCHY">CRUNCHY</option>
            <option value="SPOTIFY">SPOTIFY</option>
            <option value="YOUTUBE">YOUTUBE</option>
            <option value="VIX">VIX</option>
          </select>
        </div>
        <div className="form-group">
          <label>Grupo:</label>
          <select value={grupo} onChange={handleGrupoChange} disabled={!servicio}>
            <option value="">Selecciona un grupo</option>
            {gruposDisponibles.map((grupo) => (
              <option key={grupo} value={grupo}>{grupo}</option>
            ))}
          </select>
        </div>
        <button onClick={handleSearch}>Buscar</button>
        <button onClick={handleInfoClick}>Información</button>
        <button onClick={onClose}>Cerrar</button>
      </div>

      {isResultadosVisible && (
        <div className="resultados-modal">
          <div className="modal-content1">
            <button className="close-btn" onClick={() => setIsResultadosVisible(false)}>Cerrar</button>
            <h3>Resultados:</h3>
            <ul>
              {clientes.length === 0 ? (
                <li>No se encontraron clientes.</li>
              ) : (
                clientes.map(cliente => (
                  <li
                    key={cliente.id}
                    className="cliente-item"
                    style={{ backgroundColor: clientesColores[cliente.id] || 'transparent' }}
                  >
                    <input
                      type="checkbox"
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
  <div className="info-modal">
    <div className="modal-content1">
      <button className="close-btn" onClick={() => setIsInfoVisible(false)}>Cerrar</button>
      <h3>Información del Grupo:</h3>
      <div className="form-group">
        <label>Email:</label>
        <input
          type="text"
          value={info.email}
          onChange={(e) => handleInputChange(e, (value) => setInfo(prev => ({ ...prev, email: value })))}
        />
      </div>
      <div className="form-group">
        <label>Password:</label>
        <input
          type="text"
          value={info.password}
          onChange={(e) => handleInputChange(e, (value) => setInfo(prev => ({ ...prev, password: value })))}
        />
      </div>
      <div className="form-group">
        <label>Fecha de Comienzo:</label>
        <input
          type="date"
          value={info.fechaComienzo}
          onChange={(e) => handleInputChange(e, (value) => setInfo(prev => ({ ...prev, fechaComienzo: value })))}
        />
      </div>
      <div className="form-group">
        <label>Fecha de Pago:</label>
        <input
          type="date"
          value={info.fechaPago}
          onChange={(e) => handleInputChange(e, (value) => setInfo(prev => ({ ...prev, fechaPago: value })))}
        />
      </div>
      {/* Nuevo campo para Notas */}
      <div className="form-group">
        <label>Notas:</label>
        <input
          type="text"
          value={info.notas}
          onChange={(e) => handleInputChange(e, (value) => setInfo(prev => ({ ...prev, notas: value })))}
          style={{ height: '170px' }} // Establecer altura de 170px
        />
      </div>
      <button onClick={handleCopyPaste}>Copiar</button>
      <button onClick={handleSaveChanges}>Guardar Cambios</button>
    </div>
  </div>
)}

    </div>
  );
}

export default BuscarCupo;