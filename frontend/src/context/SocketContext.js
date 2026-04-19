import React, { createContext, useEffect, useState, useCallback } from 'react';
import io from 'socket.io-client';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [inCall, setInCall] = useState(false);
  const [callPartner, setCallPartner] = useState(null);
  const [messages, setMessages] = useState([]);

  const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      console.log('Connected to server');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnected(false);
    });

    newSocket.on('matching:matched', (data) => {
      setInCall(true);
      setCallPartner(data.pairedUser);
    });

    newSocket.on('chat:message', (data) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          from: data.username,
          text: data.text,
          timestamp: data.timestamp,
        },
      ]);
    });

    newSocket.on('matching:user-skipped', () => {
      setInCall(false);
      setCallPartner(null);
      setMessages([]);
    });

    newSocket.on('chat:ended', () => {
      setInCall(false);
      setCallPartner(null);
      setMessages([]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [SOCKET_URL]);

  const joinUser = useCallback((userData) => {
    if (socket) {
      socket.emit('user:join', userData);
    }
  }, [socket]);

  const findMatch = useCallback((userData) => {
    if (socket) {
      socket.emit('matching:start', userData);
    }
  }, [socket]);

  const sendMessage = useCallback((text, to, username) => {
    if (socket) {
      socket.emit('chat:message', {
        text,
        to,
        username,
      });
    }
  }, [socket]);

  const skipUser = useCallback((username, otherUserSocketId) => {
    if (socket) {
      socket.emit('matching:skip', {
        username,
        otherUserSocketId,
      });
    }
  }, [socket]);

  const endChat = useCallback((username) => {
    if (socket) {
      socket.emit('chat:end', { username });
      setInCall(false);
      setCallPartner(null);
      setMessages([]);
    }
  }, [socket]);

  const reportUser = useCallback((reportedUsername, reason, description) => {
    if (socket) {
      socket.emit('user:report', {
        reportedUsername,
        reason,
        description,
      });
    }
  }, [socket]);

  // WebRTC Signaling methods
  const sendOffer = useCallback((to, offer) => {
    if (socket) {
      socket.emit('webrtc:offer', { to, offer });
    }
  }, [socket]);

  const sendAnswer = useCallback((to, answer) => {
    if (socket) {
      socket.emit('webrtc:answer', { to, answer });
    }
  }, [socket]);

  const sendIceCandidate = useCallback((to, candidate) => {
    if (socket) {
      socket.emit('webrtc:ice-candidate', { to, candidate });
    }
  }, [socket]);

  const value = {
    socket,
    connected,
    inCall,
    callPartner,
    messages,
    joinUser,
    findMatch,
    sendMessage,
    skipUser,
    endChat,
    reportUser,
    sendOffer,
    sendAnswer,
    sendIceCandidate,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = () => {
  const context = React.useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
