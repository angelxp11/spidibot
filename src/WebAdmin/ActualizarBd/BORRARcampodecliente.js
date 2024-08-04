import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import Carga from '../../Loada/Carga';
import { toast } from 'react-toastify';
import { collection, getDocs, writeBatch, doc, updateDoc, deleteField } from "firebase/firestore";

const ActualizarBd = ({ onClose }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const eliminarCampoEstado = async () => {
      try {
        console.log("Iniciando eliminación del campo 'estado'...");

        const clientesRef = collection(db, 'clientes');
        const querySnapshot = await getDocs(clientesRef);
        const batch = writeBatch(db);

        querySnapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data();
          const docRef = doc(db, 'clientes', docSnapshot.id);

          // Verifica si el campo 'estado' está fuera del mapa 'PENDEJOALEJANDRO'
          if (data.estado !== undefined && data.PENDEJOALEJANDRO !== undefined) {
            batch.update(docRef, {
              estado: deleteField()
            });

            console.log(`Campo 'estado' eliminado del cliente: ${docSnapshot.id}`);
          }
        });

        await batch.commit();

        toast.success('Campo "estado" eliminado de los documentos de clientes');
        console.log("Eliminación del campo 'estado' completada.");
        setLoading(false);
        onClose();
      } catch (error) {
        console.error('Error al eliminar el campo "estado":', error);
        toast.error(`Error al eliminar el campo "estado": ${error.message}`);
        setLoading(false);
        onClose();
      }
    };

    eliminarCampoEstado();
  }, [onClose]);

  return loading ? <Carga /> : null;
};

export default ActualizarBd;
