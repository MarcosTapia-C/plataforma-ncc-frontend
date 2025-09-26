// src/pages/admin/NegociacionesAdmin.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "../../services/api";

/** Adapta distintos formatos devueltos por el backend a un formato plano uniforme */
function normalizarNeg(n) {
  const minera =
    n?.minera ||
    n?.nombre_minera ||
    n?.Minera?.nombre_minera ||
    n?.Empresa?.Minera?.nombre_minera ||
    "";
  const empresa =
    n?.empresa || n?.nombre_empresa || n?.Empresa?.nombre_empresa || "";
  const rutEmpresa =
    n?.rutEmpresa || n?.rut_empresa || n?.Empresa?.rut_empresa || "";
  const contrato = n?.contrato || n?.codigo_contrato || n?.num_contrato || "";
  const sindicato =
    n?.sindicato || n?.nombre_sindicato || n?.Sindicato?.nombre_sindicato || "";
  const estado = n?.estado || "";
  const id = n?.id_negociacion ?? n?.id ?? null;

  return {
    id_negociacion: id,
    minera,
    empresa,
    rutEmpresa,
    contrato,
    sindicato,
    estado,
  };
}

function capitalizarEstado(v) {
  if (!v) return "";
  const s = String(v).trim().toLowerCase();
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function NegociacionesAdmin() {
  const [items, setItems] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [sindicatos, setSindicatos] = useState([]);

  const [form, setForm] = useState({
    id_empresa: "",
    id_sindicato: "",
    contrato: "",
    estado: "",
    fecha_inicio: "",
    fecha_termino: "",
    vencimiento_contrato_comercial: "",
    dotacion_total: "",
    personal_sindicalizado: "",
  });

  const [editId, setEditId] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [filtro, setFiltro] = useState("");

  useEffect(() => {
    cargarTodo();
  }, []);

  async function cargarTodo() {
    setCargando(true);
    try {
      const [rNeg, rEmp, rSin] = await Promise.all([
        api.get("/negociaciones"),
        api.get("/empresas"),
        api.get("/sindicatos"),
      ]);

      const arrNeg =
        (Array.isArray(rNeg.data) ? rNeg.data : rNeg.data?.data) || [];
      setItems(arrNeg.map(normalizarNeg));

      const arrEmp =
        (Array.isArray(rEmp.data) ? rEmp.data : rEmp.data?.data) || [];
      setEmpresas(
        arrEmp.map((e) => ({
          id_empresa: e?.id_empresa ?? e?.id,
          nombre_empresa:
            e?.nombre_empresa ?? e?.empresa ?? e?.nombre ?? "Empresa",
        }))
      );

      const arrSin =
        (Array.isArray(rSin.data) ? rSin.data : rSin.data?.data) || [];
      setSindicatos(
        arrSin.map((s) => ({
          id_sindicato: s?.id_sindicato ?? s?.id,
          nombre_sindicato:
            s?.nombre_sindicato ?? s?.sindicato ?? s?.nombre ?? "Sindicato",
        }))
      );
    } catch (err) {
      const msg =
        err?.response?.data?.mensaje ||
        err?.response?.data?.error ||
        "No fue posible cargar los datos.";
      alert(msg);
      console.warn("Carga inicial falló:", err);
    } finally {
      setCargando(false);
    }
  }

  function limpiar() {
    setForm({
      id_empresa: "",
      id_sindicato: "",
      contrato: "",
      estado: "",
      fecha_inicio: "",
      fecha_termino: "",
      vencimiento_contrato_comercial: "",
      dotacion_total: "",
      personal_sindicalizado: "",
    });
    setEditId(null);
  }

  function onEditar(item) {
    setEditId(item.id_negociacion);
    setForm((prev) => ({
      ...prev,
      id_empresa: item.id_empresa || "",
      id_sindicato: item.id_sindicato || "",
      contrato: item.contrato || "",
      estado: item.estado || "",
      fecha_inicio: "",
      fecha_termino: "",
      vencimiento_contrato_comercial: "",
      dotacion_total: "",
      personal_sindicalizado: "",
    }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function onEliminar(id) {
    if (!id) return;
    if (!window.confirm("¿Eliminar esta negociación?")) return;
    setCargando(true);
    try {
      await api.delete(`/negociaciones/${id}`);
      const rNeg = await api.get("/negociaciones");
      const arrNeg =
        (Array.isArray(rNeg.data) ? rNeg.data : rNeg.data?.data) || [];
      setItems(arrNeg.map(normalizarNeg));
    } catch (err) {
      const msg =
        err?.response?.data?.mensaje ||
        err?.response?.data?.error ||
        "No fue posible eliminar.";
      alert(msg);
    } finally {
      setCargando(false);
    }
  }

  function validar() {
    if (!form.id_empresa) {
      alert("Selecciona la empresa.");
      return false;
    }
    if (!form.id_sindicato) {
      alert("Selecciona el sindicato.");
      return false;
    }
    if (!String(form.contrato || "").trim()) {
      alert("Ingresa el contrato.");
      return false;
    }
    return true;
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validar()) return;

    const payload = {
      id_empresa: Number(form.id_empresa),
      id_sindicato: Number(form.id_sindicato),
      contrato: String(form.contrato || "").trim(),
      estado: capitalizarEstado(form.estado) || undefined,
      fecha_inicio: form.fecha_inicio || undefined,
      fecha_termino: form.fecha_termino || undefined,
      vencimiento_contrato_comercial:
        form.vencimiento_contrato_comercial || undefined,
    };
    if (form.dotacion_total !== "")
      payload.dotacion_total = Number(form.dotacion_total);
    if (form.personal_sindicalizado !== "")
      payload.personal_sindicalizado = Number(form.personal_sindicalizado);

    setCargando(true);
    try {
      if (editId) {
        await api.put(`/negociaciones/${editId}`, payload);
      } else {
        await api.post(`/negociaciones`, payload);
      }

      const rNeg = await api.get("/negociaciones");
      const arrNeg =
        (Array.isArray(rNeg.data) ? rNeg.data : rNeg.data?.data) || [];
      setItems(arrNeg.map(normalizarNeg));
      limpiar();
    } catch (err) {
      const st = err?.response?.status;
      const data = err?.response?.data;

      if (
        st === 409 &&
        (data?.error === "NEGOCIACION_DUPLICADA" ||
          /negociaci/i.test(data?.mensaje))
      ) {
        alert(
          data?.mensaje ||
            "Esta negociación ya existe en la plataforma."
        );
      } else {
        const msg =
          data?.mensaje ||
          (Array.isArray(data?.errores) && data.errores[0]?.msg) ||
          data?.error ||
          err?.message ||
          "Error de API al guardar.";
        alert(msg);
      }

      console.warn("POST/PUT /negociaciones falló →", st, data || err);
    } finally {
      setCargando(false);
    }
  };

  const filtrados = useMemo(() => {
    const f = String(filtro || "").trim().toLowerCase();
    if (!f) return items;
    return items.filter((x) => {
      return (
        String(x.minera || "").toLowerCase().includes(f) ||
        String(x.empresa || "").toLowerCase().includes(f) ||
        String(x.rutEmpresa || "").toLowerCase().includes(f) ||
        String(x.contrato || "").toLowerCase().includes(f) ||
        String(x.sindicato || "").toLowerCase().includes(f) ||
        String(x.estado || "").toLowerCase().includes(f)
      );
    });
  }, [items, filtro]);

  return (
    <div>
      <h1>Negociaciones (Admin)</h1>

      <form onSubmit={onSubmit}>
        <div>
          <label>Empresa</label>
          <select
            value={form.id_empresa}
            onChange={(e) =>
              setForm((s) => ({ ...s, id_empresa: e.target.value }))
            }
          >
            <option value="">-- Selecciona --</option>
            {empresas.map((e) => (
              <option key={e.id_empresa} value={e.id_empresa}>
                {e.nombre_empresa}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Sindicato</label>
          <select
            value={form.id_sindicato}
            onChange={(e) =>
              setForm((s) => ({ ...s, id_sindicato: e.target.value }))
            }
          >
            <option value="">-- Selecciona --</option>
            {sindicatos.map((s) => (
              <option key={s.id_sindicato} value={s.id_sindicato}>
                {s.nombre_sindicato}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Contrato</label>
          <input
            type="text"
            value={form.contrato}
            onChange={(e) =>
              setForm((s) => ({ ...s, contrato: e.target.value }))
            }
            maxLength={100}
            placeholder="Ej: 454000XXXX"
          />
        </div>

        <div>
          <label>Estado</label>
          <input
            type="text"
            value={form.estado}
            onChange={(e) =>
              setForm((s) => ({ ...s, estado: e.target.value }))
            }
            maxLength={50}
            placeholder="Abierta / Cerrada"
          />
        </div>

        <div>
          <label>Fecha inicio</label>
          <input
            type="date"
            value={form.fecha_inicio}
            onChange={(e) =>
              setForm((s) => ({ ...s, fecha_inicio: e.target.value }))
            }
          />
        </div>

        <div>
          <label>Fecha término</label>
          <input
            type="date"
            value={form.fecha_termino}
            onChange={(e) =>
              setForm((s) => ({ ...s, fecha_termino: e.target.value }))
            }
          />
        </div>

        <div>
          <label>Venc. contrato comercial</label>
          <input
            type="date"
            value={form.vencimiento_contrato_comercial}
            onChange={(e) =>
              setForm((s) => ({
                ...s,
                vencimiento_contrato_comercial: e.target.value,
              }))
            }
          />
        </div>

        <div>
          <label>Dotación total</label>
          <input
            type="number"
            min="0"
            value={form.dotacion_total}
            onChange={(e) =>
              setForm((s) => ({ ...s, dotacion_total: e.target.value }))
            }
          />
        </div>

        <div>
          <label>Personal sindicalizado</label>
          <input
            type="number"
            min="0"
            value={form.personal_sindicalizado}
            onChange={(e) =>
              setForm((s) => ({
                ...s,
                personal_sindicalizado: e.target.value,
              }))
            }
          />
        </div>

        <div>
          <button type="submit" disabled={cargando}>
            {editId ? "Actualizar" : "Guardar"}
          </button>
          <button type="button" onClick={limpiar} disabled={cargando}>
            Limpiar
          </button>
        </div>
      </form>

      <div>
        <div>
          <input
            placeholder="Filtrar por texto…"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          />
          <button onClick={cargarTodo} disabled={cargando}>
            Recargar
          </button>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Minera</th>
              <th>Empresa</th>
              <th>RUT</th>
              <th>Contrato</th>
              <th>Sindicato</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((it) => (
              <tr key={it.id_negociacion}>
                <td>{it.id_negociacion}</td>
                <td>{it.minera}</td>
                <td>{it.empresa}</td>
                <td>{it.rutEmpresa}</td>
                <td>{it.contrato}</td>
                <td>{it.sindicato}</td>
                <td>{it.estado}</td>
                <td>
                  <button onClick={() => onEditar(it)} disabled={cargando}>
                    Editar
                  </button>
                  <button
                    onClick={() => onEliminar(it.id_negociacion)}
                    disabled={cargando}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: "center" }}>
                  Sin resultados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
