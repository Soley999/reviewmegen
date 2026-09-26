import { Link } from "react-router-dom";

function Navbar() {
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
      </div>
    </nav>
  );
}

export default Navbar;
