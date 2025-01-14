import React, { useEffect, useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../Registrar/Registrar.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import Carga from '../Loada/Carga';
import Login from '../IniciarSesion/Login.js';

function Registrar() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (showLogin) {
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
  }, [showLogin]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    if (password.length < 6) {
      toast.error('Contraseña demasiado corta, intenta que sea mayor a 6 caracteres');
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userEmail = userCredential.user.email;
      const userDocRef = doc(db, 'usuarios', userCredential.user.uid);
      await setDoc(userDocRef, {
        email: userEmail,
        createdAt: new Date(),
      });
      navigate('/spidibot');
    } catch (error) {
      console.error('Error al registrar el usuario: ' + error.message);
      toast.error('Error al registrar el usuario: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userDocRef = doc(db, 'usuarios', user.uid);

      // Check if the user already exists
      const userDoc = await userDocRef.get();
      if (!userDoc.exists) {
        // New user, create a document for them
        await setDoc(userDocRef, {
          email: user.email,
          createdAt: new Date(),
        });
      }
      navigate('/spidibot');
    } catch (error) {
      console.error('Error en Google Login: ' + error.message);
      toast.error('Error al iniciar sesión con Google: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleLoginToggle = () => {
    setShowLogin(true);
  };

  return (
    <div className="registro-container">
      <ToastContainer />
      {loading && <Carga />}
      {!loading && !showLogin && (
        <div className="registro-box">
          <h1>Registrar</h1>
          <form className="registro-form" onSubmit={handleSubmit}>
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
            <button type="submit" className="register-buttons">Registrar</button>
          </form>
          {/* Botón de inicio de sesión con Google */}
          <button onClick={handleGoogleSignIn} className="google-registering-button">
            <img src={require('../recursos/google-logo.svg').default} alt="Google" className="google-icon" />
            <span>Registrate con Google</span>
          </button>
          <br />
          {/* Texto que invita a iniciar sesión */}
          <p className="reegister-link">
            ¿Ya tienes una cuenta? <span onClick={handleLoginToggle}>Iniciar Sesión</span>
          </p>
        </div>
      )}
      {showLogin && <Login />}
    </div>
  );
}

export default Registrar;
