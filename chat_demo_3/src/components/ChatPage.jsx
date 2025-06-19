import { useState, useEffect } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

function ChatPage({ username }) {
    const API_BASE_URL = 'http://localhost:8080';
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const [stompClient, setStompClient] = useState(null);
    const [userId, setUserId] = useState(null);

    useEffect(() => {
        // Fetch current user ID
        console.log(`Fetching current user ID from ${API_BASE_URL}/api/auth/current`);
        fetch(`${API_BASE_URL}/api/auth/current`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        })
            .then((res) => {
                console.log('Current user response status:', res.status);
                if (!res.ok) throw new Error('Failed to fetch current user');
                return res.json();
            })
            .then((data) => {
                console.log('Current user data:', data);
                setUserId(data.id);
            })
            .catch((error) => console.error('Error fetching user ID:', error));

        // Fetch users
        console.log(`Fetching users from ${API_BASE_URL}/api/users`);
        fetch(`${API_BASE_URL}/api/users`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        })
            .then((res) => {
                console.log('Users response status:', res.status);
                if (!res.ok) throw new Error('Failed to fetch users');
                return res.json();
            })
            .then((data) => {
                console.log('Raw users data:', data);
                // Временная обработка строкового формата
                const formattedUsers = Array.isArray(data)
                    ? data.map((item, index) => {
                        if (typeof item === 'string') {
                            return { id: index + 1, username: item }; // Фиктивный ID
                        }
                        return item;
                    })
                    : [];
                console.log('Formatted users:', formattedUsers);
                setUsers(formattedUsers);
            })
            .catch((error) => console.error('Error fetching users:', error));

        // Setup WebSocket
        console.log(`Connecting to WebSocket at ${API_BASE_URL}/chat`);
        const socket = new SockJS(`${API_BASE_URL}/chat`);
        const client = new Client({
            webSocketFactory: () => socket,
            reconnectDelay: 5000,
            onConnect: () => {
                console.log('WebSocket connected');
                client.subscribe('/topic/messages', (msg) => {
                    const message = JSON.parse(msg.body);
                    console.log('Received message:', message);
                    if (
                        (Number(message.senderId) === Number(userId) && Number(message.recipientId) === Number(selectedUser?.id)) ||
                        (Number(message.senderId) === Number(selectedUser?.id) && Number(message.recipientId) === Number(userId))
                    ) {
                        setMessages((prev) => [...prev, message]);
                    }
                });
            },
            onStompError: (frame) => {
                console.error('WebSocket error:', frame);
            },
            onWebSocketError: (error) => {
                console.error('WebSocket connection error:', error);
            },
        });
        client.activate();
        setStompClient(client);

        return () => {
            console.log('Disconnecting WebSocket');
            client.deactivate();
        };
    }, [userId, selectedUser]);

    const sendMessage = () => {
        if (stompClient && message && selectedUser && userId) {
            const msg = {
                senderId: userId,
                recipientId: selectedUser.id,
                content: message,
                timestamp: new Date().toISOString(),
            };
            console.log('Sending message:', msg);
            stompClient.publish({
                destination: '/app/sendMessage',
                body: JSON.stringify(msg),
            });
            setMessages((prev) => [...prev, msg]);
            setMessage('');
        } else {
            console.warn('Cannot send message: missing', { stompClient, message, selectedUser, userId });
        }
    };

    console.log('Rendering ChatPage with users:', users, 'selectedUser:', selectedUser);

    return (
        <div className="chat-container">
            <div className="user-panel">
                <h2>Users</h2>
                {users.length === 0 ? (
                    <p>No users available</p>
                ) : (
                    users.map((user) => (
                        <div
                            key={user.id}
                            className={`user-item ${selectedUser?.id === user.id ? 'selected' : ''}`}
                            onClick={() => {
                                console.log('Selected user:', user);
                                setSelectedUser(user);
                            }}
                        >
                            {user.username}
                        </div>
                    ))
                )}
            </div>
            <div className="chat-panel">
                {selectedUser ? (
                    <>
                        <h2>Chat with {selectedUser.username}</h2>
                        <div className="messages">
                            {messages.length === 0 ? (
                                <p>No messages yet</p>
                            ) : (
                                messages.map((msg, index) => (
                                    <div
                                        key={index}
                                        className={Number(msg.senderId) === Number(userId) ? 'message-right' : 'message-left'}
                                    >
                                        <p>{msg.content}</p>
                                        <small>{new Date(msg.timestamp).toLocaleTimeString()}</small>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="message-input">
                            <input
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Type a message..."
                            />
                            <button onClick={sendMessage}>Send</button>
                        </div>
                    </>
                ) : (
                    <p>Select a user to start chatting</p>
                )}
            </div>
        </div>
    );
}

export default ChatPage;