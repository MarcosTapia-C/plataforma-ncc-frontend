// src/pages/admin/UsuariosAdmin.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "../../services/api"; // <-- cliente único con baseURL `${API_URL}/api`

export default function UsuariosAdmin() {
  // Datos
  const [roles, setRoles] = useState([]); // [{id_rol, nombre_rol}]
  const [usuarios, setUsuarios] = useState([]); // [{id_usuario, ..., Rol:{...}}]

  // UI / estado formulario
  const [modo, setModo] = useState("crear"); // crear | editar
  const [editId, setEditId] = useState(null);
  const [filtro, setFiltro] = useState("");
  const [cargando, setCargando] = useState(false);
  const [errores, setErrores] = useState({});

  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    email: "",
    usuario: "",
    id_rol: 2,
    contrasena: "", // solo se envía al crear
  });

  // --------- Cargar roles y usuarios ----------
  useEffect(() => {
    (async () => {
      try {
        setCargando(true);
        const rRoles = await api.get("/roles");
        setRoles(rRoles.data?.data || []);
        const rUsers = await api.get("/usuarios");
        setUsuarios(Array.isArray(rUsers.data) ? rUsers.data : []);
      } catch (e) {
        console.error("Error cargando datos:", e);
        alert("No fue posible cargar Usuarios/Roles. Revisa el token o la API.");
      } finally {
        setCargando(false);
      }
    })();
  }, []);

  // --------- Utilidades ----------
  const limpiar = () => {
    setForm({ nombre: "", apellido: "", email: "", usuario: "", id_rol: 2, contrasena: "" });
    setErrores({});
    setModo("crear");
    setEditId(null);
  };

  const validar = () => {
    const e = {};
    if (!form.nombre.trim()) e.nombre = "Requerido";
    if (!form.apellido.trim()) e.apellido = "Requerido";
    if (!form.email.trim()) e.email = "Requerido";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Formato inválido";
    if (!form.usuario.trim()) e.usuario = "Requerido";
    if (modo === "crear" && !form.contrasena.trim()) e.contrasena = "Requerida (solo al crear)";
    if (!form.id_rol) e.id_rol = "Seleccione un rol";
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const rolNombre = (id) => roles.find((r) => r.id_rol === Number(id))?.nombre_rol ?? "-";

  const usuariosFiltrados = useMemo(() => {
    const q = filtro.trim().toLowerCase();
    if (!q) return usuarios;
    return usuarios.filter((u) =>
      [u.nombre, u.apellido, u.email, u.usuario]
        .filter(Boolean)
        .some((t) => t.toLowerCase().includes(q))
    );
  }, [usuarios, filtro]);

  // --------- Acciones CRUD ----------
  const recargarUsuarios = async () => {
    const r = await api.get("/usuarios");
    setUsuarios(Array.isArray(r.data) ? r.data : []);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validar()) return;

    try {
      setCargando(true);
      if (modo === "crear") {
        await api.post("/usuarios", {
          nombre: form.nombre.trim(),
          apellido: form.apellido.trim(),
          email: form.email.trim(),
          usuario: form.usuario.trim().toLowerCase(),
          contrasena: form.contrasena,
          id_rol: Number(form.id_rol),
        });
      } else {
        await api.put(`/usuarios/${editId}`, {
          nombre: form.nombre.trim(),
          apellido: form.apellido.trim(),
          email: form.email.trim(),
          usuario: form.usuario.trim().toLowerCase(),
          id_rol: Number(form.id_rol),
        });
      }
      await recargarUsuarios();
      limpiar();
    } catch (err) {
      console.error("Error guardando usuario:", err?.response?.data || err);
      const msg =
        err?.response?.data?.mensaje ||
        (Array.isArray(err?.response?.data?.errores) && err.response.data.errores[0]?.msg) ||
        "Error al guardar.";
      alert(msg);
    } finally {
      setCargando(false);
    }
  };

  const onEditar = (u) => {
    setModo("editar");
    setEditId(u.id_usuario);
    setForm({
      nombre: u.nombre,
      apellido: u.apellido,
      email: u.email,
      usuario: u.usuario,
      id_rol: u.id_rol,
      contrasena: "",
    });
    setErrores({});
  };

  const onEliminar = async (id) => {
    if (!window.confirm("¿Eliminar este usuario?")) return;
    try {
      setCargando(true);
      await api.delete(`/usuarios/${id}`);
      await recargarUsuarios();
      if (editId === id) limpiar();
    } catch (err) {
      console.error("Error eliminando usuario:", err?.response?.data || err);
      alert(err?.response?.data?.mensaje || "Error al eliminar.");
    } finally {
      setCargando(false);
    }
  };

  // --------- Render (misma estructura visual que Empresas) ----------
  return (
    <div className="tarjeta" style={{ maxWidth: "900px", margin: "0 auto" }}>
      <h2>👥 Gestión de usuarios</h2>

      {/* FORMULARIO */}
      <form
        onSubmit={onSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          marginBottom: "15px",
        }}
      >
        {/* Fila 1: Nombre / Apellido */}
        <div style={{ display: "flex", gap: "10px" }}>
          <div className="grupo" style={{ flex: 1 }}>
            <label>Nombre</label>
            <input
              className="input"
              placeholder="Nombre"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />
          </div>
          <div className="grupo" style={{ flex: 1 }}>
            <label>Apellido</label>
            <input
              className="input"
              placeholder="Apellido"
              value={form.apellido}
              onChange={(e) => setForm({ ...form, apellido: e.target.value })}
            />
          </div>
        </div>

        {/* Fila 2: Email / Usuario */}
        <div style={{ display: "flex", gap: "10px" }}>
          <div className="grupo" style={{ flex: 1 }}>
            <label>Email</label>
            <input
              className="input"
              placeholder="correo@dominio.cl"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="grupo" style={{ flex: 1 }}>
            <label>Usuario</label>
            <input
              className="input"
              placeholder="usuario"
              value={form.usuario}
              onChange={(e) => setForm({ ...form, usuario: e.target.value })}
            />
          </div>
        </div>

        {/* Fila 3: Rol / Contraseña (solo al crear) + Botones */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div className="grupo" style={{ flex: 1 }}>
            <label>Rol</label>
            <select
              className="input"
              value={form.id_rol}
              onChange={(e) => setForm({ ...form, id_rol: Number(e.target.value) })}
            >
              {roles.map((r) => (
                <option key={r.id_rol} value={r.id_rol}>
                  {r.nombre_rol}
                </option>
              ))}
            </select>
          </div>

          {modo === "crear" && (
            <div className="grupo" style={{ flex: 1 }}>
              <label>Contraseña</label>
              <input
                className="input"
                type="password"
                placeholder="••••••"
                value={form.contrasena}
                onChange={(e) => setForm({ ...form, contrasena: e.target.value })}
              />
            </div>
          )}

          <button type="submit" className="btn btn-primario" disabled={cargando}>
            {modo === "crear" ? "Guardar" : "Actualizar"}
          </button>
          <button type="button" className="btn" onClick={limpiar} disabled={cargando}>
            Limpiar
          </button>
        </div>

        {/* errores mínimos debajo (opcionales) */}
        {Object.keys(errores).length > 0 && (
          <small className="nota" style={{ color: "#b91c1c" }}>
            Revisa los campos: {Object.keys(errores).join(", ")}.
          </small>
        )}
      </form>

      {/* LISTADO (sin columna ID en la vista) */}
      <div className="cabecera-seccion" style={{ marginBottom: 8 }}>
        <h3 className="titulo-seccion">Datos guardados</h3>
        <input
          className="input"
          style={{ maxWidth: 260 }}
          placeholder="Buscar por nombre, usuario o email…"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />
      </div>

      <div className="tabla-responsive">
        <table className="tabla" style={{ width: "100%" }}>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Apellido</th>
              <th>Email</th>
              <th>Usuario</th>
              <th>Rol</th>
              <th style={{ width: 160 }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuariosFiltrados.map((u) => (
              <tr key={u.id_usuario}>
                <td>{u.nombre}</td>
                <td>{u.apellido}</td>
                <td>{u.email}</td>
                <td>{u.usuario}</td>
                <td>{u.Rol?.nombre_rol || rolNombre(u.id_rol)}</td>
                <td className="col-acciones">
                  <button className="btn btn-mini" onClick={() => onEditar(u)} disabled={cargando}>
                    Editar
                  </button>
                  <button
                    className="btn btn-mini btn-peligro"
                    onClick={() => onEliminar(u.id_usuario)}
                    disabled={cargando}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {usuariosFiltrados.length === 0 && (
              <tr>
                <td className="sin-datos" colSpan={6}>
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
