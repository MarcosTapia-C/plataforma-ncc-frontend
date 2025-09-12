// src/pages/admin/MonitoreoAdmin.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "../../services/api";

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
        api.get("/negociaciones"),
        api.get("/monitoreos"),
      ]);
      const arrNeg = Array.isArray(rNeg.data) ? rNeg.data : rNeg.data?.data || [];
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
        n?.Minera?.nombre_minera ||
        n?.Empresa?.Minera?.nombre_minera ||
        n.minera ||
        "";
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
    if (!fecha) {
      alert("Debes ingresar la fecha de inicio de la negociación.");
      return;
    }
    setCargando(true);
    try {
      const payload = {
        id_negociacion: Number(idNeg),
        fecha_inicio_monitoreo: fecha,
        comentarios: coment.trim() || null,
      };
      if (editId) {
        await api.put(`/monitoreos/${editId}`, payload);
      } else {
        await api.post("/monitoreos", payload);
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
      await api.delete(`/monitoreos/${row.id_monitoreo}`);
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

  // helper para mostrar fechas en formato dd-mm-aaaa
  function formatoFecha(valor) {
    if (!valor) return "-";
    const f = new Date(valor);
    if (isNaN(f)) return valor;
    const d = String(f.getDate()).padStart(2, "0");
    const m = String(f.getMonth() + 1).padStart(2, "0");
    const y = f.getFullYear();
    return `${d}-${m}-${y}`;
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

  return (
    <div className="tarjeta" style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <h2>👁️ Registro de Monitoreo</h2>

      {/* FORMULARIO */}
      <form onSubmit={guardar} className="formulario">
        {/* Fila 1: Negociación */}
        <div className="form-row">
          <div className="grupo">
            <label>Negociación</label>
            <select
              className="input"
              value={idNeg}
              onChange={(e) => setIdNeg(e.target.value)}
            >
              <option value="">Seleccionar Negociación</option>
              {opcionesNeg.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Fila 2: Fecha */}
        <div className="form-row">
          <div className="grupo">
            <label>Fecha de inicio de la Negociación</label>
            <input
              className="input"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>
        </div>

        {/* Fila 3: Comentarios */}
        <div className="form-row">
          <div className="grupo">
            <label>Comentarios</label>
            <textarea
              className="input"
              rows={4}
              value={coment}
              onChange={(e) => setComent(e.target.value)}
              placeholder="Comentarios sobre la negociación"
            />
          </div>
        </div>

        {/* Botones */}
        <div className="form-actions">
          <button type="submit" className="btn btn-primario" disabled={cargando}>
            {editId ? "Actualizar" : "Guardar"}
          </button>
          <button type="button" className="btn" onClick={limpiar} disabled={cargando}>
            Cancelar
          </button>
        </div>
      </form>

      {/* CABECERA / BUSCADOR */}
      <div className="cabecera-seccion">
        <h3 className="titulo-seccion">Listado</h3>
        <div className="grupo" style={{ maxWidth: 280 }}>
          <label>Buscar</label>
          <input
            className="input"
            placeholder="Por negociación, comentario o fecha…"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          />
        </div>
      </div>

      {/* TABLA */}
      <div className="tabla-responsive">
        <table className="tabla">
          <thead>
            <tr>
              <th>Negociación</th>
              <th className="hide-mobile">Fecha inicio</th>
              <th className="hide-mobile">Comentarios</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((row) => {
              const neg = opcionesNeg.find((n) => n.id === row.id_negociacion);
              return (
                <tr key={row.id_monitoreo}>
                  <td>{neg?.label || row.id_negociacion}</td>
                  <td className="hide-mobile">{formatoFecha(row.fecha_inicio_monitoreo)}</td>
                  <td className="hide-mobile col-obs">{row.comentarios || "-"}</td>
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
