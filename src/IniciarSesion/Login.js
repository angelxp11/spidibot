import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase'; // Asegúrate de importar Firestore (db)
import { doc, getDoc } from 'firebase/firestore'; // Importa funciones de Firestore
import { useNavigate } from 'react-router-dom'; // Para la redirección
import './Login.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import Carga from '../Loada/Carga';
import Registro from '../Registrar/Registrar.js'; // Asegúrate de importar el componente de registro
import { toast, ToastContainer } from 'react-toastify'; // Importa Toast para mostrar mensajes

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false); // Estado para manejar la carga
  const [isLoginVisible, setIsLoginVisible] = useState(true); // Estado para manejar la visibilidad
  const navigate = useNavigate(); // Hook para la redirección

  // Cambiar el estilo del body basado en la visibilidad de login o registro
  useEffect(() => {
    if (isLoginVisible) {
      document.body.classList.add('iniciar-sesion');
      document.body.classList.remove('registrar');
    } else {
      document.body.classList.add('registrar');
      document.body.classList.remove('iniciar-sesion');
    }
    return () => {
      document.body.classList.remove('iniciar-sesion');
      document.body.classList.remove('registrar');
    };
  }, [isLoginVisible]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true); // Mostrar pantalla de carga al iniciar sesión

    try {
      // Iniciar sesión con Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userEmail = userCredential.user.email;

      // Buscar si el usuario es admin en la colección 'admin'
      const adminDocRef = doc(db, 'admin', userEmail);
      const adminDoc = await getDoc(adminDocRef);

      if (adminDoc.exists()) {
        // Si el documento existe, es admin, redirige a WebAdmin
        navigate('/WebAdmin/home');
      } else {
        // Si no existe, redirige a WebUsuario
        navigate('/spidibot/');
      }
    } catch (error) {
      // Muestra el error en un toast
      toast.error('Error en el correo electrónico o la contraseña');
      console.error(error.message);
    } finally {
      setLoading(false); // Ocultar la pantalla de carga cuando termine el proceso
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleVisibility = () => {
    setIsLoginVisible(false); // Cambia la visibilidad a false para mostrar el registro
  };

  return (
    <div className={`login-container ${!isLoginVisible ? 'hidden' : ''}`}>
      {/* Mostrar la pantalla de carga si loading es true */}
      {loading && <Carga />}
      
      {!loading && isLoginVisible && (
        <div className="login-xbox">
          {/* Contenedor de login */}
          <h1>Iniciar Sesión</h1>
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="email">Correo Electrónico:</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="input-group password-group">
              <label htmlFor="password">Contraseña:</label>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span className="password-toggle" onClick={togglePasswordVisibility}>
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
            <button type="submit" className="login-button">Iniciar Sesión</button>
          </form>
          {/* Texto que invita a registrarse */}
          <p className="register-link">
            ¿No tienes cuenta? <span onClick={toggleVisibility}>Regístrate</span>
          </p>
        </div>
      )}
      
      {!isLoginVisible && <Registro toggleVisibility={toggleVisibility} />} {/* Muestra el componente Registro */}
      
      <ToastContainer autoClose={3000} hideProgressBar /> {/* Componente de Toast para mensajes */}
    </div>
  );
}

export default Login;
