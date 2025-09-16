// src/pages/admin/InformesAdmin.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "../../services/api";

/** adapto distintos formatos del backend a un objeto plano para la tabla */
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

/** helpers de fechas */
function yearFromISO(iso) {
  if (!iso || typeof iso !== "string") return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  return m ? Number(m[1]) : null;
}

export default function Informes() {
  const [mineras, setMineras] = useState([]);
  const [negociaciones, setNegociaciones] = useState([]);
  const [cargando, setCargando] = useState(false);

  // filtros
  const [fMinera, setFMinera] = useState("");
  const [fEstado, setFEstado] = useState("");
  const [fRut, setFRut] = useState("");
  const [fContrato, setFContrato] = useState("");
  const [fAnio, setFAnio] = useState(""); // uso el año de fechaTermino

  // paginación local
  const [pageSize, setPageSize] = useState(5);
  const [page, setPage] = useState(1);

  useEffect(() => {
    (async () => {
      try {
        setCargando(true);
        // cargo catálogos y datos base
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
    setFAnio("");
    setPage(1);
  };

  /** obtengo años disponibles desde fechaTermino (orden descendente) */
  const opcionesAnios = useMemo(() => {
    const s = new Set();
    negociaciones.forEach((n) => {
      const y = yearFromISO(n.fechaTermino);
      if (y) s.add(y);
    });
    return Array.from(s).sort((a, b) => b - a);
  }, [negociaciones]);

  // aplico filtros en memoria
  const filtradas = useMemo(() => {
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

      // filtro por año de término del contrato colectivo
      if (fAnio) {
        const y = yearFromISO(n.fechaTermino);
        if (!y || String(y) !== String(fAnio)) return false;
      }

      return true;
    });
  }, [negociaciones, fMinera, fEstado, fRut, fContrato, fAnio]);

  // cálculo de páginas
  const total = filtradas.length;
  const maxPage = Math.max(1, Math.ceil(total / pageSize));
  const pageSafe = Math.min(page, maxPage);

  // filas visibles según la página actual
  const rows = useMemo(() => {
    const start = (pageSafe - 1) * pageSize;
    return filtradas.slice(start, start + pageSize);
  }, [filtradas, pageSafe, pageSize]);

  return (
    <div className="tarjeta" style={{ maxWidth: "900px", margin: "0 auto" }}>
      <h2>📊 Informes</h2>

      {/* filtros */}
      <form className="formulario">
        <div className="form-row">
          <div className="grupo">
            <label>Minera</label>
            <select
              className="input"
              value={fMinera}
              onChange={(e) => {
                setFMinera(e.target.value);
                setPage(1);
              }}
            >
              <option value="">(todas)</option>
              {mineras.map((m) => (
                <option key={m.id_minera} value={m.nombre_minera}>
                  {m.nombre_minera}
                </option>
              ))}
            </select>
          </div>

          <div className="grupo">
            <label>Estado</label>
            <select
              className="input"
              value={fEstado}
              onChange={(e) => {
                setFEstado(e.target.value);
                setPage(1);
              }}
            >
              <option value="">(todos)</option>
              {ESTADOS.map((s) => (
                <option key={s} value={s}>
                  {s[0].toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="grupo">
            <label>RUT Empresa</label>
            <input
              className="input"
              value={fRut}
              onChange={(e) => {
                setFRut(e.target.value);
                setPage(1);
              }}
              placeholder="Ejemplo: 76.543.210-9"
            />
          </div>
          <div className="grupo">
            <label>Contrato</label>
            <input
              className="input"
              value={fContrato}
              onChange={(e) => {
                setFContrato(e.target.value);
                setPage(1);
              }}
              placeholder="Ejemplo: 000001"
            />
          </div>
        </div>

        {/* filtro por año (año de fecha_termino del C. Colectivo) */}
        <div className="form-row">
          <div className="grupo">
            <label>Negociación por Año</label>
            <select
              className="input"
              value={fAnio}
              onChange={(e) => {
                setFAnio(e.target.value);
                setPage(1);
              }}
            >
              <option value="">(todos)</option>
              {opcionesAnios.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <small className="nota">
              Se filtra por el <b>año de término</b> del contrato colectivo.
            </small>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn" onClick={limpiarFiltros}>
            Limpiar filtros
          </button>
        </div>
      </form>

      {/* controles de resultado y paginación */}
      <div className="cabecera-seccion">
        <div>
          <strong>{total}</strong> resultados
          <span className="nota">
            {" "}
            (página {pageSafe} de {maxPage})
          </span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <label className="nota">Registros</label>
          <select
            className="input"
            style={{ width: "auto", minWidth: "80px" }}
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
          >
            <option>5</option>
            <option>10</option>
            <option>20</option>
            <option>50</option>
          </select>
          <button className="btn" onClick={() => setPage((p) => Math.max(1, p - 1))}>
            ◀
          </button>
          <button className="btn" onClick={() => setPage((p) => Math.min(maxPage, p + 1))}>
            ▶
          </button>
        </div>
      </div>

      {/* tabla de resultados */}
      <div className="tabla-responsive">
        <table className="tabla">
          <thead>
            <tr>
              <th>Minera</th>
              <th>Empresa</th>
              <th className="hide-mobile" translate="no">RUT</th>
              <th>Contrato</th>
              <th className="hide-mobile">Sindicato</th>
              <th className="hide-mobile">Estado</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((n) => (
              <tr key={n.id}>
                <td>{n.minera || "-"}</td>
                <td>{n.empresa || "-"}</td>
                <td className="hide-mobile">{n.rut || "-"}</td>
                <td>{n.contrato || "-"}</td>
                <td className="hide-mobile">{n.sindicato || "-"}</td>
                <td className="hide-mobile" style={{ textTransform: "capitalize" }}>
                  {n.estado || "-"}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="sin-datos">
                  Sin resultados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {cargando && (
        <small className="nota" style={{ display: "block", marginTop: 8 }}>
          Cargando…
        </small>
      )}
    </div>
  );
}
