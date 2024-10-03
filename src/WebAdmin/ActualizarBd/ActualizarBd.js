import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import Carga from '../../Loada/Carga';
import { toast } from 'react-toastify';
import { collection, getDocs, writeBatch } from "firebase/firestore";

const ActualizarBd = ({ onClose }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const actualizarBaseDeDatos = async () => {
      try {
        console.log("Iniciando actualización de clientes y grupos...");

        const clientesRef = collection(db, 'clientes');
        const serviciosRef = collection(db, 'Servicios');

        // Actualizar clientes
        await actualizarClientes(clientesRef);

        // Actualizar grupos
        await actualizarGrupos(serviciosRef);

        toast.success('Clientes y grupos actualizados');
        console.log("Actualización de clientes y grupos completada.");
        setLoading(false);
        onClose();
      } catch (error) {
        console.error('Error al actualizar clientes y grupos:', error);
        toast.error(`Error al actualizar clientes y grupos: ${error.message}`);
        setLoading(false);
        onClose();
      }
    };

    actualizarBaseDeDatos();
  }, [onClose]);

  const actualizarClientes = async (clientesRef) => {
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
            console.log(`Grupo: ${groupName}, Fecha Pago: ${fechaPago}, Estado Calculado: ${estado}`);

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

    console.log(`Fecha Actual: ${fechaActual}, Fecha Final: ${sdf}, Días Restantes: ${diasRestantes}`);

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
