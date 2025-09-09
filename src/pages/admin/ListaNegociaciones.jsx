// src/pages/admin/ListaNegociaciones.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "../../services/api"; // <-- cliente único con baseURL `${API_URL}/api`

export default function ListaNegociaciones() {
  const [negociaciones, setNegociaciones] = useState([]);
  const [cargando, setCargando] = useState(false);

  // NUEVO: buscador
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
    if (isNaN(fecha)) return valor; // si no es válido, lo muestro tal cual
    const d = String(fecha.getDate()).padStart(2, "0");
    const m = String(fecha.getMonth() + 1).padStart(2, "0");
    const y = fecha.getFullYear();
    return `${d}-${m}-${y}`;
  }

  // NUEVO: filtrado en memoria
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

  // === UI estilo "Empresas": tarjeta centrada y ancha ===
  return (
    <div className="tarjeta" style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <h2>📑 Lista de Negociaciones</h2>

      {/* NUEVO: cabecera con buscador */}
      <div className="cabecera-seccion" style={{ marginBottom: 8 }}>
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

      {/* TABLA */}
      <div className="tabla-contenedor">
        <table
          className="tabla tabla--compacta tabla--ancha tabla--sticky-first"
          style={{ width: "100%" }}
        >
          <thead>
            <tr>
              <th>Empresa</th>
              <th translate="no">RUT</th>
              <th className="hide-xs">Minera</th>
              <th className="hide-md">Sindicato</th>
              <th>Estado</th>
              <th>Inicio</th>
              <th>Término</th>
              <th className="hide-md">Dotación</th>
              <th className="hide-md">Sindicalizados</th>
              <th>% Sindicalizados</th>
            </tr>
          </thead>
          <tbody>
            {negociacionesFiltradas.map((n) => (
              <tr key={n.id_negociacion}>
                <td className="td-wrap">{n.Empresa?.nombre_empresa || "-"}</td>
                <td className="td-num" translate="no">
                  {n.Empresa?.rut_empresa || "-"}
                </td>
                <td className="hide-xs td-wrap">
                  {n.Empresa?.Minera?.nombre_minera || "-"}
                </td>
                <td className="hide-md td-wrap">
                  {n.Sindicato?.nombre_sindicato || "-"}
                </td>
                <td style={{ textTransform: "capitalize" }}>
                  {n.estado || "-"}
                </td>
                <td>{formatoFecha(n.fecha_inicio)}</td>
                <td>{formatoFecha(n.fecha_termino)}</td>
                <td className="hide-md td-num">
                  {Number.isFinite(Number(n.dotacion_total))
                    ? n.dotacion_total
                    : "-"}
                </td>
                <td className="hide-md td-num">
                  {Number.isFinite(Number(n.personal_sindicalizado))
                    ? n.personal_sindicalizado
                    : "-"}
                </td>
                <td className="td-num">{formatoPorcentaje(n)}</td>
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
