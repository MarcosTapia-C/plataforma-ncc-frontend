// src/pages/admin/ListaNegociaciones.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "../../services/api";

export default function ListaNegociaciones() {
  const [negociaciones, setNegociaciones] = useState([]);
  const [cargando, setCargando] = useState(false);

  // Buscador
  const [filtro, setFiltro] = useState("");

  const cargar = async () => {
    try {
      setCargando(true);
      const r = await api.get("/negociaciones");
      setNegociaciones(Array.isArray(r.data) ? r.data : r.data?.data || []);
    } catch (err) {
      console.error("Error cargando negociaciones:", err);
      alert("No fue posible cargar la lista de negociaciones.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  // Función auxiliar para mostrar porcentaje
  function formatoPorcentaje(n) {
    const pBackend = n.porcentaje_sindicalizado;
    if (typeof pBackend === "number") return `${pBackend}%`;
    const dot = Number(n.dotacion_total);
    const sind = Number(n.personal_sindicalizado);
    if (Number.isFinite(dot) && Number.isFinite(sind) && dot > 0) {
      const p = (sind * 100) / dot;
      return `${p.toFixed(2)}%`;
    }
    return "-";
  }

  // Función auxiliar para mostrar fechas en dd-mm-aaaa
  function formatoFecha(valor) {
    if (!valor) return "-";
    const fecha = new Date(valor);
    if (isNaN(fecha)) return valor;
    const d = String(fecha.getDate()).padStart(2, "0");
    const m = String(fecha.getMonth() + 1).padStart(2, "0");
    const y = fecha.getFullYear();
    return `${d}-${m}-${y}`;
  }

  // Filtrado en memoria
  const negociacionesFiltradas = useMemo(() => {
    const q = filtro.trim().toLowerCase();
    if (!q) return negociaciones;
    return negociaciones.filter((n) => {
      const empresa = n.Empresa?.nombre_empresa || "";
      const rut = n.Empresa?.rut_empresa || "";
      const minera = n.Empresa?.Minera?.nombre_minera || "";
      const sindicato = n.Sindicato?.nombre_sindicato || "";
      const estado = n.estado || "";
      const inicio = n.fecha_inicio || "";
      const termino = n.fecha_termino || "";
      return [empresa, rut, minera, sindicato, estado, inicio, termino]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [negociaciones, filtro]);

  return (
    <div className="tarjeta" style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <h2>📑 Lista de Negociaciones</h2>

      {/* Cabecera con buscador */}
      <div className="cabecera-seccion">
        <h3 className="titulo-seccion">Listado</h3>
        <div className="grupo" style={{ maxWidth: 260 }}>
          <label>Buscar</label>
          <input
            className="input"
            placeholder="Por empresa, RUT, minera, sindicato…"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          />
        </div>
      </div>

      <div className="tabla-responsive">
        <table className="tabla">
          <thead>
            <tr>
              <th>Empresa</th>
              <th className="hide-mobile" translate="no">RUT</th>
              <th>Minera</th>
              <th>Sindicato</th>
              <th className="hide-mobile">Estado</th>
              <th className="hide-mobile">Inicio</th>
              <th className="hide-mobile">Término</th>
              <th className="hide-mobile">Dotación</th>
              <th className="hide-mobile">Sindicalizados</th>
              <th className="hide-mobile">% Sindicalizados</th>
            </tr>
          </thead>
          <tbody>
            {negociacionesFiltradas.map((n) => (
              <tr key={n.id_negociacion}>
                <td>{n.Empresa?.nombre_empresa || "-"}</td>
                <td className="hide-mobile" translate="no">{n.Empresa?.rut_empresa || "-"}</td>
                <td>{n.Empresa?.Minera?.nombre_minera || "-"}</td>
                <td>{n.Sindicato?.nombre_sindicato || "-"}</td>
                <td className="hide-mobile" style={{ textTransform: "capitalize" }}>{n.estado || "-"}</td>
                <td className="hide-mobile">{formatoFecha(n.fecha_inicio)}</td>
                <td className="hide-mobile">{formatoFecha(n.fecha_termino)}</td>
                <td className="hide-mobile">
                  {Number.isFinite(Number(n.dotacion_total)) ? n.dotacion_total : "-"}
                </td>
                <td className="hide-mobile">
                  {Number.isFinite(Number(n.personal_sindicalizado))
                    ? n.personal_sindicalizado
                    : "-"}
                </td>
                <td className="hide-mobile">{formatoPorcentaje(n)}</td>
              </tr>
            ))}
            {negociacionesFiltradas.length === 0 && (
              <tr>
                <td colSpan={10} className="sin-datos">
                  Sin registros
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