// src/pages/admin/MonitoreoAdmin.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "../../services/api";

export default function MonitoreoAdmin() {
  const [negociaciones, setNegociaciones] = useState([]);
  const [items, setItems] = useState([]);

  // estado del formulario
  const [idNeg, setIdNeg] = useState("");
  const [fecha, setFecha] = useState(""); // 'YYYY-MM-DD'
  const [coment, setComent] = useState("");
  const [editId, setEditId] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [filtro, setFiltro] = useState("");

  useEffect(() => {
    cargarTodo();
  }, []);

  // cargo negociaciones y monitoreos al iniciar
  async function cargarTodo() {
    setCargando(true);
    try {
      const [rNeg, rMon] = await Promise.all([
        api.get("/negociaciones"),
        api.get("/monitoreos"),
      ]);
      const arrNeg = Array.isArray(rNeg.data) ? rNeg.data : rNeg.data?.data || [];
      const arrMon = Array.isArray(rMon.data) ? rMon.data : rMon.data?.data || [];
      setNegociaciones(arrNeg);
      setItems(arrMon);
    } catch (err) {
      console.error("Error cargando Monitoreo:", err);
      alert("No fue posible cargar negociaciones/monitoreos.");
    } finally {
      setCargando(false);
    }
  }

  // preparo las opciones del select de negociaciones
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

  // vuelvo el formulario a su estado inicial
  function limpiar() {
    setEditId(null);
    setIdNeg("");
    setFecha("");
    setComent("");
  }

  // guardo (creo/actualizo) un registro de monitoreo
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
        // Mantener string 'YYYY-MM-DD' para evitar desfases de huso
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

  // cargo los datos del registro a editar
  function editar(row) {
    setEditId(row.id_monitoreo);
    setIdNeg(row.id_negociacion);

    // Normaliza a 'YYYY-MM-DD' para el <input type="date">
    const raw = row.fecha_inicio_monitoreo || "";
    // Si viene 'YYYY-MM-DD...' (DATEONLY o ISO), toma los 10 primeros
    let soloFecha = "";
    if (typeof raw === "string" && /^\d{4}-\d{2}-\d{2}/.test(raw)) {
      soloFecha = raw.slice(0, 10);
    } else {
      // Último recurso: intentar parsear agregando T12 para evitar retroceso por UTC
      const d = new Date(`${raw}T12:00:00`);
      if (!isNaN(d)) {
        const yy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        soloFecha = `${yy}-${mm}-${dd}`;
      } else {
        soloFecha = ""; // evita poner algo inválido en el input
      }
    }
    setFecha(soloFecha);

    setComent(row.comentarios || "");
  }

  // elimino un registro (con confirmación)
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

  // formateo fechas a dd-mm-aaaa para mostrar SIN Date si ya viene 'YYYY-MM-DD'
  function formatoFecha(valor) {
    if (!valor) return "-";
    if (typeof valor === "string" && /^\d{4}-\d{2}-\d{2}$/.test(valor)) {
      const [y, m, d] = valor.split("-");
      return `${d}-${m}-${y}`;
    }
    // Si viene con hora, neutraliza zona horaria agregando T12
    const f = new Date(
      typeof valor === "string" && !valor.includes("T") ? `${valor}T12:00:00` : valor
    );
    if (isNaN(f)) return valor;
    const d = String(f.getDate()).padStart(2, "0");
    const m = String(f.getMonth() + 1).padStart(2, "0");
    const y = f.getFullYear();
    return `${d}-${m}-${y}`;
  }

  // filtro en memoria por texto libre
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
    <div className="tarjeta" style={{ maxWidth: "1400px", margin: "0 auto" }}>
      <h2>👁️ Registro de Monitoreo</h2>

      {/* formulario */}
      <form onSubmit={guardar} className="formulario">
        {/* fila 1: negociación */}
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

        {/* fila 2: fecha */}
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

        {/* fila 3: comentarios */}
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

        {/* botones */}
        <div className="form-actions">
          <button type="submit" className="btn btn-primario" disabled={cargando}>
            {editId ? "Actualizar" : "Guardar"}
          </button>
          <button type="button" className="btn" onClick={limpiar} disabled={cargando}>
            Cancelar
          </button>
        </div>
      </form>

      {/* cabecera / buscador */}
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

      {/* tabla */}
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
                  <td className="hide-mobile">
                    {formatoFecha(row.fecha_inicio_monitoreo)}
                  </td>
                  <td className="hide-mobile col-obs">{row.comentarios || "-"}</td>
                  <td className="col-acciones">
                    <button
                      className="btn btn-mini"
                      onClick={() => editar(row)}
                      disabled={cargando}
                    >
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
