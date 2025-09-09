// src/pages/admin/EmpresasAdmin.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "../../services/api"; // <-- cliente único con baseURL `${API_URL}/api`

/** Helpers RUT (formato visual) */
function limpiarRut(v = "") {
  return v.replace(/[^\dkK]/g, "").toUpperCase();
}
function formatearRutDesdeRaw(raw = "") {
  const limpio = limpiarRut(raw);
  if (!limpio) return "";
  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);
  const conPuntos = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${conPuntos}-${dv}`;
}

export default function EmpresasAdmin() {
  const [empresas, setEmpresas] = useState([]);
  const [mineras, setMineras] = useState([]);
  const [nombre, setNombre] = useState("");
  const [rutRaw, setRutRaw] = useState("");
  const [idMinera, setIdMinera] = useState("");
  const [editando, setEditando] = useState(null);
  const [cargando, setCargando] = useState(false);

  // NUEVO: buscador
  const [filtro, setFiltro] = useState("");

  useEffect(() => {
    cargarTodo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function cargarTodo() {
    setCargando(true);
    try {
      const [resEmp, resMin] = await Promise.all([
        api.get("/empresas"),
        api.get("/mineras"),
      ]);
      setEmpresas(resEmp?.data?.data || []);
      setMineras(resMin?.data?.data || []);
    } catch (err) {
      alert("No fue posible cargar Empresas/Mineras.");
    } finally {
      setCargando(false);
    }
  }

  // NUEVO: filtrar en memoria (no toca backend)
  const empresasFiltradas = useMemo(() => {
    const q = filtro.trim().toLowerCase();
    if (!q) return empresas;
    return empresas.filter((e) =>
      [
        e.nombre_empresa,
        e.rut_empresa,
        e?.Minera?.nombre_minera,
        String(e.id_minera),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [empresas, filtro]);

  // ======= VALIDACIONES LOCALES =======
  function validaDuplicados(rutFormateado) {
    const rutCanon = limpiarRut(rutFormateado);
    // 1) RUT único en toda la plataforma
    const rutRepetido = empresas.some(
      (e) =>
        limpiarRut(e.rut_empresa || "") === rutCanon &&
        (editando ? e.id_empresa !== editando : true)
    );
    if (rutRepetido) {
      alert("El RUT ya está registrado en otra empresa.");
      return false;
    }

    // 2) Nombre único dentro de la misma minera
    const nombreRepetidoMismaMinera = empresas.some(
      (e) =>
        (e.nombre_empresa || "").trim().toLowerCase() ===
          nombre.trim().toLowerCase() &&
        String(e.id_minera) === String(idMinera) &&
        (editando ? e.id_empresa !== editando : true)
    );
    if (nombreRepetidoMismaMinera) {
      alert("Ya existe una empresa con ese nombre en la misma minera.");
      return false;
    }

    return true;
  }

  async function guardar(e) {
    e?.preventDefault?.();
    if (!nombre || !rutRaw || !idMinera) {
      alert("Todos los campos son obligatorios");
      return;
    }

    const rutAEnviar = formatearRutDesdeRaw(rutRaw);
    if (!validaDuplicados(rutAEnviar)) return;

    setCargando(true);
    try {
      if (editando) {
        await api.put(`/empresas/${editando}`, {
          nombre_empresa: nombre,
          rut_empresa: rutAEnviar,
          id_minera: Number(idMinera),
        });
      } else {
        await api.post("/empresas", {
          nombre_empresa: nombre,
          rut_empresa: rutAEnviar,
          id_minera: Number(idMinera),
        });
      }
      limpiar();
      await cargarTodo();
    } catch (err) {
      const data = err?.response?.data;
      const msg =
        data?.mensaje ||
        (Array.isArray(data?.errores) && data.errores[0]?.msg) ||
        data?.error ||
        "Error de API al guardar.";
      alert(msg);
    } finally {
      setCargando(false);
    }
  }

  function editar(e) {
    setEditando(e.id_empresa);
    setNombre(e.nombre_empresa);
    setRutRaw(limpiarRut(e.rut_empresa || ""));
    setIdMinera(e.id_minera);
  }

  async function eliminar(id) {
    if (!window.confirm("¿Seguro de eliminar la empresa?")) return;
    setCargando(true);
    try {
      await api.delete(`/empresas/${id}`);
      await cargarTodo();
      if (editando === id) limpiar();
    } catch (err) {
      const st = err?.response?.status;
      const data = err?.response?.data;
      if (st === 409) {
        alert(
          data?.mensaje ||
            "No se puede eliminar: existen registros dependientes asociados a esta empresa."
        );
      } else {
        alert(data?.mensaje || data?.error || "Error al eliminar.");
      }
    } finally {
      setCargando(false);
    }
  }

  function limpiar() {
    setEditando(null);
    setNombre("");
    setRutRaw("");
    setIdMinera("");
  }

  return (
    <div className="tarjeta" style={{ maxWidth: "900px", margin: "0 auto" }}>
      <h2>🏢 Empresas Contratistas</h2>

      {/* FORMULARIO */}
      <form onSubmit={guardar} className="formulario" style={{ marginBottom: 15 }}>
        {/* Fila: Nombre / RUT */}
        <div className="grid-form-2">
          <div className="grupo">
            <label>Nombre de la empresa</label>
            <input
              className="input"
              placeholder="Nombre de la empresa"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>

          <div className="grupo">
            <label>RUT Empresa</label>
            <input
              className="input"
              placeholder="RUT Empresa"
              value={formatearRutDesdeRaw(rutRaw)}
              onChange={(e) => setRutRaw(limpiarRut(e.target.value))}
              translate="no"
            />
          </div>
        </div>

        {/* Fila: Minera / Acciones */}
        <div className="grid-form-2">
          <div className="grupo">
            <label>Minera</label>
            <select
              className="input"
              value={idMinera}
              onChange={(e) => setIdMinera(e.target.value)}
            >
              <option value="">Seleccione Minera</option>
              {mineras.map((m) => (
                <option key={m.id_minera} value={m.id_minera}>
                  {m.nombre_minera}
                </option>
              ))}
            </select>
          </div>

          <div className="acciones-centro" style={{ alignItems: "end" }}>
            <button
              type="submit"
              onClick={guardar}
              className="btn btn-primario"
              disabled={cargando}
            >
              {editando ? "Actualizar" : "Agregar"}
            </button>
            <button
              type="button"
              className="btn"
              onClick={limpiar}
              disabled={cargando}
            >
              Limpiar
            </button>
          </div>
        </div>
      </form>

      {/* NUEVO: cabecera con buscador */}
      <div className="cabecera-seccion" style={{ marginBottom: 8 }}>
        <h3 className="titulo-seccion">Listado</h3>
        <div className="grupo" style={{ maxWidth: 260 }}>
          <label>Buscar</label>
          <input
            className="input"
            placeholder="Por empresa, RUT o minera…"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          />
        </div>
      </div>

      {/* TABLA */}
      <div className="tabla-contenedor">
        <table className="tabla tabla--compacta tabla--ancha tabla--sticky-first" style={{ width: "100%" }}>
          <thead>
            <tr>
              <th style={{ width: "40%" }}>Nombre de la empresa</th>
              <th style={{ width: "20%" }} translate="no">RUT</th>
              <th className="hide-md" style={{ width: "25%" }}>Minera</th>
              <th style={{ width: "15%" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {empresasFiltradas.map((e) => (
              <tr key={e.id_empresa}>
                <td className="td-wrap">{e.nombre_empresa}</td>
                <td className="td-num" translate="no">{e.rut_empresa}</td>
                <td className="hide-md td-wrap">{e.Minera?.nombre_minera || e.id_minera}</td>
                <td className="col-acciones">
                  <button
                    className="btn btn-mini"
                    onClick={() => editar(e)}
                    disabled={cargando}
                    aria-label="Editar empresa"
                    title="Editar"
                  >
                    ✏️
                  </button>
                  <button
                    className="btn btn-mini btn-peligro"
                    onClick={() => eliminar(e.id_empresa)}
                    disabled={cargando}
                    aria-label="Eliminar empresa"
                    title="Eliminar"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
            {empresasFiltradas.length === 0 && (
              <tr>
                <td className="sin-datos" colSpan={4}>
                  Sin datos para mostrar
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
