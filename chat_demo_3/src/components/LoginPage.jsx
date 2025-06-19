import { useState } from 'react';

function LoginPage({ onLogin }) {
    const API_BASE_URL = 'http://localhost:8080';
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async () => {
        console.log(`Sending login request to ${API_BASE_URL}/api/auth/login`);
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            console.log('Response status:', response.status);
            const data = await response.json();
            if (data.token) {
                localStorage.setItem('token', data.token);
                onLogin(username);
            } else {
                console.error('No token in response:', data);
                alert('Login failed. Please try again.');
            }
        } catch (error) {
            console.error('Login request failed:', error);
            alert('Login failed. Please check the console for details.');
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h2>Login</h2>
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button onClick={handleLogin}>Login</button>
            </div>
        </div>
    );
}

export default LoginPage;