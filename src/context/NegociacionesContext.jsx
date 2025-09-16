// src/context/NegociacionesContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../services/api";

// se habilita el uso del backend
const USE_BACKEND = true;

const Ctx = createContext(null);
export const useNegociaciones = () => useContext(Ctx);

// se normalizan los datos de negociaciones para mostrarlos en tablas y filtros del front
function normalizarNeg(n) {
  return {
    id: n.id_negociacion ?? n.id ?? Math.random().toString(36).slice(2),
    empresa: n?.Empresa?.nombre_empresa || n.empresa || "",
    sindicato: n?.Sindicato?.nombre_sindicato || n.sindicato || "",
    minera: n?.Empresa?.Minera?.nombre_minera || n.minera || "",
    estado: (n.estado || "en proceso").toLowerCase(),
    fechaInicio: n.fecha_inicio || n.fechaInicio || "",
    fechaTermino: n.fecha_termino || n.fechaTermino || "",
    vencimiento: n.vencimiento_contrato_comercial || n.vencimiento || "",
    rutEmpresa: n?.Empresa?.rut_empresa || n.rutEmpresa || "",
    // se guarda el objeto original por si se necesita más adelante
    _raw: n,
  };
}

export function NegociacionesProvider({ children }) {
  const [negociaciones, setNegociaciones] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [editItem, setEditItem] = useState(null);

  // se listan negociaciones desde el backend al montar el componente
  useEffect(() => {
    if (!USE_BACKEND) return;
    (async () => {
      try {
        setCargando(true);
        const r = await api.get("/negociaciones"); // se espera { ok: true, data: [...] }
        const arr = Array.isArray(r.data) ? r.data : (r.data?.data || []);
        setNegociaciones(arr.map(normalizarNeg));
      } catch (_e) {
        setError("No fue posible listar negociaciones.");
      } finally {
        setCargando(false);
      }
    })();
  }, []);

  // se usan actualizaciones funcionales para no depender de `negociaciones` en el cierre
  const acciones = useMemo(
    () => ({
      async agregar(payloadBack) {
        // el payload debe incluir los campos requeridos por el backend
        // { id_empresa, id_sindicato, contrato, estado?, fecha_inicio?, fecha_termino?, vencimiento_contrato_comercial?, ... }
        const res = await api.post("/negociaciones", payloadBack);
        const creado = res.data?.data || res.data; // el backend puede devolver { ok, data } o el objeto directo
        const normal = normalizarNeg(creado);
        setNegociaciones((prev) => [normal, ...prev]);
        return normal;
      },

      async actualizar(id, payloadBack) {
        const res = await api.put(`/negociaciones/${id}`, payloadBack);
        const actualizado = res.data?.data || res.data;
        const normal = normalizarNeg(actualizado);
        setNegociaciones((prev) => prev.map((n) => (n.id === id ? normal : n)));
        return normal;
      },

      async eliminar(id) {
        await api.delete(`/negociaciones/${id}`);
        setNegociaciones((prev) => prev.filter((n) => n.id !== id));
      },

      iniciarEdicion(item) { setEditItem(item); },
      limpiarEdicion() { setEditItem(null); },
    }),
    [] // sin dependencia de `negociaciones` para evitar advertencias del linter
  );

  const value = {
    negociaciones,
    setNegociaciones,
    cargando,
    setCargando,
    error,
    setError,
    editItem,
    ...acciones,
    USE_BACKEND,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
