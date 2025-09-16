// src/App.js
import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Panel from "./pages/Panel";

import NegociacionesAdmin from "./pages/admin/NegociacionesAdmin";
import ListaNegociaciones from "./pages/admin/ListaNegociaciones";
import EmpresasAdmin from "./pages/admin/EmpresasAdmin";
import UsuariosAdmin from "./pages/admin/UsuariosAdmin";
import MinerasAdmin from "./pages/admin/MinerasAdmin";
import SindicatosAdmin from "./pages/admin/SindicatosAdmin";
import InformesAdmin from "./pages/admin/InformesAdmin";
import MonitoreoAdmin from "./pages/admin/MonitoreoAdmin";

import { NegociacionesProvider } from "./context/NegociacionesContext";

export default function App() {
  // estado local para token y datos básicos del usuario
  const [token, setToken] = useState(null);
  const [usuario, setUsuario] = useState(null);

  // al montar, leo token/usuario desde localStorage para mantener la sesión
  useEffect(() => {
    const t = localStorage.getItem("token_ncc");
    const u = localStorage.getItem("usuario_ncc");
    if (t) setToken(t);
    if (u) setUsuario(JSON.parse(u));
  }, []);

  // callback que se ejecuta al iniciar sesión correctamente
  const onIngreso = (user) => {
    setToken(localStorage.getItem("token_ncc"));
    setUsuario(user || null);
  };

  // cierro sesión limpiando storage y estado
  const onSalir = () => {
    localStorage.removeItem("token_ncc");
    localStorage.removeItem("usuario_ncc");
    setToken(null);
    setUsuario(null);
  };

  return (
    <BrowserRouter>
      {token ? (
        // con sesión activa, muestro el panel y sus rutas internas
        <NegociacionesProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/panel" replace />} />
            {/* Panel funciona como layout para las páginas internas */}
            <Route path="/panel" element={<Panel usuario={usuario} onSalir={onSalir} />}>
              <Route
                index
                element={
                  <div className="tarjeta" style={{ background: "var(--panel-top)" }}>
                    <h1 className="bienvenida" style={{ margin: 0, marginBottom: 8 }}>
                      Bienvenido a Plataforma NCC
                    </h1>
                    <p style={{ margin: 0, marginTop: 6, color: "#333", fontSize: 14 }}>
                      Estás autenticado como{" "}
                      <b>{usuario?.id_rol === 1 ? "Administrador" : "Usuario"}</b>.
                    </p>
                  </div>
                }
              />
              {/* páginas de administración */}
              <Route path="usuarios" element={<UsuariosAdmin />} />
              <Route path="empresas" element={<EmpresasAdmin />} />
              <Route path="mineras" element={<MinerasAdmin />} />
              <Route path="sindicatos" element={<SindicatosAdmin />} />
              <Route path="negociaciones" element={<NegociacionesAdmin />} />
              <Route path="lista" element={<ListaNegociaciones />} />
              <Route path="informes" element={<InformesAdmin />} />
              <Route path="monitoreo" element={<MonitoreoAdmin />} />
            </Route>
            <Route path="*" element={<Navigate to="/panel" replace />} />
          </Routes>
        </NegociacionesProvider>
      ) : (
        // sin sesión, solo muestro el login
        <Routes>
          <Route path="/" element={<Login onIngresoGlobal={onIngreso} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}
    </BrowserRouter>
  );
}

