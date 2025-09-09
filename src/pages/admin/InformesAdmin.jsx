// src/pages/admin/InformesAdmin.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "../../services/api"; // <-- cliente común con baseURL `${API_URL}/api`

/** Adapta distintos formatos del backend a un formato plano uniforme */
function normalizarNeg(n) {
  const minera =
    n.minera ||
    n.nombre_minera ||
    n?.Minera?.nombre_minera ||
    n?.Empresa?.Minera?.nombre_minera ||
    "";
  const empresa =
    n.empresa || n.nombre_empresa || n?.Empresa?.nombre_empresa || "";
  const rut = n.rutEmpresa || n.rut_empresa || n?.Empresa?.rut_empresa || "";
  const contrato = n.contrato || n.num_contrato || n.codigo_contrato || "";
  const sindicato =
    n.sindicato || n.nombre_sindicato || n?.Sindicato?.nombre_sindicato || "";
  const estado = (n.estado || "").toLowerCase();
  const fechaInicio =
    n.fechaInicio || n.fecha_inicio || n.inicio || n.fecha || "";
  const fechaTermino = n.fechaTermino || n.fecha_termino || n.termino || "";
  const vencimiento =
    n.vencimiento || n.vencimiento_comercial || n.fecha_vencimiento || "";

  return {
    id: n.id_negociacion || n.id || n.ID || Math.random().toString(36).slice(2),
    minera,
    empresa,
    rut,
    contrato,
    sindicato,
    estado,
    fechaInicio,
    fechaTermino,
    vencimiento,
    _raw: n,
  };
}

const ESTADOS = ["en proceso", "en pausa", "cerrada"];

export default function Informes() {
  const [mineras, setMineras] = useState([]);
  const [negociaciones, setNegociaciones] = useState([]);
  const [cargando, setCargando] = useState(false);

  const [fMinera, setFMinera] = useState("");
  const [fEstado, setFEstado] = useState("");
  const [fRut, setFRut] = useState("");
  const [fContrato, setFContrato] = useState("");
  const [fDesde, setFDesde] = useState("");
  const [fHasta, setFHasta] = useState("");

  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  useEffect(() => {
    (async () => {
      try {
        setCargando(true);
        const rMin = await api.get("/mineras");
        setMineras(rMin.data?.data || []);

        const rNeg = await api.get("/negociaciones");
        const arr = Array.isArray(rNeg.data) ? rNeg.data : rNeg.data?.data || [];
        setNegociaciones(arr.map(normalizarNeg));
      } catch (e) {
        alert("No fue posible cargar datos para Informes.");
      } finally {
        setCargando(false);
      }
    })();
  }, []);

  const limpiarFiltros = () => {
    setFMinera("");
    setFEstado("");
    setFRut("");
    setFContrato("");
    setFDesde("");
    setFHasta("");
    setPage(1);
  };

  const filtradas = useMemo(() => {
    const dDesde = fDesde ? new Date(fDesde) : null;
    const dHasta = fHasta ? new Date(fHasta) : null;

    return negociaciones.filter((n) => {
      if (fMinera && n.minera !== fMinera) return false;
      if (fEstado) {
        if (n.estado !== fEstado.toLowerCase()) return false;
      }
      if (fRut && !(n.rut || "").toLowerCase().includes(fRut.toLowerCase()))
        return false;
      if (
        fContrato &&
        !(n.contrato || "").toLowerCase().includes(fContrato.toLowerCase())
      )
        return false;

      if (dDesde || dHasta) {
        const fecha = n.fechaInicio || n.fechaTermino || n.vencimiento;
        if (!fecha) return false;
        const f = new Date(fecha);
        if (dDesde && f < dDesde) return false;
        if (dHasta && f > dHasta) return false;
      }
      return true;
    });
  }, [negociaciones, fMinera, fEstado, fRut, fContrato, fDesde, fHasta]);

  const total = filtradas.length;
  const maxPage = Math.max(1, Math.ceil(total / pageSize));
  const pageSafe = Math.min(page, maxPage);

  const rows = useMemo(() => {
    const start = (pageSafe - 1) * pageSize;
    return filtradas.slice(start, start + pageSize);
  }, [filtradas, pageSafe, pageSize]);

  return (
    <div className="contenedor-pagina">
      <div className="tarjeta" style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div className="barra-pagina">
          <h2 className="titulo">📊 Informes y Reportes</h2>
        </div>

        {/* PANEL DE FILTROS RESPONSIVO */}
        <div className="formulario" style={{ background: "#f8fafc", padding: "20px", borderRadius: "8px", marginBottom: "20px" }}>
          <h3 style={{ margin: "0 0 16px 0", fontSize: "1.1rem", fontWeight: 600 }}>Filtros de búsqueda</h3>
          
          {/* Fila 1: Filtros principales */}
          <div className="grid-form-2">
            <div className="grupo">
              <label htmlFor="filtro-minera">Minera</label>
              <select
                id="filtro-minera"
                className="input"
                value={fMinera}
                onChange={(e) => {
                  setFMinera(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Todas las mineras</option>
                {mineras.map((m) => (
                  <option key={m.id_minera} value={m.nombre_minera}>
                    {m.nombre_minera}
                  </option>
                ))}
              </select>
            </div>

            <div className="grupo">
              <label htmlFor="filtro-estado">Estado</label>
              <select
                id="filtro-estado"
                className="input"
                value={fEstado}
                onChange={(e) => {
                  setFEstado(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Todos los estados</option>
                {ESTADOS.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Fila 2: Filtros de texto */}
          <div className="grid-form-2">
            <div className="grupo">
              <label htmlFor="filtro-rut">RUT Empresa</label>
              <input
                id="filtro-rut"
                className="input"
                value={fRut}
                onChange={(e) => {
                  setFRut(e.target.value);
                  setPage(1);
                }}
                placeholder="Ej: 76.543.210-9"
                autoComplete="off"
              />
            </div>

            <div className="grupo">
              <label htmlFor="filtro-contrato">Contrato</label>
              <input
                id="filtro-contrato"
                className="input"
                value={fContrato}
                onChange={(e) => {
                  setFContrato(e.target.value);
                  setPage(1);
                }}
                placeholder="Número de contrato"
                autoComplete="off"
              />
            </div>
          </div>

          {/* Fila 3: Rango de fechas */}
          <div className="grid-form-2">
            <div className="grupo">
              <label htmlFor="filtro-desde">Fecha desde</label>
              <input
                id="filtro-desde"
                className="input"
                type="date"
                value={fDesde}
                onChange={(e) => {
                  setFDesde(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <div className="grupo">
              <label htmlFor="filtro-hasta">Fecha hasta</label>
              <input
                id="filtro-hasta"
                className="input"
                type="date"
                value={fHasta}
                onChange={(e) => {
                  setFHasta(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>

          {/* Acciones de filtros */}
          <div className="acciones-centro" style={{ marginTop: "16px" }}>
            <button 
              type="button" 
              className="btn btn-secundario" 
              onClick={limpiarFiltros}
              aria-label="Limpiar todos los filtros"
            >
              Limpiar filtros
            </button>
          </div>
        </div>

        {/* CONTROLES DE RESULTADOS Y PAGINACIÓN */}
        <div className="cabecera-seccion" style={{ alignItems: "center", marginBottom: "16px", background: "#fff", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <strong style={{ color: "#0006BF" }}>{total}</strong> 
            <span>resultados encontrados</span>
            {total > 0 && (
              <span className="nota" style={{ margin: 0 }}>
                (página {pageSafe} de {maxPage})
              </span>
            )}
          </div>
          
          <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <label className="nota" htmlFor="selPageSize" style={{ margin: 0, whiteSpace: "nowrap" }}>
                Mostrar:
              </label>
              <select
                id="selPageSize"
                className="input"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                style={{ width: "80px" }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
            
            <div style={{ display: "flex", gap: "4px" }}>
              <button
                className="btn btn-mini"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pageSafe <= 1}
                aria-label="Página anterior"
                title="Página anterior"
              >
                ◀
              </button>
              <button
                className="btn btn-mini"
                onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
                disabled={pageSafe >= maxPage}
                aria-label="Página siguiente"
                title="Página siguiente"
              >
                ▶
              </button>
            </div>
          </div>
        </div>

        {/* TABLA RESPONSIVA */}
        <div className="tabla-contenedor">
          <table className="tabla tabla--compacta tabla--ancha tabla--sticky-first">
            <thead>
              <tr>
                <th>Empresa</th>
                <th className="hide-sm">Minera</th>
                <th className="td-num">RUT</th>
                <th className="hide-xs">Contrato</th>
                <th className="hide-md">Sindicato</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((n) => (
                <tr key={n.id}>
                  <td className="td-wrap">
                    <div style={{ fontWeight: 500 }}>{n.empresa || "-"}</div>
                    {/* Info adicional en móvil */}
                    <div className="show-mobile-only" style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "2px" }}>
                      {n.minera && <div>🏔️ {n.minera}</div>}
                      {n.contrato && <div>📄 {n.contrato}</div>}
                    </div>
                  </td>
                  <td className="hide-sm td-wrap">{n.minera || "-"}</td>
                  <td className="td-num" translate="no">
                    <code style={{ fontSize: "0.85rem", background: "#f1f5f9", padding: "2px 4px", borderRadius: "3px" }}>
                      {n.rut || "-"}
                    </code>
                  </td>
                  <td className="hide-xs td-num">{n.contrato || "-"}</td>
                  <td className="hide-md td-wrap">{n.sindicato || "-"}</td>
                  <td>
                    <span style={{ 
                      textTransform: "capitalize",
                      padding: "4px 8px",
                      borderRadius: "12px",
                      fontSize: "0.85rem",
                      fontWeight: 500,
                      background: n.estado === "cerrada" ? "#fef3c7" : 
                                 n.estado === "en pausa" ? "#fecaca" : "#dcfce7",
                      color: n.estado === "cerrada" ? "#92400e" : 
                             n.estado === "en pausa" ? "#991b1b" : "#166534",
                    }}>
                      {n.estado || "Sin estado"}
                    </span>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="sin-datos">
                    {total === 0 && (fMinera || fEstado || fRut || fContrato || fDesde || fHasta) 
                      ? "No se encontraron resultados con los filtros aplicados" 
                      : "No hay datos disponibles"}
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
            marginTop: "20px",
            padding: "16px",
            background: "#f8fafc",
            borderRadius: "8px",
            border: "1px solid #e2e8f0"
          }}>
            <div style={{
              width: "20px",
              height: "20px",
              border: "2px solid #e2e8f0",
              borderTop: "2px solid #0006BF",
              borderRadius: "50%",
              animation: "spin 1s linear infinite"
            }}></div>
            <span>Cargando datos...</span>
          </div>
        )}

        {/* Resumen de resultados al final */}
        {!cargando && total > 0 && (
          <div style={{ 
            marginTop: "20px", 
            padding: "12px", 
            background: "#f0f9ff", 
            borderRadius: "6px", 
            fontSize: "0.9rem",
            color: "#0369a1",
            textAlign: "center"
          }}>
            Mostrando {rows.length} de {total} registros
            {pageSafe > 1 && ` • Página ${pageSafe} de ${maxPage}`}
          </div>
        )}
      </div>
    </div>
  );
}
