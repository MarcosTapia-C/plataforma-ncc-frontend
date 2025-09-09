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

  // Buscador
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

  // Filtrado en memoria
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
    <div className="contenedor-pagina">
      <div className="tarjeta" style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <div className="barra-pagina">
          <h2 className="titulo">🏢 Empresas Contratistas</h2>
        </div>

        {/* FORMULARIO RESPONSIVO */}
        <form onSubmit={guardar} className="formulario">
          {/* Fila 1: Nombre / RUT */}
          <div className="grid-form-2">
            <div className="grupo">
              <label htmlFor="nombre-empresa">Nombre de la empresa</label>
              <input
                id="nombre-empresa"
                className="input"
                placeholder="Ingrese el nombre de la empresa"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                autoComplete="organization"
              />
            </div>

            <div className="grupo">
              <label htmlFor="rut-empresa">RUT Empresa</label>
              <input
                id="rut-empresa"
                className="input"
                placeholder="12.345.678-9"
                value={formatearRutDesdeRaw(rutRaw)}
                onChange={(e) => setRutRaw(limpiarRut(e.target.value))}
                translate="no"
                autoComplete="off"
              />
            </div>
          </div>

          {/* Fila 2: Minera / Acciones */}
          <div className="grid-form-2">
            <div className="grupo">
              <label htmlFor="select-minera">Minera</label>
              <select
                id="select-minera"
                className="input"
                value={idMinera}
                onChange={(e) => setIdMinera(e.target.value)}
              >
                <option value="">Seleccione una minera</option>
                {mineras.map((m) => (
                  <option key={m.id_minera} value={m.id_minera}>
                    {m.nombre_minera}
                  </option>
                ))}
              </select>
            </div>

            <div className="acciones-centro">
              <button
                type="submit"
                className="btn btn-primario"
                disabled={cargando}
                aria-label={editando ? "Actualizar empresa" : "Agregar empresa"}
              >
                {editando ? "Actualizar" : "Agregar"}
              </button>
              <button
                type="button"
                className="btn"
                onClick={limpiar}
                disabled={cargando}
                aria-label="Limpiar formulario"
              >
                Limpiar
              </button>
            </div>
          </div>
        </form>

        {/* CABECERA CON BUSCADOR RESPONSIVO */}
        <div className="cabecera-seccion">
          <h3 className="titulo-seccion">Listado ({empresasFiltradas.length})</h3>
          <div className="grupo" style={{ maxWidth: 300 }}>
            <label htmlFor="filtro-buscar" className="sr-only">Buscar empresas</label>
            <input
              id="filtro-buscar"
              className="input"
              placeholder="Buscar por empresa, RUT o minera..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              autoComplete="off"
            />
          </div>
        </div>

        {/* TABLA RESPONSIVA */}
        <div className="tabla-contenedor">
          <table className="tabla tabla--compacta tabla--ancha tabla--sticky-first">
            <thead>
              <tr>
                <th>Empresa</th>
                <th className="td-num">RUT</th>
                <th className="hide-sm">Minera</th>
                <th style={{ width: "120px", textAlign: "center" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {empresasFiltradas.map((e) => (
                <tr key={e.id_empresa}>
                  <td className="td-wrap">
                    <div style={{ fontWeight: 500 }}>{e.nombre_empresa}</div>
                    {/* Mostrar minera en móvil cuando la columna está oculta */}
                    <div className="show-mobile-only" style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "2px" }}>
                      {e.Minera?.nombre_minera || `ID: ${e.id_minera}`}
                    </div>
                  </td>
                  <td className="td-num" translate="no">
                    <code style={{ fontSize: "0.9rem", background: "#f1f5f9", padding: "2px 4px", borderRadius: "3px" }}>
                      {e.rut_empresa}
                    </code>
                  </td>
                  <td className="hide-sm td-wrap">
                    {e.Minera?.nombre_minera || `ID: ${e.id_minera}`}
                  </td>
                  <td className="col-acciones">
                    <button
                      className="btn btn-mini"
                      onClick={() => editar(e)}
                      disabled={cargando}
                      aria-label={`Editar empresa ${e.nombre_empresa}`}
                      title="Editar empresa"
                    >
                      ✏️
                    </button>
                    <button
                      className="btn btn-mini btn-peligro"
                      onClick={() => eliminar(e.id_empresa)}
                      disabled={cargando}
                      aria-label={`Eliminar empresa ${e.nombre_empresa}`}
                      title="Eliminar empresa"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
              {empresasFiltradas.length === 0 && (
                <tr>
                  <td className="sin-datos" colSpan={4}>
                    {filtro ? "No se encontraron empresas que coincidan con la búsqueda" : "No hay empresas registradas"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* INDICADOR DE CARGA */}
        {cargando && (
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            gap: "8px", 
            marginTop: "16px",
            padding: "12px",
            background: "#f8fafc",
            borderRadius: "6px",
            border: "1px solid #e2e8f0"
          }}>
            <div style={{
              width: "16px",
              height: "16px",
              border: "2px solid #e2e8f0",
              borderTop: "2px solid #0006BF",
              borderRadius: "50%",
              animation: "spin 1s linear infinite"
            }}></div>
            <span className="nota">Procesando...</span>
          </div>
        )}
      </div>

      {/* CSS para la animación de carga */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
      `}</style>
    </div>
  );
}