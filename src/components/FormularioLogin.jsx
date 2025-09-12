import { useState } from "react";
import "../styles/login.css";
import { loginServicio } from "../services/authService";

export default function FormularioLogin({ onIngresar }) {
  const [identificador, setIdentificador] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const manejarSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!identificador.trim() || !contrasena.trim()) {
      setError("Por favor, complete ambos campos.");
      return;
    }

    try {
      setCargando(true);
      const data = await loginServicio({ identificador, contrasena });
      // Avisamos al padre que ingresó (y ya guardamos token en localStorage)
      onIngresar?.(data.usuario || { identificador });
    } catch (err) {
      setError(err.message || "No se pudo iniciar sesión.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <form onSubmit={manejarSubmit} noValidate>
      <h1 className="titulo">Iniciar sesión</h1>

      <div className="campo">
        <label className="etiqueta" htmlFor="identificador">Usuario</label>
        <input
          id="identificador"
          className="input"
          type="text"
          placeholder="Usuario"
          value={identificador}
          onChange={(e) => setIdentificador(e.target.value)}
          autoComplete="username"
        />
      </div>

      <div className="campo">
        <label className="etiqueta" htmlFor="contrasena">Contraseña</label>
        <input
          id="contrasena"
          className="input"
          type="password"
          placeholder="********"
          value={contrasena}
          onChange={(e) => setContrasena(e.target.value)}
          autoComplete="current-password"
        />
        {error && <p className="error">{error}</p>}
      </div>

      <button className="boton" type="submit" disabled={cargando}>
        {cargando ? "Ingresando..." : "Ingresar"}
      </button>
    </form>
  );
}

