import React from "react";
import LoginForm from "../components/auth/LoginForm";

function LoginPage() {
  return (
    <div className="login">
      <h1>Iniciar Sesion</h1>
      <LoginForm />
    </div>
  );
}

export default LoginPage;