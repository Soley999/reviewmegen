import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function Navbar() {
  const { isLoggedIn, user, logout } = useAuth();

  return (
    <nav className="nav">
      <Link className="nav-brand" to="/">
        Reviewer Generator
      </Link>
      <div className="nav-links">
        <Link className="nav-pill" to="/upload">
          Upload
        </Link>
        <Link className="nav-pill" to="/dashboard">
          Dashboard
        </Link>
        {isLoggedIn ? (
          <button className="nav-pill" onClick={logout} type="button">
            Logout {user?.name ? `(${user.name})` : ""}
          </button>
        ) : (
          <Link className="nav-pill" to="/login">
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
