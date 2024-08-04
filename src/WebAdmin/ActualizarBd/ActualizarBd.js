import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import Carga from '../../Loada/Carga';
import { toast } from 'react-toastify';
import { collection, getDocs, writeBatch } from "firebase/firestore";

const ActualizarBd = ({ onClose }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const actualizarClientes = async () => {
      try {
        console.log("Iniciando actualización de clientes...");

        const clientesRef = collection(db, 'clientes');
        const querySnapshot = await getDocs(clientesRef);
        const batch = writeBatch(db);

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const fechaFinal = data.fechaFinal;

          if (fechaFinal) {
            const estado = calcularEstadoCliente(fechaFinal);
            console.log(`Cliente: ${doc.id}, Fecha Final: ${fechaFinal}, Estado Calculado: ${estado}`);

            // Actualiza el campo estado dentro del mapa PENDEJOALEJANDRO
            batch.update(doc.ref, {
              'PENDEJOALEJANDRO.estado': estado
            });
          }
        });

        await batch.commit();

        toast.success('Clientes actualizados');
        console.log("Actualización de clientes completada.");
        setLoading(false);
        onClose();
      } catch (error) {
        console.error('Error al actualizar clientes:', error);
        toast.error(`Error al actualizar clientes: ${error.message}`);
        setLoading(false);
        onClose();
      }
    };

    actualizarClientes();
  }, [onClose]);

  const calcularEstadoCliente = (fechaFinal) => {
    const [day, month, year] = fechaFinal.split('/');
    const sdf = new Date(year, month - 1, day); // Crear fecha en formato correcto
    const fechaActual = new Date();
    const diferencia = sdf - fechaActual;
    const diasRestantes = diferencia / (24 * 60 * 60 * 1000);

    console.log(`Fecha Actual: ${fechaActual}, Fecha Final: ${sdf}, Días Restantes: ${diasRestantes}`);

    if (diasRestantes > 2) {
      return '✅';
    } else if (diasRestantes >= 0) {
      return '⚠️';
    } else {
      return '❌';
    }
  };

  return loading ? <Carga /> : null;
};

export default ActualizarBd;
