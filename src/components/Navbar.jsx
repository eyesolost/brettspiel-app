import React from "react";
import { Link, useLocation } from "react-router-dom";
import { FaDice, FaList, FaPlus, FaDownload, FaDatabase } from "react-icons/fa";
import "../styles/Navbar.css";
import { FaFloppyDisk } from "react-icons/fa6";

const Navbar = () => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? "active" : "";
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <FaDice className="logo-icon" />
          <span>Brettspiel-Sammlung</span>
        </Link>

        <ul className="nav-menu">
          <li className="nav-item">
            <Link to="/" className={`nav-link ${isActive("/")}`}>
              <FaList className="nav-icon" />
              <span>Alle Spiele</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/add" className={`nav-link ${isActive("/add")}`}>
              <FaPlus className="nav-icon" />
              <span>Neues Spiel</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link
              to="/bgg-import"
              className={`nav-link ${isActive("/bgg-import")}`}
            >
              <FaDownload className="nav-icon" />
              <span>BGG Import</span>
            </Link>
          </li>
           <li className="nav-item">
            <Link
              to="/data"
              className={`nav-link ${isActive("/data")}`}
            >
              <FaFloppyDisk className="nav-icon" /> 
              <span>Daten</span>
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
