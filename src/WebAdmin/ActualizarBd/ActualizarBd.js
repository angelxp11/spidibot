import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import Carga from '../../Loada/Carga';
import { toast } from 'react-toastify';
import { collection, getDocs, writeBatch } from "firebase/firestore";

const ActualizarBd = ({ onClose }) => {
  const [loading, setLoading] = useState(true);
  const [hasUpdated, setHasUpdated] = useState(false); // Nuevo estado para controlar la actualización

  useEffect(() => {
    const actualizarBaseDeDatos = async () => {
      if (hasUpdated) return; // Si ya se ha actualizado, no hacemos nada

      try {
        const clientesRef = collection(db, 'clientes');
        const serviciosRef = collection(db, 'Servicios');
      
        await actualizarClientes(clientesRef);
        await actualizarGrupos(serviciosRef);
        
        // Muestra solo un toast al final
        setLoading(false);
        setHasUpdated(true); // Marcamos que ya se ha actualizado
        onClose();
      } catch (error) {
        console.error('Error al actualizar clientes y grupos:', error);
        // Muestra solo un toast de error
        toast.error(`Error al actualizar clientes y grupos: ${error.message}`, { autoClose: 3000 });
        setLoading(false);
        onClose();
      }
    };
  
    actualizarBaseDeDatos();
  }, [onClose, hasUpdated]); // Cambiamos 'loading' por 'hasUpdated'

  const actualizarClientes = async (clientesRef) => {
    const querySnapshot = await getDocs(clientesRef);
    const batch = writeBatch(db);
  
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const fechaFinal = data.fechaFinal;
      const servicios = data.servicio || [];
  
      if (fechaFinal) {
        const estado = calcularEstadoCliente(fechaFinal);
  
        batch.update(doc.ref, {
          'PENDEJOALEJANDRO.estado': estado,
          // Removed code that changes the pagado field
        });
      }
    });
  
    await batch.commit();
  };

  const actualizarGrupos = async (serviciosRef) => {
    const querySnapshot = await getDocs(serviciosRef);
    const batch = writeBatch(db);

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      for (const [groupName, groupData] of Object.entries(data)) {
        if (typeof groupData === 'object' && groupData !== null) {
          const { fechaPago } = groupData;

          if (fechaPago) {
            const estado = calcularEstadoGrupo(fechaPago);

            // Actualiza el campo estado o lo crea si no existe
            batch.set(doc.ref, {
              [groupName]: {
                ...groupData,
                estado: estado
              }
            }, { merge: true });
          }
        }
      }
    });

    await batch.commit();
  };

  const calcularEstadoCliente = (fechaFinal) => {
    // Verificar si la fecha final es "07/07/2003"
    if (fechaFinal === '07/07/2003') {
      return '😶‍🌫️';
    }
    const [day, month, year] = fechaFinal.split('/');
    const sdf = new Date(year, month - 1, day); // Crear fecha en formato correcto
    const fechaActual = new Date();
    const diferencia = sdf - fechaActual;
    const diasRestantes = diferencia / (24 * 60 * 60 * 1000);

    if (diasRestantes > 2) {
      return '✅';
    } else if (diasRestantes > -1) {
      return '⚠️';
    } else {
      return '❌';
    }
  };

  const calcularEstadoGrupo = (fechaPago) => {
    // Verificar si la fecha de pago es "07/07/2003"
    if (fechaPago === '07/07/2003') {
      return '😶‍🌫️';
    }
    const [day, month, year] = fechaPago.split('/');
    const sdf = new Date(year, month - 1, day); // Crear fecha en formato correcto
    const fechaActual = new Date();
    const diferencia = sdf - fechaActual;
    const diasRestantes = Math.floor(diferencia / (24 * 60 * 60 * 1000));

    if (diasRestantes >= 3) {
      return '✅';
    } else if (diasRestantes >= -1) {
      return '⚠️';
    } else {
      return '❌';
    }
  };

  return loading ? <Carga /> : null;
};

export default ActualizarBd;
