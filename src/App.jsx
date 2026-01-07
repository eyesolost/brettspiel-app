// src/App.jsx - Beispiel mit Simple Password Auth
import { AuthProvider, useAuth } from './context/SimpleAuthContext'
import SimpleLogin from './components/Auth/SimpleLogin'
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import GameList from "./components/GameList";
import GameForm from "./components/GameForm";
import BGGImport from "./components/BGGImport";
import DataManager from "./components/DataManager";
import "./styles/App.css";
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

function AppContent() {
  const { isAuthenticated, loading: authLoading, logout } = useAuth()

  // Show loading state while checking authentication
  // Not Authenticated - Show Login
  if (!isAuthenticated) {
    return <SimpleLogin />
  }

  // Authenticated - Show App
  return (
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
  );
}

export default App

{/*src/App.jsx - Beispiel mit Migration Tool
import MigrationTool from './components/Migration/MigrationTool'

function App() {
  return <MigrationTool onComplete={() => {
    // Nach Migration zur normalen App wechseln
  }} />
  
}
export default App*/}