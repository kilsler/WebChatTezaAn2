import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import ChatPage from './components/ChatPage';
import './styles/chatStyles.css';
import './App.css'

function App() {
  return (
    <div className="page-container">
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </div>
  );
}

export default App;