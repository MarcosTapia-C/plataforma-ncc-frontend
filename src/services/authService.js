import { API_URL } from "./config";

export async function loginServicio({ identificador, contrasena, correo }) {
  // Soporta llamado antiguo con 'correo'
  const id = (typeof identificador === "string" && identificador.trim())
    ? identificador
    : (correo || "");

  const payload = {
    identificador: id,     // usuario o correo
    password: contrasena,  // el backend compara con bcrypt
  };

  const resp = await fetch(`${API_URL}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const contentType = resp.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const texto = await resp.text();
    console.warn("Respuesta no JSON:", texto.slice(0, 200));
    throw new Error("La API no devolvió JSON. Revisa API_URL/puerto.");
  }

  const data = await resp.json();

  if (!resp.ok || data?.ok !== true) {
    throw new Error(data?.mensaje || "Credenciales inválidas");
  }

  // Guardar token y usuario para decidir la vista por rol
  if (data.token) localStorage.setItem("token_ncc", data.token);
  if (data.usuario) localStorage.setItem("usuario_ncc", JSON.stringify(data.usuario));

  return data; // { ok, token, usuario }
}


