// src/pages/admin/NegociacionesAdmin.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "../../services/api";

/* =========================
   Helpers de fecha robustos
   ========================= */
function parseISO(yyyy_mm_dd) {
  if (!yyyy_mm_dd || typeof yyyy_mm_dd !== "string") return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(yyyy_mm_dd.trim());
  if (!m) return null;
  const y = Number(m[1]), mo = Number(m[2]) - 1, d = Number(m[3]);
  const dt = new Date(y, mo, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo || dt.getDate() !== d) return null;
  return dt;
}

function addMonthsStr(yyyy_mm_dd, m) {
  const d = parseISO(yyyy_mm_dd);
  if (!d) return "";
  d.setMonth(d.getMonth() + m);
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${da}`;
}

function monthsDiff(inicioISO, finISO) {
  const a = parseISO(inicioISO);
  const b = parseISO(finISO);
  if (!a || !b) return null;
  let years = b.getFullYear() - a.getFullYear();
  let months = b.getMonth() - a.getMonth();
  let total = years * 12 + months;
  if (b.getDate() < a.getDate()) total -= 1; // ajusta por día
  return total;
}

function capitalizarEstado(s) {
  if (!s) return s;
  const t = String(s).trim().toLowerCase();
  if (!t) return t;
  return t[0].toUpperCase() + t.slice(1);
}

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

/** Formatea fecha a dd-mm-aaaa (si no hay fecha, muestra "-") */
function formatearFecha(f) {
  if (!f) return "-";
  const d = parseISO(f);
  if (!d) return "-";
  const da = String(d.getDate()).padStart(2, "0");
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const y = d.getFullYear();
  return `${da}-${mo}-${y}`;
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
  });

  // Filtro tabla
  const [filtro, setFiltro] = useState("");

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

  // Autocompletar término a +36 meses cuando está "cerrada" y hay inicio
  useEffect(() => {
    if (!form.fecha_inicio) return;
    if ((form.estado || "").toLowerCase() !== "cerrada") return;
    if (form.fecha_termino) return; // respetamos lo que ingrese el usuario
    const sugerido = addMonthsStr(form.fecha_inicio, 36);
    if (sugerido) {
      setForm((f) => ({ ...f, fecha_termino: sugerido }));
    }
  }, [form.fecha_inicio, form.estado]);

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
    // 36 meses máximo y término >= inicio
    if (form.fecha_inicio && form.fecha_termino) {
      const m = monthsDiff(form.fecha_inicio, form.fecha_termino);
      if (m === null) {
        alert("Revisa el formato de fechas (YYYY-MM-DD).");
        return false;
      }
      if (m < 0) {
        alert("La fecha de término no puede ser anterior a la fecha de inicio.");
        return false;
      }
      if (m > 36) {
        alert("La vigencia del contrato colectivo no puede exceder 36 meses.");
        return false;
      }
    }
    if (form.dotacion_total !== "" && Number(form.dotacion_total) < 0) {
      alert("Dotación total debe ser ≥ 0.");
      return false;
    }
    if (form.personal_sindicalizado !== "" && Number(form.personal_sindicalizado) < 0) {
      alert("Personal sindicalizado debe ser ≥ 0.");
      return false;
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
      estado: capitalizarEstado(form.estado) || undefined,
      fecha_inicio: form.fecha_inicio || undefined,
      fecha_termino: form.fecha_termino || undefined,
      vencimiento_contrato_comercial: form.vencimiento_contrato_comercial || undefined,
    };
    if (form.dotacion_total !== "") payload.dotacion_total = Number(form.dotacion_total);
    if (form.personal_sindicalizado !== "") payload.personal_sindicalizado = Number(form.personal_sindicalizado);

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

  // ====== UI ======
  return (
    <div className="tarjeta" style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <h2>🤝 Negociaciones</h2>

      {/* FORMULARIO */}
      <form onSubmit={onSubmit} className="formulario">
        {/* Fila 1: Empresa / Sindicato */}
        <div className="form-row">
          <div className="grupo">
            <label>Empresa</label>
            <select
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
            <label>Sindicato</label>
            <select
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
        </div>

        {/* Fila 2: Contrato */}
        <div className="form-row">
          <div className="grupo">
            <label>Contrato</label>
            <input
              className="input"
              placeholder="Contrato (ej: 0000001)"
              value={form.contrato}
              onChange={(e) => setForm({ ...form, contrato: e.target.value })}
            />
          </div>
        </div>

        {/* Fila 3: Fechas contrato colectivo */}
        <div className="form-row">
          <div className="grupo">
            <label>Fecha inicio C. Colectivo</label>
            <input
              className="input"
              type="date"
              value={form.fecha_inicio}
              onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })}
            />
          </div>
          <div className="grupo">
            <label>F. término C. Colectivo</label>
            <input
              className="input"
              type="date"
              value={form.fecha_termino}
              onChange={(e) => setForm({ ...form, fecha_termino: e.target.value })}
            />
            {form.fecha_inicio && form.fecha_termino && (() => {
              const m = monthsDiff(form.fecha_inicio, form.fecha_termino);
              return Number.isFinite(m) && m >= 0 ? (
                <small className="nota">Vigencia: {m} meses (máx. 36)</small>
              ) : null;
            })()}
          </div>
        </div>

        {/* Fila 4: Estado nueva negociación */}
        <div className="form-row">
          <div className="grupo">
            <label>Estado de la nueva negociación</label>
            <select
              className="input"
              value={form.estado}
              onChange={(e) => setForm({ ...form, estado: e.target.value })}
            >
              {ESTADOS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
           
          </div>
        </div>

        {/* Fila 5: Vigencia contrato comercial */}
        <div className="form-row">
          <div className="grupo">
            <label>Vigencia contrato comercial</label>
            <input
              className="input"
              type="date"
              value={form.vencimiento_contrato_comercial}
              onChange={(e) =>
                setForm({ ...form, vencimiento_contrato_comercial: e.target.value })
              }
            />
          </div>
        </div>

        {/* Fila 6: Datos numéricos (sin % sindicalizado) */}
        <div className="form-row">
          <div className="grupo">
            <label>Dotación total</label>
            <input
              className="input"
              type="number"
              min="0"
              placeholder="Dotación total"
              value={form.dotacion_total}
              onChange={(e) => setForm({ ...form, dotacion_total: e.target.value })}
            />
          </div>
          <div className="grupo">
            <label>Personal sindicalizado</label>
            <input
              className="input"
              type="number"
              min="0"
              placeholder="Personal sindicalizado"
              value={form.personal_sindicalizado}
              onChange={(e) =>
                setForm({ ...form, personal_sindicalizado: e.target.value })
              }
            />
          </div>
        </div>

        {/* Botones */}
        <div className="form-actions">
          <button type="submit" className="btn btn-primario" disabled={cargando}>
            {editId ? "Actualizar" : "Guardar"}
          </button>
          <button type="button" className="btn" onClick={limpiar} disabled={cargando}>
            Limpiar
          </button>
        </div>
      </form>

      {/* CABECERA + BUSCADOR */}
      <div className="cabecera-seccion">
        <h3 className="titulo-seccion">Listado</h3>
        <div className="grupo" style={{ maxWidth: 260 }}>
          <label>Buscar</label>
          <input
            className="input"
            placeholder="Por empresa, minera, sindicato o contrato…"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          />
        </div>
      </div>

      {/* TABLA (listado simplificado) */}
      <div className="tabla-responsive">
        <table className="tabla">
          <thead>
            <tr>
              <th>Minera</th>
              <th>Empresa</th>
              <th>Sindicato</th>
              <th>Contrato</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((n) => (
              <tr key={n.id}>
                <td>{n.minera || "-"}</td>
                <td>{n.empresa || "-"}</td>
                <td>{n.sindicato || "-"}</td>
                <td>{n.contrato || "-"}</td>
                <td className="col-acciones">
                  <button className="btn btn-mini" onClick={() => onEditar(n)} disabled={cargando}>
                    Editar
                  </button>
                  <button
                    className="btn btn-mini btn-peligro"
                    onClick={() => onEliminar(n)}
                    disabled={cargando}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {filas.length === 0 && (
              <tr>
                <td className="sin-datos" colSpan={5}>
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
