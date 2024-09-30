// Importa ToastContainer y toast
import React, { useEffect, useState } from 'react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { getDocs, collection, query, where, doc, getDoc } from 'firebase/firestore';
import '../WebUsuario/home.css';
import ContainerPlatform from './ContainerPlatform'; // Componente contenedor
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
      const serviciosData = []; // Inicializa el array aquí

      querySnapshot.forEach((doc) => {
        const data = doc.data(); // Datos del documento

        // Extrae el nombre del cliente y actualiza el estado
        if (data.nombre) {
          setNombreCliente(data.nombre);
        }

        if (data.servicio && data.grupo && data.PENDEJOALEJANDRO) {
          // Iteramos sobre los servicios y grupos
          data.servicio.forEach((servicio, index) => {
            const grupo = data.grupo[index]; // Grupo en la misma posición que el servicio
            const estado = data.PENDEJOALEJANDRO.estado; // Valor del estado dentro del campo mapa

            // Añadimos los datos del servicio, grupo y estado
            serviciosData.push({
              servicio,
              grupo,
              estado,
            });
          });
        }
      });

      setServicios(serviciosData); // Actualizamos el estado con los servicios obtenidos
    } catch (error) {
      console.error('Error al obtener los servicios:', error);
    } finally {
      setLoading(false); // Cambia el estado de carga a false cuando termine
    }
  };

  const getUserName = () => {
    if (nombreCliente) {
      return nombreCliente.charAt(0).toUpperCase() + nombreCliente.slice(1).toLowerCase();
    }
    return 'Usuario';
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
    // Si el servicio es YOUTUBE o SPOTIFY, no abrir el modal
    if (servicioNombre === "YOUTUBE" || servicioNombre === "SPOTIFY") {
      setAdviceMessage('Comunicarse con su asesor'); // Establecer el mensaje de asesor
      return; // No abrir el modal
    }

    setLoading(true); // Mostrar la pantalla de carga
    setModalOpen(true); // Abrir el modal
    setAdviceMessage(''); // Resetear el mensaje de asesor

    try {
      const docRef = doc(db, 'Servicios', servicioId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const cuentaInfo = data[grupo]; // Acceder al campo del grupo
        const validStates = ["✅", "⚠️"]; // Arreglo de estados válidos

        if (cuentaInfo && validStates.includes(estado)) { // Verifica el estado antes de establecer modalData
          setModalData({
            email: cuentaInfo.email,
            password: cuentaInfo.password,
          });
        } else {
          setModalData(null); // Limpiar los datos si el estado no es válido
          toast.error('No se puede mostrar la información de la cuenta debido al estado.'); // Mostrar mensaje en toast
        }
      }
    } catch (error) {
      console.error('Error al obtener la información del servicio:', error);
    } finally {
      setLoading(false); // Ocultar la pantalla de carga
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
    toast.success(`${type} copiado al portapapeles!`, { autoClose: 1000 }); // Muestra el toast con duración de 3 segundos
  };

  return (
    <div className="home-container">
      <h1 className="greeting">Hola, {getUserName()}!</h1>
      <p className="welcome-message">Bienvenido a tu panel de usuario.</p>
  
      <div className="platforms-container">
        {servicios.length > 0 ? (
          servicios.map((servicioData, index) => (
            <div key={index}>
              <ContainerPlatform
                title={servicioData.servicio}
                grupo={servicioData.grupo}
                estado={servicioData.estado}
                onMoreInfo={() => handleMoreInfo(servicioData.servicio, servicioData.grupo, servicioData.servicio, servicioData.estado)} // Pasa el estado
              />
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
  
            <button onClick={handleCloseModal} className="home-button">Cerrar</button>
          </div>
        </div>
      )}
      
      {/* Componente ToastContainer */}
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick={false} rtl={false} pauseOnFocusLoss draggable pauseOnHover />
    </div>
  );
}

export default Home;
