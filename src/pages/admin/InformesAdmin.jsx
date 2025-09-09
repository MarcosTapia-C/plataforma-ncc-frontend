// src/pages/admin/InformesAdmin.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "../../services/api";

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

  const [pageSize, setPageSize] = useState(5);
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
    <div className="tarjeta" style={{ maxWidth: "900px", margin: "0 auto" }}>
      <h2>📊 Informes</h2>

      {/* FILTROS */}
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
              placeholder="Ej: 76.543.210-9"
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
              placeholder="Ej: 000001"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="grupo">
            <label>Desde</label>
            <input
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
            <label>Hasta</label>
            <input
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

        <div className="form-actions">
          <button type="button" className="btn" onClick={limpiarFiltros}>
            Limpiar filtros
          </button>
        </div>
      </form>

      {/* CONTROLES (resultados + paginación) */}
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
          <button
            className="btn"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ◀
          </button>
          <button
            className="btn"
            onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
          >
            ▶
          </button>
        </div>
      </div>

      {/* TABLA */}
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