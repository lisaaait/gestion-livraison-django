import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { message } from "antd"; // Importation pour les notifications
import "../styles/login.css";
import bgImage from "../assets/image.png";
import AuthService from "../services/AuthService";

function Login() {
  const [isRegistering, setIsRegistering] = useState(false); // Switch entre login et register
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState(""); // Requis par Django pour register
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const errorEl = document.querySelector(".error-message");
    if (errorEl) errorEl.style.visibility = "hidden";

    try {
      if (isRegistering) {
        // --- LOGIQUE INSCRIPTION ---
        await AuthService.register({
          username: username,
          email: email,
          password: password,
        });
        message.success("Compte créé avec succès !");
        setIsRegistering(false); // On repasse au login après création
      } else {
        // --- LOGIQUE CONNEXION ---
        // On utilise l'email ou le username selon ton backend
        await AuthService.login(email || username, password);
        message.success("Connexion réussie");
        navigate("/admin");
      }
    } catch (error) {
      console.error(error);
      if (errorEl) errorEl.style.visibility = "visible";
      message.error(error.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container" style={{ backgroundImage: `url(${bgImage})` }}>
      <div className="login-overlay"></div>

      <form className="login-box" onSubmit={handleSubmit}>
        <h2>Sahara Express</h2>
        <h3>Système Logistique</h3>
        <p>{isRegistering ? "Créer un compte" : "Connexion"}</p>

        {/* Champ Username requis pour l'inscription Django */}
        {isRegistering && (
          <input
            type="text"
            placeholder="Nom d'utilisateur"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        )}

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

        <button type="submit" disabled={loading}>
          {loading ? "Chargement..." : isRegistering ? "S'inscrire" : "Se connecter"}
        </button>

        <div className="auth-switch" style={{ marginTop: "15px", color: "white", cursor: "pointer" }}>
          <span onClick={() => setIsRegistering(!isRegistering)}>
            {isRegistering 
              ? "Déjà un compte ? Connectez-vous" 
              : "Pas de compte ? Créez-en un ici"}
          </span>
        </div>

        <div className="error-message">
          <span>Identifiants ou données incorrects</span>
        </div>
      </form>
    </div>
  );
}

export default Login;