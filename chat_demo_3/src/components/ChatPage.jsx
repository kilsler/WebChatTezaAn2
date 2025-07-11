import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import '../styles/chatStyles.css';

function ChatPage() {
    const API_BASE_URL = 'http://localhost:8080';
    const username = localStorage.getItem('username');
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messagesByUser, setMessagesByUser] = useState({});
    const [unreadMessages, setUnreadMessages] = useState(new Set());
    const [message, setMessage] = useState('');
    const [stompClient, setStompClient] = useState(null);
    const [userId, setUserId] = useState(null);
    const navigate = useNavigate();
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        // Fetch current user ID
        fetch(`${API_BASE_URL}/api/auth/current?username=${username}`)
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
        fetch(`${API_BASE_URL}/api/users?currentUsername=${username}`)
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
                    if (Number(message.senderId) !== Number(userId)) {
                        const recipientId =
                            Number(message.senderId) === Number(userId)
                                ? Number(message.recipientId)
                                : Number(message.senderId);
                        setMessagesByUser((prev) => ({
                            ...prev,
                            [recipientId]: [...(prev[recipientId] || []), message],
                        }));
                        // Добавляем пользователя в unreadMessages, если он не выбран
                        if (selectedUser?.id !== recipientId) {
                            setUnreadMessages((prev) => new Set([...prev, recipientId]));
                        }
                        scrollToBottom();
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
    }, [userId, username, selectedUser]);

    // Загрузка сообщений при выборе пользователя
    useEffect(() => {
        if (userId && selectedUser) {
            console.log(`Fetching messages for userId: ${userId} and recipientId: ${selectedUser.id}`);
            fetch(`${API_BASE_URL}/api/messages?userId=${userId}&recipientId=${selectedUser.id}`)
                .then((res) => {
                    console.log('Messages response status:', res.status);
                    if (!res.ok) throw new Error('Failed to fetch messages');
                    return res.json();
                })
                .then((data) => {
                    console.log('Fetched messages:', data);
                    setMessagesByUser((prev) => ({
                        ...prev,
                        [selectedUser.id]: data,
                    }));
                    // Сбрасываем unreadMessages для выбранного пользователя
                    setUnreadMessages((prev) => {
                        const newSet = new Set(prev);
                        newSet.delete(selectedUser.id);
                        console.log('Removed from unreadMessages:', selectedUser.id);
                        return newSet;
                    });
                })
                .catch((error) => console.error('Error fetching messages:', error));
        }
    }, [selectedUser, userId]);

    // Автоскролл после обновления сообщений
    const currentMessages = selectedUser ? messagesByUser[selectedUser.id] || [] : [];
    useEffect(() => {
        scrollToBottom();
    }, [currentMessages]);

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
            setMessagesByUser((prev) => ({
                ...prev,
                [selectedUser.id]: [...(prev[selectedUser.id] || []), msg],
            }));
            setMessage('');
            scrollToBottom();
        } else {
            console.warn('Cannot send message: missing', { stompClient, message, selectedUser, userId });
        }
    };

    const handleLogout = () => {
        console.log('Logging out user:', username);
        localStorage.removeItem('username');
        navigate('/login');
    };

    const handleSelectUser = (user) => {
        console.log('Selected user:', user);
        setSelectedUser(user);
        // Сбрасываем unreadMessages для выбранного пользователя
        setUnreadMessages((prev) => {
            const newSet = new Set(prev);
            newSet.delete(user.id);
            console.log('Removed from unreadMessages:', user.id);
            return newSet;
        });
    };

    if (!username) {
        console.error('No username found in localStorage');
        navigate('/login');
        return null; // Prevent rendering if no username
    }

    return (
        <div className="chat-container">
            <div className="chat-layout">
                <div className="user-list">
                    <div className="user-list-header">
                        <h4>Welcome {username}</h4>
                        <button className="logout-button" onClick={handleLogout}>
                            Logout
                        </button>
                    </div>
                    <div className="user-list-content">
                        {users.length === 0 ? (
                            <div className="user-list-item">No users available</div>
                        ) : (
                            users.map((user) => (
                                <button
                                    key={user.id}
                                    type="button"
                                    className={`user-list-item ${selectedUser?.id === user.id ? 'active' : ''} ${unreadMessages.has(user.id) ? 'bold' : ''}`}
                                    onClick={() => handleSelectUser(user)}
                                >
                                    {user.username}
                                    {unreadMessages.has(user.id) && (
                                        <span className="badge">New</span>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>
                <div className="chat-panel">
                    {selectedUser ? (
                        <>
                            <h4 className="chat-header">Chat with {selectedUser.username}</h4>
                            <div className="messages">
                                {currentMessages.length === 0 ? (
                                    <p className="no-messages">No messages yet</p>
                                ) : (
                                    currentMessages.map((msg, index) => (
                                        <div
                                            key={index}
                                            className={Number(msg.senderId) === Number(userId) ? 'message-right' : 'message-left'}
                                        >
                                            <p className="message-content">{msg.content}</p>
                                            <small className="message-time">{new Date(msg.timestamp).toLocaleTimeString()}</small>
                                        </div>
                                    ))
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                            <div className="input-area">
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Type a message..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            sendMessage();
                                        }
                                    }}
                                />
                                <button className="send-button" onClick={sendMessage}>
                                    Send
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="no-user-selected">
                            <p>Select a user to start chatting</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
export default ChatPage;