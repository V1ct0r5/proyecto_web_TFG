import React from "react";
import LoginForm from "../components/auth/LoginForm";
import { Link } from "react-router-dom";

function LoginPage() {
  return (
    <div className="login">
      <h1>Iniciar Sesion</h1>
      <LoginForm />
      <p>
      ¿No tienes una cuenta? <Link to="/register">Registrate</Link>
    </p>
    </div>
  );
}

export default LoginPage;