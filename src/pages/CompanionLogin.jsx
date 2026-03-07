import React from "react";
import { useNavigate } from "react-router-dom";
import AuthForm from "../components/AuthForm";
import { loginUser } from "../services/authService";
import { useUser } from "../context/UserContext";

function CompanionLogin() {
  const navigate = useNavigate();
  const { login } = useUser();

  const handleLogin = async ({ email, password }) => {
    const response = await loginUser({ email, password, role: "companion" });

    if (!response.success) {
      return response;
    }

    const userData = {
      ...(response.data?.user || { email, role: "companion" }),
      token: response.data?.token || "",
    };
    login(userData);
    navigate("/companion-landing");
    return { success: true };
  };

  return (
    <AuthForm
      mode="login"
      welcomeText="Welcome companion"
      title="Login to your account"
      submitText="Login"
      onSubmit={handleLogin}
      alternateText="Don't have an account?"
      alternateLinkText="Sign up"
      alternateLinkTo="/companion-signup"
    />
  );
}

export default CompanionLogin;
