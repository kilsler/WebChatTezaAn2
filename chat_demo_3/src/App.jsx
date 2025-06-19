import { useState } from 'react';
import LoginPage from './components/LoginPage.jsx';
import ChatPage from './components/ChatPage.jsx';

function App() {
  const [username, setUsername] = useState(null);

  return username ? (
    <ChatPage username={username} />
  ) : (
    <LoginPage onLogin={setUsername} />
  );
}

export default App;
