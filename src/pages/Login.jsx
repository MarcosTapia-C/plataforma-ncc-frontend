import FormularioLogin from "../components/FormularioLogin";
import "../styles/login.css";

export default function Login({ onIngresoGlobal }) {
  const manejarIngresoExitoso = (usuario) => {
    onIngresoGlobal?.(usuario); // se notifica al componente principal
  };

  return (
    <main className="centro">
      <section className="tarjeta">
        <FormularioLogin onIngresar={manejarIngresoExitoso} />
      </section>
    </main>
  );
}

