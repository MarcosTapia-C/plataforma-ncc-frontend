// src/pages/Admin/MonitoreoAdmin.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "../../services/api"; // <-- cliente único con baseURL `${API_URL}/api`

export default function MonitoreoAdmin() {
  const [negociaciones, setNegociaciones] = useState([]);
  const [items, setItems] = useState([]);

  // form
  const [idNeg, setIdNeg] = useState("");
  const [fecha, setFecha] = useState("");
  const [coment, setComent] = useState("");
  const [editId, setEditId] = useState(null);
  const [cargando, setCargando] = useState(false);

  // buscador
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
    setCargando(true);
    try {
      if (editId) {
        const payload = {
          id_negociacion: Number(idNeg),
          comentarios: coment,
          ...(fecha === ""
            ? { fecha_inicio_monitoreo: "" }
            : { fecha_inicio_monitoreo: fecha }),
        };
        await api.put(`/monitoreos/${editId}`, payload);
      } else {
        const payload = { id_negociacion: Number(idNeg), comentarios: coment };
        if (fecha) payload.fecha_inicio_monitoreo = fecha;
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

  // ===== UI =====
  return (
    <div className="tarjeta" style={{ maxWidth: "900px", margin: "0 auto" }}>
      <h2>👁️ Registro de Monitoreo</h2>

      {/* FORMULARIO */}
      <form onSubmit={guardar} className="formulario" style={{ marginBottom: 12 }}>
        {/* Fila 1: Negociación / Acciones */}
        <div className="grid-form-2">
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

          <div className="acciones-centro">
            <button
              type="submit"
              className="btn btn-primario"
              disabled={cargando}
            >
              {editId ? "Actualizar" : "Guardar"}
            </button>
            <button
              type="button"
              className="btn"
              onClick={limpiar}
              disabled={cargando}
            >
              Cancelar
            </button>
          </div>
        </div>

        {/* Fila 2: Fecha */}
        <div className="grid-form-2">
          <div className="grupo">
            <label>Fecha inicio monitoreo</label>
            <input
              className="input"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
            <small className="nota">
              Si dejas vacío: se usa la <b>fecha de inicio</b> de la negociación.
            </small>
          </div>

          {/* Fila 3: Comentarios (ocupa ancho completo en pantallas amplias) */}
          <div className="grupo" style={{ gridColumn: "1 / -1" }}>
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
      </form>

      {/* CABECERA / BUSCADOR */}
      <div className="cabecera-seccion" style={{ marginBottom: 8 }}>
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
      <div className="tabla-contenedor">
        <table
          className="tabla tabla--compacta tabla--ancha tabla--sticky-first"
          style={{ width: "100%" }}
        >
          <thead>
            <tr>
              {/* <th style={{ width: 90 }}>ID</th>  ← oculto */}
              <th>Negociación</th>
              <th>Fecha inicio monitoreo</th>
              <th className="hide-md">Comentarios</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((row) => {
              const neg = opcionesNeg.find((n) => n.id === row.id_negociacion);
              return (
                <tr key={row.id_monitoreo}>
                  {/* <td className="oculto">{row.id_monitoreo}</td> ← no se muestra */}
                  <td className="td-wrap">{neg?.label || row.id_negociacion}</td>
                  <td>{row.fecha_inicio_monitoreo || "-"}</td>
                  <td className="hide-md td-wrap col-obs">
                    {row.comentarios || "-"}
                  </td>
                  <td className="col-acciones">
                    <button
                      className="btn btn-mini"
                      onClick={() => editar(row)}
                      disabled={cargando}
                      aria-label="Editar monitoreo"
                      title="Editar"
                    >
                      Editar
                    </button>
                    <button
                      className="btn btn-mini btn-peligro"
                      onClick={() => eliminar(row)}
                      disabled={cargando}
                      aria-label="Eliminar monitoreo"
                      title="Eliminar"
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
