// src/pages/Panel.jsx
import React, { useEffect, useState, useCallback } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";

export default function Panel({ usuario, onSalir }) {
  const navigate = useNavigate();
  const location = useLocation();
  const esAdmin = usuario?.id_rol === 1;

  // Estado: menu móvil
  const [menuAbierto, setMenuAbierto] = useState(false);

  // Cerrar con ESC y al cambiar de ruta
  useEffect(() => {
    const onEsc = (e) => e.key === "Escape" && setMenuAbierto(false);
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, []);
  useEffect(() => {
    // al navegar, cerrar menú móvil
    setMenuAbierto(false);
  }, [location.pathname]);

  // Evitar scroll del body con el menú abierto
  useEffect(() => {
    const prev = document.body.style.overflow;
    if (menuAbierto) document.body.style.overflow = "hidden";
    else document.body.style.overflow = prev || "";
    return () => (document.body.style.overflow = prev || "");
  }, [menuAbierto]);

  const ir = useCallback(
    (ruta) => {
      navigate(ruta);
      // se cierra por el efecto de location, pero cerramos aquí también por UX
      setMenuAbierto(false);
    },
    [navigate]
  );

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside
        className={`sidebar ${menuAbierto ? "sidebar--open" : ""} sidebar--overlay`}
        // Inline mínimos para asegurar comportamiento aunque falte CSS nuevo
        style={{
          // Desktop: como estaba (grid). En móvil: off-canvas fijo.
          // Estos inline son "fallbacks"; ideal mover a styles.css con media queries.
          position: "sticky",
          top: 0,
          height: "100svh",
          zIndex: 30,
        }}
        aria-label="Menú principal"
      >
        {/* Bloque superior */}
        <div
          className="sb-top bg-top borde"
          style={{ display: "flex", alignItems: "center", gap: 8 }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "#EAF6FF",
              display: "grid",
              placeItems: "center",
              border: "1px solid var(--borde)",
              flex: "0 0 36px",
            }}
            aria-hidden
          >
            👤
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, lineHeight: 1, whiteSpace: "nowrap" }}>
              {esAdmin ? "Administrador" : "Usuario"}
            </div>
            <div style={{ fontSize: 12, opacity: 0.8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {usuario?.nombre
                ? `${usuario.nombre} ${usuario.apellido || ""}`.trim()
                : usuario?.usuario || ""}
            </div>
          </div>
        </div>

        {/* Menú lateral */}
        <nav className="sb-menu" role="navigation">
          <button type="button" className="sb-item" onClick={() => ir("/panel")}>
            🏠 Inicio
          </button>

          {esAdmin && (
            <>
              <button type="button" className="sb-item" onClick={() => ir("/panel/usuarios")}>
                👥 Usuarios
              </button>
              <button type="button" className="sb-item" onClick={() => ir("/panel/empresas")}>
                🏢 Empresas
              </button>
              <button type="button" className="sb-item" onClick={() => ir("/panel/sindicatos")}>
                ✊ Sindicatos
              </button>
              <button type="button" className="sb-item" onClick={() => ir("/panel/mineras")}>
                ⛏️ Mineras
              </button>
              <button type="button" className="sb-item" onClick={() => ir("/panel/negociaciones")}>
                🤝 Negociaciones
              </button>
              <button type="button" className="sb-item" onClick={() => ir("/panel/monitoreo")}>
                👁️ Monitoreo
              </button>
            </>
          )}

          <button type="button" className="sb-item" onClick={() => ir("/panel/lista")}>
            🗂️ Lista
          </button>
          <button type="button" className="sb-item" onClick={() => ir("/panel/informes")}>
            📊 Reportes
          </button>
        </nav>

        <button className="sb-logout" onClick={onSalir}>
          ↩️ Cerrar sesión
        </button>
      </aside>

      {/* Contenido + Topbar móvil */}
      <main className="contenido">
        {/* Barra superior visible en móviles: botón hamburguesa + título/presentación */}
        <div
          className="topbar"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 8px",
            position: "sticky",
            top: 0,
            zIndex: 20,
            background: "var(--panel-top)",
            borderBottom: "1px solid var(--borde)",
          }}
        >
          <button
            type="button"
            className="btn"
            aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
            onClick={() => setMenuAbierto((v) => !v)}
            style={{ padding: "6px 10px" }}
          >
            {menuAbierto ? "✖" : "☰"}
          </button>
          <div style={{ fontWeight: 600 }}>Panel</div>
          <div style={{ marginLeft: "auto", fontSize: 12, opacity: 0.8 }}>
            {esAdmin ? "Administrador" : "Usuario"}
          </div>
        </div>

        {/* Backdrop móvil */}
        {menuAbierto && (
          <div
            role="button"
            aria-label="Cerrar menú"
            onClick={() => setMenuAbierto(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,.35)",
              zIndex: 20,
            }}
          />
        )}

        <Outlet />
      </main>
    </div>
  );
}
