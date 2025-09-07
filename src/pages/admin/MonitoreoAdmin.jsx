// src/pages/Admin/MonitoreoAdmin.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

/** Cliente axios con token + manejo básico de 401 */
function api() {
  const token = localStorage.getItem("token_ncc");
  const instance = axios.create({
    baseURL: "http://localhost:3000/api",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  instance.interceptors.response.use(
    (r) => r,
    (err) => {
      const st = err?.response?.status;
      if (st === 401) {
        alert("Sesión expirada. Vuelve a iniciar sesión.");
        localStorage.removeItem("token_ncc");
        localStorage.removeItem("usuario_ncc");
        window.location.href = "/";
        return;
      }
      return Promise.reject(err);
    }
  );
  return instance;
}

export default function MonitoreoAdmin() {
  const [negociaciones, setNegociaciones] = useState([]);
  const [items, setItems] = useState([]);

  // form
  const [idNeg, setIdNeg] = useState("");
  const [fecha, setFecha] = useState("");
  const [coment, setComent] = useState("");
  const [editId, setEditId] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [filtro, setFiltro] = useState("");

  useEffect(() => {
    cargarTodo();
  }, []);

  async function cargarTodo() {
    setCargando(true);
    try {
      const [rNeg, rMon] = await Promise.all([
        api().get("/negociaciones"),
        api().get("/monitoreos"),
      ]);
      const arrNeg = Array.isArray(rNeg.data) ? rNeg.data : (rNeg.data?.data || []);
      const arrMon = rMon.data?.data || [];
      setNegociaciones(arrNeg);
      setItems(arrMon);
    } catch (err) {
      console.error("Error cargando Monitoreo:", err);
      alert("No fue posible cargar negociaciones/monitoreos.");
    } finally {
      setCargando(false);
    }
  }

  const opcionesNeg = useMemo(() => {
    return negociaciones.map((n) => {
      const id = n.id_negociacion ?? n.id;
      const minera =
        n?.Minera?.nombre_minera || n?.Empresa?.Minera?.nombre_minera || n.minera || "";
      const empresa = n?.Empresa?.nombre_empresa || n.empresa || "";
      const contrato = n.contrato || n.num_contrato || "";
      return { id, label: [minera, empresa, contrato].filter(Boolean).join(" — ") };
    });
  }, [negociaciones]);

  function limpiar() {
    setEditId(null);
    setIdNeg("");
    setFecha("");
    setComent("");
  }

  async function guardar(e) {
    e.preventDefault();
    if (!idNeg) {
      alert("Selecciona una negociación.");
      return;
    }
    setCargando(true);
    try {
      if (editId) {
        const payload = {
          id_negociacion: Number(idNeg),
          comentarios: coment,
          ...(fecha === "" ? { fecha_inicio_monitoreo: "" } : { fecha_inicio_monitoreo: fecha }),
        };
        await api().put(`/monitoreos/${editId}`, payload);
      } else {
        const payload = { id_negociacion: Number(idNeg), comentarios: coment };
        if (fecha) payload.fecha_inicio_monitoreo = fecha;
        await api().post("/monitoreos", payload);
      }
      await cargarTodo();
      limpiar();
    } catch (err) {
      const data = err?.response?.data;
      const msg =
        data?.mensaje ||
        (Array.isArray(data?.errores) && data.errores[0]?.msg) ||
        data?.error ||
        "Error de API al guardar.";
      alert(msg);
      console.error("Error guardando monitoreo:", err);
    } finally {
      setCargando(false);
    }
  }

  function editar(row) {
    setEditId(row.id_monitoreo);
    setIdNeg(row.id_negociacion);
    setFecha(row.fecha_inicio_monitoreo || "");
    setComent(row.comentarios || "");
  }

  async function eliminar(row) {
    if (!window.confirm("¿Eliminar este monitoreo?")) return;
    setCargando(true);
    try {
      await api().delete(`/monitoreos/${row.id_monitoreo}`);
      await cargarTodo();
      if (editId === row.id_monitoreo) limpiar();
    } catch (err) {
      const st = err?.response?.status;
      const data = err?.response?.data;
      if (st === 409) {
        alert(
          data?.mensaje ||
            "No se puede eliminar: existen registros dependientes asociados."
        );
      } else {
        const msg =
          data?.mensaje ||
          (Array.isArray(data?.errores) && data.errores[0]?.msg) ||
          data?.error ||
          "Error de API al eliminar.";
        alert(msg);
      }
      console.warn("DELETE /monitoreos/:id falló →", st, data || err);
    } finally {
      setCargando(false);
    }
  }

  const filtrados = useMemo(() => {
    const q = filtro.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => {
      const neg = opcionesNeg.find((n) => n.id === it.id_negociacion);
      return [it.id_monitoreo, it.comentarios, it.fecha_inicio_monitoreo, neg?.label]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [items, filtro, opcionesNeg]);

  // ===== UI estilo "Empresas": tarjeta centrada y ancha =====
  return (
    <div className="tarjeta" style={{ maxWidth: "900px", margin: "0 auto" }}>
      <h2>👁️ Registro de Monitoreo</h2>

      {/* FORMULARIO (filas flex como Empresas) */}
      <form
        onSubmit={guardar}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          marginBottom: "15px",
        }}
      >
        {/* Fila 1: Negociación (con label) */}
        <div style={{ display: "flex", gap: "10px" }}>
          <div className="grupo" style={{ flex: 1 }}>
            <label>Negociación</label>
            <select
              value={idNeg}
              onChange={(e) => setIdNeg(e.target.value)}
            >
              <option value="">Seleccionar Negociación</option>
              {opcionesNeg.map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Fila 2: Fecha inicio monitoreo */}
        <div style={{ display: "flex", gap: "10px" }}>
          <div className="grupo" style={{ flex: 1 }}>
            <label>Fecha inicio monitoreo</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
            <small className="nota">
              Si dejas vacío: se usa la <b>fecha de inicio</b> de la negociación.
            </small>
          </div>
        </div>

        {/* Fila 3: Comentarios */}
        <div style={{ display: "flex", gap: "10px" }}>
          <div className="grupo" style={{ flex: 1 }}>
            <label>Comentarios</label>
            <textarea
              rows={4}
              value={coment}
              onChange={(e) => setComent(e.target.value)}
              placeholder="Comentarios sobre la negociación"
            />
          </div>
        </div>

        {/* Fila 4: Acciones + Buscador */}
        <div style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
          <button type="submit" style={{ background: "blue", color: "#fff" }} disabled={cargando}>
            {editId ? "Actualizar" : "Guardar"}
          </button>
          <button type="button" onClick={limpiar} disabled={cargando}>
            Cancelar
          </button>

          {/* Buscador a la derecha con label */}
          <div className="grupo" style={{ marginLeft: "auto", maxWidth: 280 }}>
            <label>Buscar</label>
            <input
              className="input"
              placeholder="Por negociación, comentario o fecha…"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
            />
          </div>
        </div>
      </form>

      {/* TABLA (ID oculto en la maqueta visual) */}
      <div className="tabla-contenedor">
        <table className="tabla" style={{ width: "100%" }}>
          <thead>
            <tr>
              {/* <th style={{ width: 90 }}>ID</th>  ← oculto */}
              <th>Negociación</th>
              <th>Fecha inicio monitoreo</th>
              <th>Comentarios</th>
              <th style={{ width: 170 }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((row) => {
              const neg = opcionesNeg.find((n) => n.id === row.id_negociacion);
              return (
                <tr key={row.id_monitoreo}>
                  {/* <td className="oculto">{row.id_monitoreo}</td> ← no se muestra */}
                  <td>{neg?.label || row.id_negociacion}</td>
                  <td>{row.fecha_inicio_monitoreo || "-"}</td>
                  <td className="col-obs">{row.comentarios || "-"}</td>
                  <td className="col-acciones">
                    <button className="btn btn-mini" onClick={() => editar(row)} disabled={cargando}>
                      Editar
                    </button>
                    <button
                      className="btn btn-mini btn-peligro"
                      onClick={() => eliminar(row)}
                      disabled={cargando}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              );
            })}
            {filtrados.length === 0 && (
              <tr>
                <td className="sin-datos" colSpan={4}>Sin resultados</td>
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
