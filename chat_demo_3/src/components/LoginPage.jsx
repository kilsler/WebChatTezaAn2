import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/loginStyles.css';
function LoginPage() {
    const API_BASE_URL = 'http://localhost:8080';
    const [username, setUsername] = useState('');
    const navigate = useNavigate();

    const handleLogin = async () => {
        console.log(`Sending login request to ${API_BASE_URL}/api/auth/login`);
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username }),
            });
            console.log('Response status:', response.status);
            const data = await response.json();
            if (data.username) {
                localStorage.setItem('username', data.username);
                navigate('/chat');
            } else {
                console.error('No username in response:', data);
                alert('Login failed. Please try again.');
            }
        } catch (error) {
            console.error('Login request failed:', error);
            alert('Login failed. Please check the console for details.');
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h2 className="login-title">Login</h2>
                <div className="input-group">
                    <label htmlFor="username" className="input-label">Username</label>
                    <input
                        type="text"
                        id="username"
                        className="input-field"
                        placeholder="Enter username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                </div>
                <button className="login-button" onClick={handleLogin}>
                    Login
                </button>
            </div>
        </div>
    );

}

export default LoginPage;