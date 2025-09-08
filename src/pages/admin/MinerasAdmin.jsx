// src/pages/admin/MinerasAdmin.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "../../services/api"; // <-- cliente único con baseURL `${API_URL}/api`

export default function MinerasAdmin() {
  const [mineras, setMineras] = useState([]);
  const [nombre, setNombre] = useState("");
  const [filtro, setFiltro] = useState("");
  const [editId, setEditId] = useState(null);
  const [cargando, setCargando] = useState(false);

  const cargar = async () => {
    setCargando(true);
    try {
      const r = await api.get("/mineras"); // { ok:true, data:[...] }
      setMineras(r?.data?.data || []);
    } catch (err) {
      const msg =
        err?.response?.data?.mensaje ||
        err?.response?.data?.error ||
        "No fue posible cargar las mineras.";
      alert(msg);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const limpiar = () => {
    setNombre("");
    setEditId(null);
  };

  const onGuardar = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) {
      alert("El nombre de la minera es obligatorio.");
      return;
    }
    setCargando(true);
    try {
      if (editId) {
        await api.put(`/mineras/${editId}`, { nombre_minera: nombre.trim() });
      } else {
        await api.post("/mineras", { nombre_minera: nombre.trim() });
      }
      await cargar();
      limpiar();
    } catch (err) {
      const data = err?.response?.data;
      const msg =
        data?.mensaje ||
        (Array.isArray(data?.errores) && data.errores[0]?.msg) ||
        data?.error ||
        "Error de API.";
      alert(msg);
    } finally {
      setCargando(false);
    }
  };

  const onEditar = (m) => {
    setEditId(m.id_minera);
    setNombre(m.nombre_minera || "");
  };

  const onEliminar = async (id) => {
    if (!window.confirm("¿Eliminar esta minera?")) return;
    setCargando(true);
    try {
      await api.delete(`/mineras/${id}`);
      await cargar();
      if (editId === id) limpiar();
    } catch (err) {
      const st = err?.response?.status;
      const data = err?.response?.data;
      if (st === 409) {
        alert(
          data?.mensaje ||
            "No se puede eliminar: existen empresas asociadas a esta minera."
        );
      } else {
        const msg = data?.mensaje || data?.error || "Error eliminando la minera.";
        alert(msg);
      }
    } finally {
      setCargando(false);
    }
  };

  const minerasFiltradas = useMemo(() => {
    const q = filtro.trim().toLowerCase();
    if (!q) return mineras;
    return mineras.filter((m) =>
      (m.nombre_minera || "").toLowerCase().includes(q)
    );
  }, [mineras, filtro]);

  // ===== UI estilo "Empresas" (una sola tarjeta centrada) =====
  return (
    <div className="tarjeta" style={{ maxWidth: "450px", margin: "0 auto" }}>
      <h2>⛏️ Mineras</h2>

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
            <label>Nombre de la minera</label>
            <input
              className="input"
              placeholder="Nombre de la minera"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button type="submit" className="btn btn-primario" disabled={cargando}>
            {editId ? "Actualizar" : "Guardar"}
          </button>
          <button type="button" className="btn" onClick={limpiar} disabled={cargando}>
            Limpiar
          </button>

          {/* Buscador a la derecha */}
          <div className="grupo" style={{ marginLeft: "auto", maxWidth: 260 }}>
            <label>Buscar</label>
            <input
              className="input"
              placeholder="Buscar por nombre…"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
            />
          </div>
        </div>
      </form>

      {/* TABLA (ID oculto en la maqueta visual) */}
      <div className="tabla-responsive">
        <table className="tabla" style={{ width: "100%" }}>
          <thead>
            <tr>
              {/* <th style={{ width: 90 }}>ID</th>  ← oculto */}
              <th>Nombre</th>
              <th style={{ width: 160 }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {minerasFiltradas.map((m) => (
              <tr key={m.id_minera}>
                {/* <td className="oculto">{m.id_minera}</td> ← no se muestra */}
                <td>{m.nombre_minera}</td>
                <td className="col-acciones">
                  <button
                    className="btn btn-mini"
                    onClick={() => onEditar(m)}
                    disabled={cargando}
                  >
                    Editar
                  </button>
                  <button
                    className="btn btn-mini btn-peligro"
                    onClick={() => onEliminar(m.id_minera)}
                    disabled={cargando}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {minerasFiltradas.length === 0 && (
              <tr>
                <td className="sin-datos" colSpan={2}>
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
