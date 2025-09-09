// src/pages/admin/NegociacionesAdmin.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "../../services/api"; // <-- cliente único con baseURL `${API_URL}/api`

/** Normaliza una negociación del backend a una fila plana para la tabla */
function normalizarNeg(n) {
  const id = n.id_negociacion ?? n.id ?? Math.random().toString(36).slice(2);
  const empresa = n?.Empresa?.nombre_empresa || n.nombre_empresa || n.empresa || "";
  const minera =
    n?.Empresa?.Minera?.nombre_minera ||
    n?.Minera?.nombre_minera ||
    n.nombre_minera ||
    n.minera ||
    "";
  const sindicato = n?.Sindicato?.nombre_sindicato || n.nombre_sindicato || n.sindicato || "";
  const contrato = n.contrato || n.codigo_contrato || n.num_contrato || "";
  const estado = (n.estado || "").toLowerCase();
  const fecha_inicio = n.fecha_inicio || n.fechaInicio || "";
  const fecha_termino = n.fecha_termino || n.fechaTermino || "";
  const vencimiento = n.vencimiento_contrato_comercial || n.vencimiento || "";

  return {
    id,
    empresa,
    minera,
    sindicato,
    contrato,
    estado,
    fecha_inicio,
    fecha_termino,
    vencimiento,
    _raw: n,
  };
}

const ESTADOS = ["en proceso", "en pausa", "cerrada"];

/** Formateo de fecha a dd-mm-aaaa (si no hay fecha, muestra "-") */
function formatearFecha(f) {
  if (!f) return "-";
  const d = new Date(f);
  if (isNaN(d)) return "-";
  return d.toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function NegociacionesAdmin() {
  const [empresas, setEmpresas] = useState([]);
  const [sindicatos, setSindicatos] = useState([]);
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(false);

  // Formulario
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    id_empresa: "",
    id_sindicato: "",
    contrato: "",
    estado: "en proceso",
    fecha_inicio: "",
    fecha_termino: "",
    vencimiento_contrato_comercial: "",
    dotacion_total: "",
    personal_sindicalizado: "",
    porcentaje_sindicalizado: "",
  });

  // Filtro tabla
  const [filtro, setFiltro] = useState("");

  // Estado para mostrar/ocultar secciones del formulario en móvil
  const [seccionFormVisible, setSeccionFormVisible] = useState({
    basica: true,
    fechas: false,
    numeros: false
  });

  // Carga inicial
  useEffect(() => {
    (async () => {
      setCargando(true);
      try {
        const [rEmp, rSin, rNeg] = await Promise.all([
          api.get("/empresas"),
          api.get("/sindicatos"),
          api.get("/negociaciones"),
        ]);
        const arrEmp = rEmp.data?.data || [];
        const arrSin = rSin.data?.data || [];
        const arrNeg = (Array.isArray(rNeg.data) ? rNeg.data : rNeg.data?.data) || [];
        setEmpresas(arrEmp);
        setSindicatos(arrSin);
        setItems(arrNeg.map(normalizarNeg));
      } finally {
        setCargando(false);
      }
    })();
  }, []);

  // Opciones selects
  const opcionesEmpresas = useMemo(
    () =>
      empresas.map((e) => ({
        id: e.id_empresa,
        label: `${e?.Minera?.nombre_minera ? e.Minera.nombre_minera + " — " : ""}${e.nombre_empresa}`,
      })),
    [empresas]
  );
  const opcionesSindicatos = useMemo(
    () => sindicatos.map((s) => ({ id: s.id_sindicato, label: s.nombre_sindicato })),
    [sindicatos]
  );

  const limpiar = () => {
    setEditId(null);
    setForm({
      id_empresa: "",
      id_sindicato: "",
      contrato: "",
      estado: "en proceso",
      fecha_inicio: "",
      fecha_termino: "",
      vencimiento_contrato_comercial: "",
      dotacion_total: "",
      personal_sindicalizado: "",
      porcentaje_sindicalizado: "",
    });
    // Resetear visibilidad de secciones
    setSeccionFormVisible({
      basica: true,
      fechas: false,
      numeros: false
    });
  };

  const onEditar = (row) => {
    const n = row._raw;
    setEditId(n.id_negociacion);
    setForm({
      id_empresa: n.id_empresa || "",
      id_sindicato: n.id_sindicato || "",
      contrato: n.contrato || "",
      estado: (n.estado || "en proceso").toLowerCase(),
      fecha_inicio: n.fecha_inicio || "",
      fecha_termino: n.fecha_termino || "",
      vencimiento_contrato_comercial: n.vencimiento_contrato_comercial || "",
      dotacion_total: n.dotacion_total ?? "",
      personal_sindicalizado: n.personal_sindicalizado ?? "",
      porcentaje_sindicalizado: n.porcentaje_sindicalizado ?? "",
    });
    // Expandir todas las secciones al editar
    setSeccionFormVisible({
      basica: true,
      fechas: true,
      numeros: true
    });
  };

  const onEliminar = async (row) => {
    if (!window.confirm("¿Eliminar esta negociación?")) return;
    setCargando(true);
    try {
      await api.delete(`/negociaciones/${row.id}`);
      const rNeg = await api.get("/negociaciones");
      const arrNeg = (Array.isArray(rNeg.data) ? rNeg.data : rNeg.data?.data) || [];
      setItems(arrNeg.map(normalizarNeg));
      if (editId === row.id) limpiar();
    } finally {
      setCargando(false);
    }
  };

  const validar = () => {
    if (!form.id_empresa) {
      alert("Selecciona una Empresa.");
      return false;
    }
    if (!form.id_sindicato) {
      alert("Selecciona un Sindicato.");
      return false;
    }
    if (!String(form.contrato).trim()) {
      alert("El campo Contrato es obligatorio.");
      return false;
    }
    if (form.dotacion_total !== "" && Number(form.dotacion_total) < 0) {
      alert("Dotación total debe ser ≥ 0.");
      return false;
    }
    if (form.personal_sindicalizado !== "" && Number(form.personal_sindicalizado) < 0) {
      alert("Personal sindicalizado debe ser ≥ 0.");
      return false;
    }
    if (form.porcentaje_sindicalizado !== "") {
      const p = Number(form.porcentaje_sindicalizado);
      if (isNaN(p) || p < 0 || p > 100) {
        alert("Porcentaje sindicalizado debe estar entre 0 y 100.");
        return false;
      }
    }
    return true;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validar()) return;

    const payload = {
      id_empresa: Number(form.id_empresa),
      id_sindicato: Number(form.id_sindicato),
      contrato: form.contrato.trim(),
      estado: form.estado || undefined,
      fecha_inicio: form.fecha_inicio || undefined,
      fecha_termino: form.fecha_termino || undefined,
      vencimiento_contrato_comercial: form.vencimiento_contrato_comercial || undefined,
    };
    if (form.dotacion_total !== "") payload.dotacion_total = Number(form.dotacion_total);
    if (form.personal_sindicalizado !== "") payload.personal_sindicalizado = Number(form.personal_sindicalizado);
    if (form.porcentaje_sindicalizado !== "") payload.porcentaje_sindicalizado = Number(form.porcentaje_sindicalizado);

    setCargando(true);
    try {
      if (editId) {
        await api.put(`/negociaciones/${editId}`, payload);
      } else {
        await api.post("/negociaciones", payload);
      }
      const rNeg = await api.get("/negociaciones");
      const arrNeg = (Array.isArray(rNeg.data) ? rNeg.data : rNeg.data?.data) || [];
      setItems(arrNeg.map(normalizarNeg));
      limpiar();
    } finally {
      setCargando(false);
    }
  };

  // Filtro tabla
  const filas = useMemo(() => {
    const q = filtro.trim().toLowerCase();
    if (!q) return items;
    return items.filter((n) =>
      [n.empresa, n.minera, n.sindicato, n.contrato, n.estado, n.fecha_inicio, n.fecha_termino, n.vencimiento]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [items, filtro]);

  // Componente para toggle de secciones en móvil
  const SeccionToggle = ({ titulo, isOpen, toggle, children }) => (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", marginBottom: "16px" }}>
      <button
        type="button"
        onClick={toggle}
        style={{
          width: "100%",
          padding: "12px 16px",
          background: isOpen ? "#f8fafc" : "#fff",
          border: "none",
          borderRadius: "8px 8px 0 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: "0.95rem",
          fontWeight: 600,
          cursor: "pointer"
        }}
      >
        <span>{titulo}</span>
        <span style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
          ▼
        </span>
      </button>
      {isOpen && (
        <div style={{ padding: "16px" }}>
          {children}
        </div>
      )}
    </div>
  );

  // ====== UI ======
  return (
    <div className="contenedor-pagina">
      <div className="tarjeta" style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div className="barra-pagina">
          <h2 className="titulo">🤝 Gestión de Negociaciones</h2>
        </div>

        {/* FORMULARIO RESPONSIVO CON SECCIONES COLAPSABLES */}
        <form onSubmit={onSubmit} className="formulario">
          
          {/* Versión Desktop: Todo visible */}
          <div className="hide-mobile-only">
            {/* Información básica */}
            <div style={{ background: "#f8fafc", padding: "20px", borderRadius: "8px", marginBottom: "20px" }}>
              <h3 style={{ margin: "0 0 16px 0", fontSize: "1.1rem", fontWeight: 600 }}>Información básica</h3>
              <div className="grid-form-2">
                <div className="grupo">
                  <label htmlFor="select-empresa">Empresa *</label>
                  <select
                    id="select-empresa"
                    className="input"
                    value={form.id_empresa}
                    onChange={(e) => setForm({ ...form, id_empresa: e.target.value })}
                  >
                    <option value="">Seleccionar Empresa</option>
                    {opcionesEmpresas.map((o) => (
                      <option key={o.id} value={o.id}>{o.label}</option>
                    ))}
                  </select>
                </div>

                <div className="grupo">
                  <label htmlFor="select-sindicato">Sindicato *</label>
                  <select
                    id="select-sindicato"
                    className="input"
                    value={form.id_sindicato}
                    onChange={(e) => setForm({ ...form, id_sindicato: e.target.value })}
                  >
                    <option value="">Seleccionar Sindicato</option>
                    {opcionesSindicatos.map((o) => (
                      <option key={o.id} value={o.id}>{o.label}</option>
                    ))}
                  </select>
                </div>

                <div className="grupo">
                  <label htmlFor="input-contrato">Contrato *</label>
                  <input
                    id="input-contrato"
                    className="input"
                    placeholder="Número de contrato (ej: 0000001)"
                    value={form.contrato}
                    onChange={(e) => setForm({ ...form, contrato: e.target.value })}
                    autoComplete="off"
                  />
                </div>

                <div className="grupo">
                  <label htmlFor="select-estado">Estado</label>
                  <select
                    id="select-estado"
                    className="input"
                    value={form.estado}
                    onChange={(e) => setForm({ ...form, estado: e.target.value })}
                  >
                    {ESTADOS.map((s) => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Fechas */}
            <div style={{ background: "#f8fafc", padding: "20px", borderRadius: "8px", marginBottom: "20px" }}>
              <h3 style={{ margin: "0 0 16px 0", fontSize: "1.1rem", fontWeight: 600 }}>Fechas</h3>
              <div className="grid-form-2">
                <div className="grupo">
                  <label htmlFor="fecha-inicio">Inicio negociación</label>
                  <input
                    id="fecha-inicio"
                    className="input"
                    type="date"
                    value={form.fecha_inicio}
                    onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })}
                  />
                </div>

                <div className="grupo">
                  <label htmlFor="fecha-termino">Término negociación</label>
                  <input
                    id="fecha-termino"
                    className="input"
                    type="date"
                    value={form.fecha_termino}
                    onChange={(e) => setForm({ ...form, fecha_termino: e.target.value })}
                  />
                </div>

                <div className="grupo" style={{ gridColumn: "1 / -1" }}>
                  <label htmlFor="fecha-vencimiento">Vigencia contrato comercial</label>
                  <input
                    id="fecha-vencimiento"
                    className="input"
                    type="date"
                    value={form.vencimiento_contrato_comercial}
                    onChange={(e) =>
                      setForm({ ...form, vencimiento_contrato_comercial: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Datos numéricos */}
            <div style={{ background: "#f8fafc", padding: "20px", borderRadius: "8px", marginBottom: "20px" }}>
              <h3 style={{ margin: "0 0 16px 0", fontSize: "1.1rem", fontWeight: 600 }}>Datos de personal</h3>
              <div className="grid-form-2">
                <div className="grupo">
                  <label htmlFor="dotacion-total">Dotación total</label>
                  <input
                    id="dotacion-total"
                    className="input"
                    type="number"
                    min="0"
                    placeholder="Número total de empleados"
                    value={form.dotacion_total}
                    onChange={(e) => setForm({ ...form, dotacion_total: e.target.value })}
                  />
                </div>

                <div className="grupo">
                  <label htmlFor="personal-sindicalizado">Personal sindicalizado</label>
                  <input
                    id="personal-sindicalizado"
                    className="input"
                    type="number"
                    min="0"
                    placeholder="Empleados sindicalizados"
                    value={form.personal_sindicalizado}
                    onChange={(e) =>
                      setForm({ ...form, personal_sindicalizado: e.target.value })
                    }
                  />
                </div>

                <div className="grupo">
                  <label htmlFor="porcentaje-sindicalizado">% Sindicalizado</label>
                  <input
                    id="porcentaje-sindicalizado"
                    className="input"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="Porcentaje (0-100)"
                    value={form.porcentaje_sindicalizado}
                    onChange={(e) =>
                      setForm({ ...form, porcentaje_sindicalizado: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Versión Móvil: Secciones colapsables */}
          <div className="show-mobile-only">
            <SeccionToggle
              titulo="Información básica *"
              isOpen={seccionFormVisible.basica}
              toggle={() => setSeccionFormVisible(prev => ({...prev, basica: !prev.basica}))}
            >
              <div style={{ display: "grid", gap: "16px" }}>
                <div className="grupo">
                  <label htmlFor="select-empresa-mobile">Empresa *</label>
                  <select
                    id="select-empresa-mobile"
                    className="input"
                    value={form.id_empresa}
                    onChange={(e) => setForm({ ...form, id_empresa: e.target.value })}
                  >
                    <option value="">Seleccionar Empresa</option>
                    {opcionesEmpresas.map((o) => (
                      <option key={o.id} value={o.id}>{o.label}</option>
                    ))}
                  </select>
                </div>

                <div className="grupo">
                  <label htmlFor="select-sindicato-mobile">Sindicato *</label>
                  <select
                    id="select-sindicato-mobile"
                    className="input"
                    value={form.id_sindicato}
                    onChange={(e) => setForm({ ...form, id_sindicato: e.target.value })}
                  >
                    <option value="">Seleccionar Sindicato</option>
                    {opcionesSindicatos.map((o) => (
                      <option key={o.id} value={o.id}>{o.label}</option>
                    ))}
                  </select>
                </div>

                <div className="grupo">
                  <label htmlFor="input-contrato-mobile">Contrato *</label>
                  <input
                    id="input-contrato-mobile"
                    className="input"
                    placeholder="Número de contrato"
                    value={form.contrato}
                    onChange={(e) => setForm({ ...form, contrato: e.target.value })}
                    autoComplete="off"
                  />
                </div>

                <div className="grupo">
                  <label htmlFor="select-estado-mobile">Estado</label>
                  <select
                    id="select-estado-mobile"
                    className="input"
                    value={form.estado}
                    onChange={(e) => setForm({ ...form, estado: e.target.value })}
                  >
                    {ESTADOS.map((s) => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>
            </SeccionToggle>

            <SeccionToggle
              titulo="Fechas (opcional)"
              isOpen={seccionFormVisible.fechas}
              toggle={() => setSeccionFormVisible(prev => ({...prev, fechas: !prev.fechas}))}
            >
              <div style={{ display: "grid", gap: "16px" }}>
                <div className="grupo">
                  <label htmlFor="fecha-inicio-mobile">Inicio negociación</label>
                  <input
                    id="fecha-inicio-mobile"
                    className="input"
                    type="date"
                    value={form.fecha_inicio}
                    onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })}
                  />
                </div>

                <div className="grupo">
                  <label htmlFor="fecha-termino-mobile">Término negociación</label>
                  <input
                    id="fecha-termino-mobile"
                    className="input"
                    type="date"
                    value={form.fecha_termino}
                    onChange={(e) => setForm({ ...form, fecha_termino: e.target.value })}
                  />
                </div>

                <div className="grupo">
                  <label htmlFor="fecha-vencimiento-mobile">Vigencia contrato comercial</label>
                  <input
                    id="fecha-vencimiento-mobile"
                    className="input"
                    type="date"
                    value={form.vencimiento_contrato_comercial}
                    onChange={(e) =>
                      setForm({ ...form, vencimiento_contrato_comercial: e.target.value })
                    }
                  />
                </div>
              </div>
            </SeccionToggle>

            <SeccionToggle
              titulo="Datos de personal (opcional)"
              isOpen={seccionFormVisible.numeros}
              toggle={() => setSeccionFormVisible(prev => ({...prev, numeros: !prev.numeros}))}
            >
              <div style={{ display: "grid", gap: "16px" }}>
                <div className="grupo">
                  <label htmlFor="dotacion-total-mobile">Dotación total</label>
                  <input
                    id="dotacion-total-mobile"
                    className="input"
                    type="number"
                    min="0"
                    placeholder="Número total de empleados"
                    value={form.dotacion_total}
                    onChange={(e) => setForm({ ...form, dotacion_total: e.target.value })}
                  />
                </div>

                <div className="grupo">
                  <label htmlFor="personal-sindicalizado-mobile">Personal sindicalizado</label>
                  <input
                    id="personal-sindicalizado-mobile"
                    className="input"
                    type="number"
                    min="0"
                    placeholder="Empleados sindicalizados"
                    value={form.personal_sindicalizado}
                    onChange={(e) =>
                      setForm({ ...form, personal_sindicalizado: e.target.value })
                    }
                  />
                </div>

                <div className="grupo">
                  <label htmlFor="porcentaje-sindicalizado-mobile">% Sindicalizado</label>
                  <input
                    id="porcentaje-sindicalizado-mobile"
                    className="input"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="Porcentaje (0-100)"
                    value={form.porcentaje_sindicalizado}
                    onChange={(e) =>
                      setForm({ ...form, porcentaje_sindicalizado: e.target.value })
                    }
                  />
                </div>
              </div>
            </SeccionToggle>
          </div>

          {/* Acciones del formulario */}
          <div className="acciones-centro" style={{ marginTop: "20px" }}>
            <button
              type="submit"
              className="btn btn-primario btn-lg"
              disabled={cargando}
              aria-label={editId ? "Actualizar negociación" : "Guardar negociación"}
            >
              {editId ? "Actualizar Negociación" : "Guardar Negociación"}
            </button>
            <button
              type="button"
              className="btn btn-lg"
              onClick={limpiar}
              disabled={cargando}
              aria-label="Limpiar formulario"
            >
              Limpiar Formulario
            </button>
          </div>
        </form>

        {/* CABECERA + BUSCADOR */}
        <div className="cabecera-seccion" style={{ marginTop: "32px", marginBottom: "16px" }}>
          <h3 className="titulo-seccion">Listado de Negociaciones ({filas.length})</h3>
          <div className="grupo" style={{ maxWidth: 300 }}>
            <label htmlFor="filtro-tabla" className="sr-only">Buscar negociaciones</label>
            <input
              id="filtro-tabla"
              className="input"
              placeholder="Buscar por empresa, minera, sindicato..."
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
                <th className="hide-sm">Minera</th>
                <th className="hide-md">Sindicato</th>
                <th className="hide-xs td-num">Contrato</th>
                <th>Estado</th>
                <th className="hide-sm">Inicio</th>
                <th className="hide-md">Término</th>
                <th className="hide-md">Vencimiento</th>
                <th style={{ width: "120px", textAlign: "center" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((n) => (
                <tr key={n.id}>
                  <td className="td-wrap">
                    <div style={{ fontWeight: 500 }}>{n.empresa || "-"}</div>
                    {/* Información adicional en móvil */}
                    <div className="show-mobile-only" style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "2px" }}>
                      {n.minera && <div>🏔️ {n.minera}</div>}
                      {n.contrato && <div>📄 {n.contrato}</div>}
                      {n.sindicato && <div>✊ {n.sindicato}</div>}
                    </div>
                  </td>
                  <td className="hide-sm td-wrap">{n.minera || "-"}</td>
                  <td className="hide-md td-wrap">{n.sindicato || "-"}</td>
                  <td className="hide-xs td-num">
                    <code style={{ fontSize: "0.85rem", background: "#f1f5f9", padding: "2px 4px", borderRadius: "3px" }}>
                      {n.contrato || "-"}
                    </code>
                  </td>
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
                  <td className="hide-sm">{formatearFecha(n.fecha_inicio)}</td>
                  <td className="hide-md">{formatearFecha(n.fecha_termino)}</td>
                  <td className="hide-md">{formatearFecha(n.vencimiento)}</td>
                  <td className="col-acciones">
                    <button
                      className="btn btn-mini"
                      onClick={() => onEditar(n)}
                      disabled={cargando}
                      aria-label={`Editar negociación de ${n.empresa}`}
                      title="Editar negociación"
                    >
                      ✏️
                    </button>
                    <button
                      className="btn btn-mini btn-peligro"
                      onClick={() => onEliminar(n)}
                      disabled={cargando}
                      aria-label={`Eliminar negociación de ${n.empresa}`}
                      title="Eliminar negociación"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
              {filas.length === 0 && (
                <tr>
                  <td className="sin-datos" colSpan={9}>
                    {filtro ? "No se encontraron negociaciones que coincidan con la búsqueda" : "No hay negociaciones registradas"}
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
            <span>Procesando...</span>
          </div>
        )}
      </div>

      {/* Estilos adicionales */}
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
        @media (max-width: 768px) {
          .hide-mobile-only { display: none !important; }
        }
        @media (min-width: 769px) {
          .show-mobile-only { display: none !important; }
        }
      `}</style>
    </div>
  );
}