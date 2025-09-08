// src/pages/admin/SindicatosAdmin.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "../../services/api"; // <-- cliente único con baseURL `${API_URL}/api`

const TIPOS = ["Nacional", "Faena", "Interempresa"];

export default function SindicatosAdmin() {
  const [sindicatos, setSindicatos] = useState([]);
  const [form, setForm] = useState({
    nombre_sindicato: "",
    federacion: "",
    tipo_sindicato: "",
  });
  const [filtro, setFiltro] = useState("");
  const [editId, setEditId] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [errores, setErrores] = useState({});

  // ----- Carga inicial -----
  const cargar = async () => {
    setCargando(true);
    try {
      const r = await api.get("/sindicatos"); // { ok:true, data:[...] }
      setSindicatos(r.data?.data || []);
    } finally {
      setCargando(false);
    }
  };
  useEffect(() => {
    cargar();
  }, []);

  // ----- Helpers -----
  const limpiar = () => {
    setForm({ nombre_sindicato: "", federacion: "", tipo_sindicato: "" });
    setErrores({});
    setEditId(null);
  };

  const validar = () => {
    const e = {};
    const nombre = form.nombre_sindicato.trim();
    if (nombre.length < 3) e.nombre_sindicato = "El nombre debe tener al menos 3 caracteres.";
    if (form.federacion && form.federacion.length > 100) e.federacion = "Máx. 100 caracteres.";
    if (form.tipo_sindicato && form.tipo_sindicato.length > 50) e.tipo_sindicato = "Máx. 50 caracteres.";
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const sindicatosFiltrados = useMemo(() => {
    const q = filtro.trim().toLowerCase();
    if (!q) return sindicatos;
    return sindicatos.filter((s) =>
      [s.nombre_sindicato, s.federacion, s.tipo_sindicato]
        .filter(Boolean)
        .some((t) => t.toLowerCase().includes(q))
    );
  }, [sindicatos, filtro]);

  // ----- CRUD -----
  const onGuardar = async (e) => {
    e.preventDefault();
    if (!validar()) return;

    const payload = {
      nombre_sindicato: form.nombre_sindicato.trim(),
      federacion: form.federacion.trim() || null,
      tipo_sindicato: form.tipo_sindicato || null,
    };

    try {
      setCargando(true);
      if (editId) {
        await api.put(`/sindicatos/${editId}`, payload);
      } else {
        await api.post("/sindicatos", payload);
      }
      await cargar();
      limpiar();
    } catch (_err) {
      // Errores 401/409 y otros ya los maneja el interceptor en services/api.js
    } finally {
      setCargando(false);
    }
  };

  const onEditar = (s) => {
    setEditId(s.id_sindicato);
    setForm({
      nombre_sindicato: s.nombre_sindicato || "",
      federacion: s.federacion || "",
      tipo_sindicato: s.tipo_sindicato || "",
    });
    setErrores({});
  };

  const onEliminar = async (s) => {
    if (!window.confirm(`¿Eliminar el sindicato "${s.nombre_sindicato}"?`)) return;
    try {
      setCargando(true);
      await api.delete(`/sindicatos/${s.id_sindicato}`);
      await cargar();
      if (editId === s.id_sindicato) limpiar();
    } catch (_err) {
      // Mensaje ya mostrado por el interceptor
    } finally {
      setCargando(false);
    }
  };

  // ----- UI -----
  return (
    <div className="tarjeta" style={{ maxWidth: "900px", margin: "0 auto" }}>
      <h2>✊ Sindicatos</h2>

      {/* FORMULARIO */}
      <form
        onSubmit={onGuardar}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          marginBottom: "15px",
        }}
      >
        <div style={{ display: "flex", gap: "10px" }}>
          <div className="grupo" style={{ flex: 1 }}>
            <label>Nombre del sindicato</label>
            <input
              className="input"
              placeholder="Nombre del sindicato"
              value={form.nombre_sindicato}
              onChange={(e) => setForm({ ...form, nombre_sindicato: e.target.value })}
            />
          </div>
          <div className="grupo" style={{ flex: 1 }}>
            <label>Federación (opcional)</label>
            <input
              className="input"
              placeholder="Federación (opcional)"
              value={form.federacion}
              onChange={(e) => setForm({ ...form, federacion: e.target.value })}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div className="grupo" style={{ flex: 1 }}>
            <label>Tipo de sindicato</label>
            <select
              className="input"
              value={form.tipo_sindicato}
              onChange={(e) => setForm({ ...form, tipo_sindicato: e.target.value })}
            >
              <option value="">(sin especificar)</option>
              {TIPOS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="btn btn-primario"
            style={{ background: "blue", color: "#fff", borderColor: "blue" }}
            disabled={cargando}
          >
            {editId ? "Actualizar" : "Guardar"}
          </button>
          <button type="button" className="btn" onClick={limpiar} disabled={cargando}>
            Limpiar
          </button>
        </div>

        {Object.keys(errores).length > 0 && (
          <small className="nota" style={{ color: "#b91c1c" }}>
            Revisa los campos: {Object.keys(errores).join(", ")}.
          </small>
        )}
      </form>

      {/* LISTADO + BUSCADOR */}
      <div className="cabecera-seccion" style={{ marginBottom: 8 }}>
        <h3 className="titulo-seccion">Listado</h3>
        <div className="grupo" style={{ maxWidth: 260 }}>
          <label>Buscar</label>
          <input
            className="input"
            placeholder="Por nombre, federación o tipo…"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          />
        </div>
      </div>

      <div className="tabla-responsive">
        <table className="tabla" style={{ width: "100%" }}>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Federación</th>
              <th>Tipo</th>
              <th style={{ width: 160 }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {sindicatosFiltrados.map((s) => (
              <tr key={s.id_sindicato}>
                <td>{s.nombre_sindicato}</td>
                <td>{s.federacion || "-"}</td>
                <td>{s.tipo_sindicato || "-"}</td>
                <td className="col-acciones">
                  <button className="btn btn-mini" onClick={() => onEditar(s)} disabled={cargando}>
                    Editar
                  </button>
                  <button
                    className="btn btn-mini btn-peligro"
                    onClick={() => onEliminar(s)}
                    disabled={cargando}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {sindicatosFiltrados.length === 0 && (
              <tr>
                <td className="sin-datos" colSpan={4}>
                  Sin resultados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {cargando && (
        <small className="nota" style={{ display: "block", marginTop: 8 }}>
          Procesando…
        </small>
      )}
    </div>
  );
}
