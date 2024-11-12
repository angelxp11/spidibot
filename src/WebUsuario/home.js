import React, { useEffect, useState } from 'react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { getDocs, collection, query, where, doc, getDoc } from 'firebase/firestore';
import '../WebUsuario/home.css';
import ContainerPlatform from './plataform/plataformclientes/ContainerPlatform'; // Componente contenedor
import ContainerPlatformP from './plataform/plataformproveedores/ContainerPlatformP'; // Componente contenedor con proveedor
import ContainerPlatformService from '../WebUsuario/addservice/containerPlatformService.js'; // Asegúrate de la ruta correcta
import Carga from '../Loada/Carga'; // Importa tu componente de carga
import { db } from '../firebase';
import copyIcon from '../imagenes/copy.png'; // Ajusta la ruta a tu archivo copy.png
import { ToastContainer, toast } from 'react-toastify'; // Importa toast
import 'react-toastify/dist/ReactToastify.css'; // Importa los estilos del toast
import MensajesSiNo from '../recursos/MensajesSiNo.js'; // Importa tu componente
function Home() {
  const user = auth.currentUser; // Usuario autenticado
  const navigate = useNavigate();
  const [servicios, setServicios] = useState([]); // Estado para almacenar servicios
  const [loading, setLoading] = useState(true); // Estado de carga
  const [nombreCliente, setNombreCliente] = useState(''); // Estado para almacenar el nombre del cliente
  const [modalData, setModalData] = useState(null); // Estado para almacenar datos del modal
  const [modalOpen, setModalOpen] = useState(false); // Estado para controlar la apertura del modal
  const [adviceMessage, setAdviceMessage] = useState(''); // Estado para manejar el mensaje de asesor
  const [hasProvider, setHasProvider] = useState(false); // Estado para comprobar si hay proveedor
  const [showSteps, setShowSteps] = useState(false); // Estado para manejar la visualización de pasos
  const [tvSteps, setTvSteps] = useState([]); // Estado para almacenar los pasos del TV
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);
  const [showServiceContainers, setShowServiceContainers] = useState(true); // Estado para mostrar el contenedor de servicios
  const [showClientContainers, setShowClientContainers] = useState(false); // Estado para mostrar el contenedor de clientes
  const [serviciosEnVenta, setServiciosEnVenta] = useState([]); // Nuevo estado para los servicios a la venta
  const [isInventarioVisible, setInventarioVisible] = useState(false); // Estado para manejar la visibilidad del inventarioomienza como invisible
  const [isServiciosClientesVisible, setServiciosClientesVisible] = useState(true); // Comienza como visible
  
  useEffect(() => {
    if (!user) {
      navigate('/spidibot');
    } else {
      fetchUserServices();
    }
  }, [user, navigate]);
  // Función para alternar entre inventario y servicios del cliente
  const toggleVisibility = async () => {
    setLoading(true); // Activa la pantalla de carga

    // Obtiene servicios según el estado actual
    if (!isInventarioVisible) {
        await fetchServiciosEnVenta(); // Obtiene servicios en venta solo cuando se muestra el inventario
    } else {
        await fetchUserServices(); // Obtiene servicios del usuario solo cuando se muestran los servicios del cliente
    }

    // Alterna la visibilidad
    setInventarioVisible(prev => !prev); // Alterna el inventario
    setServiciosClientesVisible(prev => !prev); // Alterna los servicios del cliente

    setLoading(false); // Finaliza la carga
};

  const fetchServiciosEnVenta = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'inventario'));
      const serviciosData = querySnapshot.docs.map(doc => ({
        id: doc.id, // ID del documento
        ...doc.data(), // Obtén todos los datos del documento
      }));
      setServiciosEnVenta(serviciosData);
    } catch (error) {
      console.error('Error al obtener servicios en venta:', error);
    } finally {
      setLoading(false); 
    }
  };
  const handleMoreInfos = (id) => {
    // Lógica para mostrar más información sobre el servicio
    console.log('Más información sobre el servicio ID:', id);
  };

  const handleBuy = (id) => {
    // Lógica para comprar el servicio
    console.log('Comprar servicio ID:', id);
  };
  

  // Función para obtener servicios, grupos y estado del usuario autenticado
  const fetchUserServices = async () => {
    try {
      const email = user.email;
      const q = query(collection(db, 'clientes'), where('email', '==', email));
      const querySnapshot = await getDocs(q);
      const serviciosData = [];
      let isProveedor = false; // Bandera para verificar si el usuario es proveedor
      let providerData = null; // Para almacenar los datos del proveedor si se encuentra
      let matchingDocuments = []; // Para llevar un registro de documentos con el correo coincidente
  
      // Recopilar todos los documentos coincidentes
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        matchingDocuments.push(data);
  
        // Verificar si este documento es un proveedor
        if (data.proveedor === 'sí') {
          isProveedor = true;
          providerData = data; // Almacenar datos del proveedor
        }
  
        const nombreCliente = data.nombre || 'Nombre no disponible';
        setNombreCliente(nombreCliente);
  
        const fechaFinal = data.fechaFinal || 'Fecha no disponible';
  
        if (data.servicio && data.grupo && data.notas) {
          data.servicio.forEach((servicio, index) => {
            const grupo = data.grupo[index] || 'Grupo no disponible';
            const estado = data.PENDEJOALEJANDRO?.estado || 'Estado no disponible';
  
            serviciosData.push({
              servicio,
              grupo,
              estado,
              fechaFinal,
              nombreCliente,
              nota: data.notas[index] || 'Nota no disponible',
            });
          });
        }
      });
  
      console.log("Servicios Data:", serviciosData); // Verifica el contenido aquí
      setServicios(serviciosData);
  
      // Aquí puedes establecer el estado de hasProvider en función de isProveedor
      setHasProvider(isProveedor);
    } catch (error) {
      console.error('Error al obtener los servicios:', error);
    } finally {
      setLoading(false);
    }
  };
  
  

  const fetchTvSteps = async (servicioNombre) => {
    try {
      // Normalizar el nombre del servicio
      const normalizedServiceName = servicioNombre.toUpperCase();
      
      // Verificar si el servicio es uno de los mencionados
      const docRef = doc(db, 'pasostv', 
        ['NETFLIX', 'NETFLIXTV', 'NETFLIXME'].includes(normalizedServiceName) 
        ? 'NETFLIX' 
        : normalizedServiceName
      );
  
      const docSnap = await getDoc(docRef);
  
      if (docSnap.exists()) {
        const data = docSnap.data();
        // Divide los pasos por la coma y elimina espacios en blanco adicionales
        const stepsArray = data.tv.split(',').map(step => step.trim());
        setTvSteps(stepsArray);
      } else {
        console.log('No hay pasos disponibles para este servicio.');
        setTvSteps(['No hay pasos disponibles para este servicio.']);
      }
    } catch (error) {
      console.error('Error al obtener los pasos del TV:', error);
      setTvSteps(['Error al cargar los pasos.']);
    }
  };

  const getUserName = () => {
    if (nombreCliente) {
      return `Hola, ${nombreCliente.charAt(0).toUpperCase() + nombreCliente.slice(1).toLowerCase()}!`; // Personaliza el saludo
    }
    return 'Hola, Usuario!'; // Saludo por defecto
  };
  const handleLogout = async () => {
    setShowConfirmLogout(true);
  };

  const confirmLogout = async () => {
    setShowConfirmLogout(false);
    try {
      await signOut(auth);
      navigate('/spidibot');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const cancelLogout = () => {
    setShowConfirmLogout(false);
  };
  // Función para manejar el clic en "Más Información"
  const handleMoreInfo = async (servicioId, grupo, servicioNombre, estado) => {
    if (servicioNombre === "YOUTUBE" || servicioNombre === "SPOTIFY") {
      setAdviceMessage('Comunicarse con su asesor');
      return;
    }
  
    if (servicioNombre.toUpperCase() === "NETFLIXME") {
      toast.info('El servicio es directamente con tu correo');
      return;
    }
  
    setLoading(true);
    setModalOpen(true);
    setAdviceMessage('');
  
    try {
      let docRef;
  
      if (servicioNombre.toUpperCase() === "NETFLIX" || servicioNombre.toUpperCase() === "NETFLIXTV") {
        docRef = doc(db, 'Servicios', 'NETFLIX,NETFLIXTV,NETFLIXME');
      } else {
        docRef = doc(db, 'Servicios', servicioId);
      }
  
      const docSnap = await getDoc(docRef);
  
      if (docSnap.exists()) {
        const data = docSnap.data();
        const cuentaInfo = data[grupo];
        const validStates = ["✅", "⚠️"];
  
        if (cuentaInfo && validStates.includes(estado)) {
          // Obtener el índice del servicio
          const servicioIndex = servicios.findIndex(
            (serv) => serv.servicio === servicioNombre && serv.grupo === grupo
          );
          const nota = servicioIndex !== -1 ? servicios[servicioIndex].nota : 'Nota no disponible'; // Obtener la nota
  
          // Asegúrate de que el servicio esté en modalData
          setModalData({
            email: cuentaInfo.email,
            password: cuentaInfo.password,
            nota, 
            servicio: servicioNombre, // Asegúrate de que el nombre del servicio esté en modalData
          });
        } else {
          setModalData(null);
          toast.error('No se puede mostrar la información de la cuenta debido al estado.');
        }
      }
    } catch (error) {
      console.error('Error al obtener la información del servicio:', error);
    } finally {
      setLoading(false);
    }
  };

  // Función para cerrar el modal
  const handleCloseModal = () => {
    setModalOpen(false);
    setModalData(null); // Limpiar los datos del modal al cerrar
    setAdviceMessage(''); // Limpiar el mensaje de asesor al cerrar
  };

  // Función para copiar al portapapeles y mostrar un toast
  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    toast.success(`${type} copiado al portapapeles!`, { autoClose: 1000 }); // Muestra el toast con duración de 1 segundo
  };

  // Función para capitalizar la primera letra en mayúscula
  const capitalizeFirstLetter = (string) => {
    if (!string) return '';
    
    // Verificar si la cadena es uno de los nombres de servicio
    if (['NETFLIX', 'NETFLIXME', 'NETFLIXTV'].includes(string.toUpperCase())) {
      return 'Netflix'; // Retorna 'NETFLIX' si es uno de los servicios
    }
    
    // Capitalizar la primera letra para otros casos
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  };
  
const handleShowSteps = async (servicioNombre) => {
  setShowSteps(true);
  await fetchTvSteps(servicioNombre); // Obtener los pasos del servicio
};

const handleViewServices = () => {
  if (showClientContainers) {
    setShowClientContainers(false);
    setShowServiceContainers(true);
  }
};



return (
  <div className="home-container">
    <h1 className="greeting">{getUserName()}</h1>
    <p className="welcome-message">Bienvenido a tu panel de usuario.</p>

    <div className="container-inventario" style={{ display: isInventarioVisible ? 'block' : 'none' }}>
    <h2 class="h2titleblanco">Servicios a la Venta</h2>
        {serviciosEnVenta.length > 0 ? (
          serviciosEnVenta.map((servicio) => (
            <ContainerPlatformService 
              key={servicio.id} 
              id={servicio.id} 
              precio={servicio.precio} 
              info={servicio.info} 
              onBuy={() => handleBuy(servicio.id)} // Manejar la compra
            />
          ))
        ) : (
          <p>No hay servicios disponibles en el inventario.</p>
        )}
      </div>


      {/* Contenedor de plataformas */}
      <div className="platforms-container" style={{ display: isServiciosClientesVisible ? 'block' : 'none' }}>
    {servicios.length > 0 ? (
      showServiceContainers ? ( // Muestra los servicios para comprar
        servicios.map((servicioData, index) => (
          <div key={index}>
            {console.log(servicioData)} {/* Agrega este log para verificar el contenido */}
            {hasProvider ? ( // Mostrar ContainerPlatformP si hay proveedor
              <ContainerPlatformP
                title={typeof servicioData.servicio === 'string' ? servicioData.servicio : servicioData.servicio.displayTitle} // Asegúrate de que sea un string
                nombreCliente={typeof servicioData.nombreCliente === 'string' ? servicioData.nombreCliente : 'Nombre no disponible'}
                grupo={typeof servicioData.grupo === 'string' ? servicioData.grupo : 'Grupo no disponible'}
                fechaFinal={typeof servicioData.fechaFinal === 'string' ? servicioData.fechaFinal : 'Fecha no disponible'}
                estado={typeof servicioData.estado === 'string' ? servicioData.estado : 'Estado no disponible'}
                onMoreInfo={() => handleMoreInfo(servicioData.servicio, servicioData.grupo, servicioData.servicio, servicioData.estado)}
              />
            ) : ( // Mostrar ContainerPlatform si no hay proveedor
              <ContainerPlatform
                title={typeof servicioData.servicio === 'string' ? servicioData.servicio : servicioData.servicio.displayTitle} // Asegúrate de que sea un string
                nombreCliente={typeof servicioData.nombreCliente === 'string' ? servicioData.nombreCliente : 'Nombre no disponible'}
                grupo={typeof servicioData.grupo === 'string' ? servicioData.grupo : 'Grupo no disponible'}
                fechaFinal={typeof servicioData.fechaFinal === 'string' ? servicioData.fechaFinal : 'Fecha no disponible'}
                estado={typeof servicioData.estado === 'string' ? servicioData.estado : 'Estado no disponible'}
                onMoreInfo={() => handleMoreInfo(servicioData.servicio, servicioData.grupo, servicioData.servicio, servicioData.estado)}
              />
            )}
          </div>
        ))
      ) : ( // Muestra los servicios ya adquiridos
        servicios.map((servicioData, index) => (
          <div key={index}>
            {console.log(servicioData)} {/* Agrega este log para verificar el contenido */}
            {hasProvider ? ( // Mostrar ContainerPlatformP si hay proveedor
              <ContainerPlatformP
                title={typeof servicioData.servicio === 'string' ? servicioData.servicio : servicioData.servicio.displayTitle} // Asegúrate de que sea un string
                nombreCliente={typeof servicioData.nombreCliente === 'string' ? servicioData.nombreCliente : 'Nombre no disponible'}
                grupo={typeof servicioData.grupo === 'string' ? servicioData.grupo : 'Grupo no disponible'}
                fechaFinal={typeof servicioData.fechaFinal === 'string' ? servicioData.fechaFinal : 'Fecha no disponible'}
                estado={typeof servicioData.estado === 'string' ? servicioData.estado : 'Estado no disponible'}
                onMoreInfo={() => handleMoreInfo(servicioData.servicio, servicioData.grupo, servicioData.servicio, servicioData.estado)}
              />
            ) : ( // Mostrar ContainerPlatform si no hay proveedor
              <ContainerPlatform
                title={typeof servicioData.servicio === 'string' ? servicioData.servicio : servicioData.servicio.displayTitle} // Asegúrate de que sea un string
                nombreCliente={typeof servicioData.nombreCliente === 'string' ? servicioData.nombreCliente : 'Nombre no disponible'}
                grupo={typeof servicioData.grupo === 'string' ? servicioData.grupo : 'Grupo no disponible'}
                fechaFinal={typeof servicioData.fechaFinal === 'string' ? servicioData.fechaFinal : 'Fecha no disponible'}
                estado={typeof servicioData.estado === 'string' ? servicioData.estado : 'Estado no disponible'}
                onMoreInfo={() => handleMoreInfo(servicioData.servicio, servicioData.grupo, servicioData.servicio, servicioData.estado)}
              />
            )}
          </div>
        ))
      )
    ) : (
      <p>No hay servicios disponibles.</p>
    )}
  </div>


    {/* Pantalla de carga como overlay */}
    {loading && <div className="loading-overlay"><Carga /></div>}
    <div className="button-group">
                <button onClick={toggleVisibility} className="logout-button">
                    {isInventarioVisible ? 'Ver mis servicios' : 'Adquirir servicios'}

                </button>
            </div>
  

    <div className="button-group">
      <button onClick={handleLogout} className="logout-button">
        Cerrar Sesión
      </button>
    </div>

    {/* Modal para mostrar detalles de la cuenta */}
    {modalOpen && modalData && (
      <div className="modal-overlays">
        <div className="modal-contents">
          {showSteps ? (
            // Mostrar los pasos para ingresar al TV desde Firestore
            <>
              <h2 className="h2negro">Como ingresar Tv</h2>
              <div className="steps-container">
                {tvSteps.length > 0 ? (
                  tvSteps.map((step, index) => (
                    <p key={index}><strong>Paso {index + 1}:</strong> {step}</p>
                  ))
                ) : (
                  <p>No hay pasos disponibles.</p>
                )}
              </div>
              <button
                onClick={() => setShowSteps(false)} // Volver a la información de acceso
                className="home-button"
              >
                Mostrar información de acceso
              </button>
            </>
          ) : (
            // Mostrar la información de acceso
            <>
              <h2 className="h2negro">Detalles de la cuenta</h2>
              <div className="modal-item">
                <label>Email:</label>
              </div>
              <div className="modal-item">
                <p>{modalData.email}</p>
                <div className="copy-button copy-email" onClick={() => copyToClipboard(modalData.email, 'Email')}>
                  <img src={copyIcon} alt="Copiar Email" style={{ width: '20px', height: '20px', marginRight: '5px' }} />
                  Copiar Email
                </div>
              </div>
              <div className="modal-item">
                <label>Contraseña:</label>
              </div>
              <div className="modal-item">
                <p>{modalData.password}</p>
                <div className="copy-button copy-password" onClick={() => copyToClipboard(modalData.password, 'Contraseña')}>
                  <img src={copyIcon} alt="Copiar Contraseña" style={{ width: '20px', height: '20px', marginRight: '5px' }} />
                  Copiar Contraseña
                </div>
              </div>
              <div className="modal-item">
                <label>Nota:</label>
              </div>
              <div className="modal-item">
                <p>{modalData.nota || 'No hay nota disponible'}</p>
              </div>
              {/* Aquí se agrega el enlace con el servicio formateado */}
              <div className="modal-item">
                <a
                  href=""
                  className="help-link"
                  onClick={(e) => {
                    e.preventDefault();
                    handleShowSteps(modalData.servicio); // Cargar y mostrar los pasos al hacer clic
                  }}
                >
                  Pasos para ingresar a <strong>{capitalizeFirstLetter(modalData.servicio)}</strong> en el TV
                </a>
              </div>
              {/* Botón "Cerrar" solo se muestra cuando no está en modo pasos */}
              <button onClick={handleCloseModal} className="home-button">
                Cerrar
              </button>
            </>
          )}
        </div>
      </div>
    )}

    {/* Muestra el mensaje de asesor si está disponible */}
    {adviceMessage && <p className="advice-message">{adviceMessage}</p>}
    
    {/* Mostrar el mensaje de confirmación si está activo */}
    {showConfirmLogout && (
      <MensajesSiNo onClose={cancelLogout} onConfirm={confirmLogout} />
    )}

    <ToastContainer />
  </div>
);

}

export default Home;
