import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import './Chat.css';

export const Chat = () => {
  const { user } = useAuth();
  const { socket, findMatch, inCall, callPartner, messages, sendMessage, skipUser, endChat, reportUser } = useSocket();
  const [messageText, setMessageText] = useState('');
  const [isMatching, setIsMatching] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFindMatch = () => {
    if (user && socket) {
      setIsMatching(true);
      findMatch({
        userId: user._id,
        username: user.username,
      });

      // Simulate matching timeout
      setTimeout(() => {
        if (!inCall) {
          setIsMatching(false);
        }
      }, 30000); // 30 second timeout
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (messageText.trim() && socket && inCall && callPartner) {
      sendMessage(messageText, callPartner.userId, user.username);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          from: user.username,
          text: messageText,
          timestamp: new Date(),
          isOwn: true,
        },
      ]);
      setMessageText('');
    }
  };

  const handleSkip = () => {
    skipUser(user.username, callPartner?.userId);
    setIsMatching(false);
  };

  const handleEndChat = () => {
    endChat(user.username);
    setIsMatching(false);
  };

  const handleReport = () => {
    if (reportReason && callPartner) {
      reportUser(callPartner.username, reportReason, reportDescription);
      setShowReportModal(false);
      setReportReason('');
      setReportDescription('');
      handleEndChat();
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-layout">
        {/* Remote Video */}
        <div className="video-box remote">
          <div className="video-label">Stranger</div>
          {!inCall ? (
            <div className="video-placeholder">
              <div className="icon">🌐</div>
              <p className="status-text">Ready to meet someone new?</p>
              <button className="find-btn" onClick={handleFindMatch} disabled={isMatching}>
                {isMatching ? 'Finding match...' : 'Find Match'}
              </button>
            </div>
          ) : (
            <div className="video-placeholder">
              <div className="icon">👤</div>
              <p className="username">{callPartner?.username}</p>
            </div>
          )}
        </div>

        {/* Local Video */}
        <div className="video-box local">
          <div className="video-label">You</div>
          <div className="video-placeholder">
            <div className="icon">😊</div>
            <p className="status-text">{user?.username}</p>
          </div>
        </div>

        {/* Chat Panel */}
        <div className="chat-panel">
          <div className="messages">
            {messages.length === 0 ? (
              <div className="empty-state">Connect to start chatting</div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`message ${msg.isOwn ? 'own' : ''}`}>
                  <div className="message-avatar">
                    {msg.from.charAt(0).toUpperCase()}
                  </div>
                  <div className="message-content">
                    <div className="message-from">{msg.from}</div>
                    <div className="message-text">{msg.text}</div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="message-input">
            <input
              type="text"
              placeholder="Type a message..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              disabled={!inCall}
            />
            <button type="submit" disabled={!inCall || !messageText.trim()}>
              Send
            </button>
          </form>
        </div>
      </div>

      {/* Controls */}
      {inCall && (
        <div className="controls">
          <button className="skip-btn" onClick={handleSkip}>
            Skip ⟶
          </button>
          <button className="end-btn" onClick={handleEndChat}>
            End Chat
          </button>
          <button className="report-btn" onClick={() => setShowReportModal(true)}>
            ⚠ Report
          </button>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Report User</h2>
            <p>Help us keep NexChat safe. Why are you reporting this user?</p>

            <div className="form-group">
              <label>Reason</label>
              <select value={reportReason} onChange={(e) => setReportReason(e.target.value)}>
                <option value="">Select a reason...</option>
                <option value="harassment">Harassment</option>
                <option value="inappropriate">Inappropriate Content</option>
                <option value="spam">Spam</option>
                <option value="hate_speech">Hate Speech</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Description (optional)</label>
              <textarea
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="Tell us more about why you're reporting this user..."
                rows="4"
              />
            </div>

            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowReportModal(false)}>
                Cancel
              </button>
              <button
                className="report-submit-btn"
                onClick={handleReport}
                disabled={!reportReason}
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
