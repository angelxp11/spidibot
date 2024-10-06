import React, { useEffect, useState } from 'react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { getDocs, collection, query, where, doc, getDoc } from 'firebase/firestore';
import '../WebUsuario/home.css';
import ContainerPlatform from './ContainerPlatform'; // Componente contenedor
import ContainerPlatformP from './ContainerPlatformP'; // Componente contenedor con proveedor
import Carga from '../Loada/Carga'; // Importa tu componente de carga
import { db } from '../firebase';
import copyIcon from '../imagenes/copy.png'; // Ajusta la ruta a tu archivo copy.png
import { ToastContainer, toast } from 'react-toastify'; // Importa toast
import 'react-toastify/dist/ReactToastify.css'; // Importa los estilos del toast

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

  useEffect(() => {
    if (!user) {
      navigate('/spidibot');
    } else {
      fetchUserServices();
    }
  }, [user, navigate]);

  // Función para obtener servicios, grupos y estado del usuario autenticado
  const fetchUserServices = async () => {
    try {
      const email = user.email;
      const q = query(collection(db, 'clientes'), where('email', '==', email));
      const querySnapshot = await getDocs(q);
      const serviciosData = [];
      const emailCounts = {}; 
  
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const nombreCliente = data.nombre || 'Nombre no disponible'; 
        setNombreCliente(nombreCliente);
  
        const fechaFinal = data.fechaFinal || 'Fecha no disponible'; 
  
        if (data.servicio && data.grupo && data.notas) {
          data.servicio.forEach((servicio, index) => {
            const grupo = data.grupo[index]; 
            const estado = data.PENDEJOALEJANDRO.estado;
  
            serviciosData.push({
              servicio,
              grupo,
              estado,
              fechaFinal, 
              nombreCliente,
              nota: data.notas[index] || ''  // Agregamos la nota correspondiente
            });
          });
  
          emailCounts[email] = (emailCounts[email] || 0) + 1; 
        }
      });
  
      const isProvider = serviciosData.length > 0 && serviciosData[0].estado === 'Proveedor';
      const isEmailRepeated = emailCounts[email] > 1;
  
      setHasProvider(isProvider || isEmailRepeated); 
      setServicios(serviciosData);
    } catch (error) {
      console.error('Error al obtener los servicios:', error);
    } finally {
      setLoading(false); 
    }
  };

  const getUserName = () => {
    if (nombreCliente) {
      return `Hola, ${nombreCliente.charAt(0).toUpperCase() + nombreCliente.slice(1).toLowerCase()}!`; // Personaliza el saludo
    }
    return 'Hola, Usuario!'; // Saludo por defecto
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/spidibot');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
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

          setModalData({
            email: cuentaInfo.email,
            password: cuentaInfo.password,
            nota, // Agregar la nota al modalData
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

  return (
    <div className="home-container">
      <h1 className="greeting">{getUserName()}</h1>
      <p className="welcome-message">Bienvenido a tu panel de usuario.</p>

      <div className="platforms-container">
        {servicios.length > 0 ? (
          servicios.map((servicioData, index) => (
            <div key={index}>
              {hasProvider ? ( // Mostrar ContainerPlatformP si hay proveedor o si el email se repite
                <ContainerPlatformP
                  title={servicioData.servicio}
                  nombreCliente={servicioData.nombreCliente} // Pasa el nombreCliente
                  grupo={servicioData.grupo}
                  fechaFinal={servicioData.fechaFinal} // Pasa la fechaFinal
                  estado={servicioData.estado}
                  onMoreInfo={() => handleMoreInfo(servicioData.servicio, servicioData.grupo, servicioData.servicio, servicioData.estado)} // Pasa el estado
                />
              ) : ( // Mostrar ContainerPlatform si no hay proveedor
                <ContainerPlatform
                  title={servicioData.servicio}
                  nombreCliente={servicioData.nombreCliente} // Pasa el nombreCliente
                  grupo={servicioData.grupo}
                  fechaFinal={servicioData.fechaFinal} // Pasa la fechaFinal
                  estado={servicioData.estado}
                  onMoreInfo={() => handleMoreInfo(servicioData.servicio, servicioData.grupo, servicioData.servicio, servicioData.estado)} // Pasa el estado
                />
              )}
            </div>
          ))
        ) : (
          <p>No hay servicios disponibles.</p>
        )}
      </div>

      {/* Pantalla de carga como overlay */}
      {loading && <div className="loading-overlay"><Carga /></div>}

      <div className="button-group">
        <button onClick={handleLogout} className="logout-button">
          Cerrar Sesión
        </button>
      </div>

     {/* Modal para mostrar detalles de la cuenta */}
     {modalOpen && modalData && (
        <div className="modal-overlays">
          <div className="modal-contents">
            <h2>Detalles de la cuenta</h2>
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
            <button onClick={handleCloseModal} className="home-button">Cerrar</button>
          </div>
        </div>
      )}

      {/* Muestra el mensaje de asesor si está disponible */}
      {adviceMessage && <p className="advice-message">{adviceMessage}</p>}

      <ToastContainer />
    </div>
  );
}

export default Home;
