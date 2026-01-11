import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";
import bgImage from "../assets/image.png";


function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();

    if (email === "admin@exemple.com" && password === "1234") {
      navigate("/admin"); 
    } else {
       document.querySelector(".error-message").style.visibility = "visible"; 
      
    }
  };

  return (
    <div
      className="login-container"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="login-overlay"></div>

      <form className="login-box" onSubmit={handleLogin}>
        <h2>Sahara Express</h2>
        <h3>Systéme Logistique</h3>
        <p>Connexion</p>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit">Se connecter</button>
        <div className="error-message" >
          <span >Email ou mot de passe incorrect</span>
      </div>
      </form>
    </div>
  );
}

export default Login;
