// src/services/api.js
import axios from "axios";
import { API_URL } from "./config";

// creo una instancia de axios apuntando al backend
const api = axios.create({
  baseURL: `${API_URL}/api`,
});

// antes de cada request, agrego el token si lo tengo en localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token_ncc");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// manejo de respuestas: si el backend devuelve 401, cierro sesión y redirijo; en otros casos, solo informo en consola
api.interceptors.response.use(
  (r) => r,
  (err) => {
    const status = err?.response?.status;
    const data = err?.response?.data;
    if (status === 401) {
      alert("Sesión expirada o no autorizada. Vuelve a iniciar sesión.");
      localStorage.removeItem("token_ncc");
      localStorage.removeItem("usuario_ncc");
      window.location.href = "/";
    } else {
      const msg =
        data?.mensaje ||
        (Array.isArray(data?.errores) && data.errores[0]?.msg) ||
        data?.error ||
        "Error de API.";
      // no detengo el flujo de la app; solo dejo el aviso
      console.warn("[API]", msg);
    }
    return Promise.reject(err);
  }
);

export default api;
