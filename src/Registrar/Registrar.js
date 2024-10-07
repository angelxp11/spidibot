import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth'; 
import { auth, db } from '../firebase'; 
import { doc, setDoc } from 'firebase/firestore'; 
import { useNavigate } from 'react-router-dom'; 
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true); // Mostrar pantalla de carga al iniciar sesión

    try {
      // Crear el usuario con Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userEmail = userCredential.user.email;

      // Agregar el nuevo usuario a la colección 'usuarios' en Firestore
      const userDocRef = doc(db, 'usuarios', userCredential.user.uid); // Usa el uid en lugar del email
      await setDoc(userDocRef, {
        email: userEmail,
        createdAt: new Date(),
        // Puedes agregar más campos aquí según sea necesario
      });

      // Redirigir al usuario después del registro
      navigate('/spidibot/'); // Cambia esta ruta según sea necesario
    } catch (error) {
      console.error('Error al registrar el usuario: ' + error.message); // Muestra el error en la consola
    } finally {
      setLoading(false); // Ocultar la pantalla de carga cuando termine el proceso
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
            <button type="submit" className="registro-button">Registrar</button>
            <div style={{ marginTop: '10px' }}></div>
          </form>
          <button type="button" className="spidi-button" onClick={handleLoginToggle}>
            Iniciar Sesión
          </button>
        </div>
      )}
      {showLogin && <Login />}
    </div>
  );
}

export default Registrar;
