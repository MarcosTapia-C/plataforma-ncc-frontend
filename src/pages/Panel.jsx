// src/pages/Panel.jsx
import React from "react";
import { Outlet, useNavigate } from "react-router-dom";

export default function Panel({ usuario, onSalir }) {
  const navigate = useNavigate();
  const esAdmin = usuario?.id_rol === 1;
  
  return (
    <div className="layout">
      {/* Menú lateral */}
      <aside className="sidebar">
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
            }}
            aria-hidden
          >
            👤
          </div>
          <div>
            <div style={{ fontWeight: 700, lineHeight: 1 }}>
              {esAdmin ? "Administrador" : "Usuario"}
            </div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>
              {usuario?.nombre
                ? `${usuario.nombre} ${usuario.apellido || ""}`.trim()
                : usuario?.usuario || ""}
            </div>
          </div>
        </div>
        
        {/* Menú lateral */}
        <nav className="sb-menu">
          <button type="button" className="sb-item" onClick={() => navigate("/panel")}>
            🏠 Inicio
          </button>
          {esAdmin && (
            <>
              <button
                type="button"
                className="sb-item"
                onClick={() => navigate("/panel/usuarios")}
              >
                👥 Usuarios
              </button>
              <button
                type="button"
                className="sb-item"
                onClick={() => navigate("/panel/empresas")}
              >
                🏢 Empresas
              </button>
              <button
                type="button"
                className="sb-item"
                onClick={() => navigate("/panel/sindicatos")}
              >
                ✊ Sindicatos
              </button>
              <button
                type="button"
                className="sb-item"
                onClick={() => navigate("/panel/mineras")}
              >
                ⛏️ Mineras
              </button>
              <button
                type="button"
                className="sb-item"
                onClick={() => navigate("/panel/negociaciones")}
              >
                🤝 Negociaciones
              </button>
              <button
                type="button"
                className="sb-item"
                onClick={() => navigate("/panel/monitoreo")}
              >
                👁️ Monitoreo
              </button>
            </>
          )}
          <button
            type="button"
            className="sb-item"
            onClick={() => navigate("/panel/lista")}
          >
            🗂️ Lista
          </button>
          <button
            type="button"
            className="sb-item"
            onClick={() => navigate("/panel/informes")}
          >
            📊 Reportes
          </button>
        </nav>
        <button className="sb-logout" onClick={onSalir}>
          ↩️ Cerrar sesión
        </button>
      </aside>
      
      {/* Contenido principal */}
      <main className="contenido">
        <Outlet />
      </main>
    </div>
  );
}

