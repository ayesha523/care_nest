import React from "react";
import { useNavigate } from "react-router-dom";
import AuthForm from "../components/AuthForm";
import { signupUser } from "../services/authService";
import { useUser } from "../context/UserContext";

function CompanionSignup() {
  const navigate = useNavigate();
  const { login } = useUser();

  const handleSignup = async ({ name, email, password }) => {
    const response = await signupUser({
      name,
      email,
      password,
      role: "companion",
    });

    if (!response.success) {
      return response;
    }

    const userData = {
      ...(response.data?.user || { email, name, role: "companion" }),
      token: response.data?.token || "",
    };
    login(userData);
    navigate("/companion-landing");
    return { success: true };
  };

  return (
    <AuthForm
      mode="signup"
      welcomeText="Create companion account"
      title="Sign up to get started"
      submitText="Sign Up"
      onSubmit={handleSignup}
      alternateText="Already have an account?"
      alternateLinkText="Login"
      alternateLinkTo="/companion-login"
    />
  );
}

export default CompanionSignup;