import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { GameProvider } from "./context/GameContext";
import Navbar from "./components/Navbar";
import GameList from "./components/GameList";
import GameForm from "./components/GameForm";
import BGGImport from "./components/BGGImport";
import DataManager from "./components/DataManager";
import "./styles/App.css";

function App() {
  return (
    <GameProvider>
      <Router>
        <div className="app">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<GameList />} />
              <Route path="/add" element={<GameForm mode="add" />} />
              <Route path="/edit/:id" element={<GameForm mode="edit" />} />
              <Route path="/bgg-import" element={<BGGImport />} />
              <Route path="/data" element={<DataManager />} />
            </Routes>
          </main>
          <footer className="app-footer">
            <p>
              🎲 Brettspiel-Verwaltungs-App | Made with React | Powered by BGG
              API
            </p>
          </footer>
        </div>
      </Router>
    </GameProvider>
  );
}

export default App;
