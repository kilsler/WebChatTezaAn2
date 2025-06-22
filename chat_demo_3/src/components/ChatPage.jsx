import { useState, useEffect } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

function ChatPage() {
    const API_BASE_URL = 'http://localhost:8080';
    const username = localStorage.getItem('username');
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messagesByUser, setMessagesByUser] = useState({});
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
                const formattedUsers = Array.isArray(data)
                    ? data.map((item) => {
                        if (typeof item === 'string') {
                            return { id: item, username: item };
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
                    // Добавляем только сообщения от других пользователей
                    if (Number(message.senderId) !== Number(userId)) {
                        const recipientId =
                            Number(message.senderId) === Number(userId)
                                ? Number(message.recipientId)
                                : Number(message.senderId);
                        setMessagesByUser((prev) => ({
                            ...prev,
                            [recipientId]: [...(prev[recipientId] || []), message],
                        }));
                    } else {
                        console.log('Skipped own message:', message);
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
    }, [userId]);

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
            // Добавляем собственное сообщение локально
            setMessagesByUser((prev) => ({
                ...prev,
                [selectedUser.id]: [...(prev[selectedUser.id] || []), msg],
            }));
            setMessage('');
        } else {
            console.warn('Cannot send message: missing', { stompClient, message, selectedUser, userId });
        }
    };

    const currentMessages = selectedUser ? messagesByUser[selectedUser.id] || [] : [];

    console.log('Rendering ChatPage with users:', users, 'selectedUser:', selectedUser, 'currentMessages:', currentMessages);

    return (
        <div className="chat-container">
            <div className="container-fluid h-100">
                <div className="row h-100">
                    <div className="col-3 bg-light border-end p-0">
                        <h4 className="p-3 mb-0 bg-primary text-white">Users</h4>
                        <div className="list-group list-group-flush">
                            {users.length === 0 ? (
                                <div className="list-group-item">No users available</div>
                            ) : (
                                users.map((user) => (
                                    <button
                                        key={user.id}
                                        type="button"
                                        className={`list-group-item list-group-item-action ${selectedUser?.id === user.id ? 'active' : ''}`}
                                        onClick={() => {
                                            console.log('Selected user:', user);
                                            setSelectedUser(user);
                                        }}
                                    >
                                        {user.username}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                    <div className="col-9 p-0 d-flex flex-column">
                        {selectedUser ? (
                            <>
                                <h4 className="p-3 mb-0 bg-primary text-white">Chat with {selectedUser.username}</h4>
                                <div className="messages p-3 d-flex flex-column">
                                    {currentMessages.length === 0 ? (
                                        <p className="text-muted">No messages yet</p>
                                    ) : (
                                        currentMessages.map((msg, index) => (
                                            <div
                                                key={index}
                                                className={Number(msg.senderId) === Number(userId) ? 'message-right' : 'message-left'}
                                            >
                                                <p className="mb-1">{msg.content}</p>
                                                <small className="text-muted">{new Date(msg.timestamp).toLocaleTimeString()}</small>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <div className="p-3 mt-auto">
                                    <div className="input-group">
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Type a message..."
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                        />
                                        <button className="btn btn-primary" onClick={sendMessage}>
                                            Send
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="d-flex justify-content-center align-items-center h-100">
                                <p className="text-muted">Select a user to start chatting</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ChatPage;