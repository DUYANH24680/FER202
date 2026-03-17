import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

const SupportChatWidget = ({ auth }) => {
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]); // For Staff/Admin
  const [activeUser, setActiveUser] = useState(null); // Selected user ID for Staff/Admin
  const [unreadCount, setUnreadCount] = useState(0);
  
  const messagesEndRef = useRef(null);
  
  const isStaff = auth?.role === 'admin' || auth?.role === 'staff';

  // Fetch messages
  const fetchMessages = async () => {
    try {
      const res = await axios.get("http://localhost:9999/messages");
      const allMsgs = res.data;

      if (!isStaff) {
        // User view
        const myMsgs = allMsgs.filter(m => m.conversationId === String(auth.id));
        setMessages(myMsgs);
        if (!showChat) {
          const unread = myMsgs.filter(m => m.senderId !== String(auth.id) && !m.read).length;
          setUnreadCount(unread);
        } else {
          setUnreadCount(0);
        }
      } else {
        // Staff view
        // 1. Get unique users that have sent messages
        const userConversations = {};
        allMsgs.forEach(m => {
          if (m.conversationId && m.conversationId !== 'support') {
            if (!userConversations[m.conversationId]) {
              userConversations[m.conversationId] = {
                id: m.conversationId,
                name: m.conversationId, // We might need to fetch the real name if we want
                lastMessage: m,
                unread: 0
              };
            } else {
              if (new Date(m.timestamp) > new Date(userConversations[m.conversationId].lastMessage.timestamp)) {
                userConversations[m.conversationId].lastMessage = m;
              }
            }
            if (m.senderId === m.conversationId && !m.read) {
              userConversations[m.conversationId].unread += 1;
            }
          }
        });
        
        const convList = Object.values(userConversations).sort((a,b) => new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp));
        setConversations(convList);
        
        if (!showChat) {
          const totalUnread = convList.reduce((acc, conv) => acc + conv.unread, 0);
          setUnreadCount(totalUnread);
        } else {
          if (!activeUser) {
             setUnreadCount(0);
          }
        }

        if (activeUser) {
          const activeMsgs = allMsgs.filter(m => m.conversationId === activeUser);
          setMessages(activeMsgs);
        }
      }
    } catch (err) {
      console.error("Failed to fetch messages", err);
    }
  };

  useEffect(() => {
    if (!auth) return;
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [auth, activeUser, showChat]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, showChat, activeUser]);

  const markAsRead = async (msgsToMark) => {
    try {
      await Promise.all(msgsToMark.map(m => 
        axios.patch(`http://localhost:9999/messages/${m.id}`, { read: true })
      ));
    } catch(err) {
      console.error(err);
    }
  };

  const handleOpenChat = async () => {
    const isOpening = !showChat;
    setShowChat(isOpening);
    setUnreadCount(0);
    
    // Mark messages as read if opened
    if (isOpening) {
      if (!isStaff) {
        if (messages.length === 0) {
          const initialMsg = {
            senderId: "system",
            senderName: "Staff/Admin",
            receiverId: String(auth.id),
            conversationId: String(auth.id),
            text: "Xin chào! Thư viện chúng tôi có thể giúp gì cho bạn?",
            timestamp: new Date().toISOString(),
            read: true,
            isSystem: true
          };
          // Optimistic UI update
          setMessages([initialMsg]);
          try {
            await axios.post("http://localhost:9999/messages", initialMsg);
          } catch(err) {
            console.error(err);
          }
        }
        const unread = messages.filter(m => m.senderId !== String(auth.id) && !m.read);
        if (unread.length > 0) markAsRead(unread);
      } else if (activeUser) {
         const unread = messages.filter(m => m.senderId === activeUser && !m.read);
         if (unread.length > 0) markAsRead(unread);
      }
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const newMsg = {
      senderId: String(auth.id),
      senderName: isStaff ? "Staff/Admin" : auth.username,
      senderAvatar: auth.avatar || null,
      receiverId: isStaff ? activeUser : "support",
      conversationId: isStaff ? activeUser : String(auth.id),
      text: chatInput.trim(),
      timestamp: new Date().toISOString(),
      read: false
    };

    setChatInput("");
    
    // Add optimistic UI
    setMessages(prev => [...prev, newMsg]);

    try {
      await axios.post("http://localhost:9999/messages", newMsg);
      fetchMessages();

      // Mock auto-reply for users (only once per conversation)
      if (!isStaff) {
        const hasReceivedAck = messages.some(m => m.isSystem && m.text.includes("Hệ thống đã ghi nhận"));
        if (!hasReceivedAck) {
          setTimeout(async () => {
            const autoReplyMsg = {
              senderId: "system",
              senderName: "Staff/Admin",
              receiverId: String(auth.id),
              conversationId: String(auth.id),
              text: "Hệ thống đã ghi nhận tin nhắn của bạn. Nhân viên hỗ trợ sẽ phản hồi trong thời gian sớm nhất. Xin cảm ơn!",
              timestamp: new Date().toISOString(),
              read: false,
              isSystem: true
            };
            try {
              await axios.post("http://localhost:9999/messages", autoReplyMsg);
              fetchMessages();
            } catch(e) {
              console.error(e);
            }
          }, 1000);
        }
      }
    } catch(err) {
      console.error("Failed to send message", err);
    }
  };

  if (!auth) return null;

  return (
    <>
      {/* Chat Window */}
      {showChat && (
        <div style={{
          position: "fixed",
          bottom: "80px",
          right: "24px",
          width: "400px",
          height: "550px",
          background: "white",
          borderRadius: "12px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        }}>
          {/* Header */}
          <div style={{
            background: "#06b6d4",
            padding: "16px",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {isStaff && activeUser ? (
                 <button 
                   onClick={() => setActiveUser(null)}
                   style={{ background: "transparent", border: "none", color: "white", cursor: "pointer", fontSize: "16px", padding: 0 }}
                 >
                   ←
                 </button>
              ) : null}
              <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "white", color: "#06b6d4", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>S</div>
              <div>
                <h4 style={{ margin: 0, fontSize: "15px", fontWeight: "600" }}>
                  {!isStaff ? "Library Support" : (activeUser ? `Chat w/ User #${activeUser}` : "Support Inbox")}
                </h4>
                <p style={{ margin: 0, fontSize: "12px", opacity: 0.9 }}>
                  {!isStaff ? "Usually replies instantly" : (activeUser ? "Active Conversation" : "Select a user to reply")}
                </p>
              </div>
            </div>
            <button onClick={handleOpenChat} style={{ background: "none", border: "none", color: "white", cursor: "pointer", fontSize: "20px" }}>×</button>
          </div>

          {/* Body */}
          <div style={{
            flex: 1,
            padding: "16px",
            overflowY: "auto",
            background: "#f8fafc",
            display: "flex",
            flexDirection: "column",
            gap: "12px"
          }}>
            {isStaff && !activeUser ? (
              // INBOX VIEW FOR STAFF
              conversations.length === 0 ? (
                <div style={{ textAlign: "center", color: "#94a3b8", marginTop: "20px", fontSize: "13px" }}>No active conversations</div>
              ) : (
                conversations.map(conv => (
                  <div 
                    key={conv.id} 
                    onClick={() => {
                      setActiveUser(conv.id);
                      fetchMessages(); // Immediately fetch active user msgs
                    }}
                    style={{ 
                      background: "white", 
                      padding: "12px", 
                      borderRadius: "8px", 
                      boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between"
                    }}
                  >
                    <div>
                      <p style={{ margin: 0, fontWeight: "600", fontSize: "14px", color: "#1e293b" }}>User #{conv.name}</p>
                      <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "200px" }}>
                        {conv.lastMessage.senderName}: {conv.lastMessage.text}
                      </p>
                    </div>
                    {conv.unread > 0 && (
                      <div style={{ background: "#ec5b13", color: "white", fontSize: "11px", fontWeight: "bold", padding: "2px 6px", borderRadius: "10px" }}>
                        {conv.unread}
                      </div>
                    )}
                  </div>
                ))
              )
            ) : (
              // CHAT MESSAGES VIEW (For User OR Active Staff Conversation)
              <>
                {messages.map((msg) => {
                  const isMe = msg.senderId === String(auth.id);
                  return (
                    <div key={msg.id} style={{ display: "flex", gap: "8px", alignSelf: isMe ? "flex-end" : "flex-start", maxWidth: "80%" }}>
                      {!isMe && (
                         msg.senderAvatar ? (
                           <img src={msg.senderAvatar} alt="avatar" style={{ width: "28px", height: "28px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                         ) : (
                           <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#e2e8f0", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "bold", flexShrink: 0 }}>
                             {msg.senderName === "Staff/Admin" ? "S" : msg.senderName.charAt(0).toUpperCase()}
                           </div>
                         )
                      )}
                      <div style={{
                        background: isMe ? "#06b6d4" : "white",
                        color: isMe ? "white" : "#1e293b",
                        padding: "10px 14px",
                        borderRadius: isMe ? "16px 16px 0 16px" : "16px 16px 16px 0",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                        fontSize: "13px",
                        lineHeight: "1.4",
                        wordBreak: "break-word"
                      }}>
                        {msg.text}
                        <div style={{ fontSize: "10px", opacity: 0.7, marginTop: "4px", textAlign: isMe ? "right" : "left" }}>
                           {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      {isMe && (
                         auth?.avatar ? (
                           <img src={auth.avatar} alt="avatar" style={{ width: "28px", height: "28px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                         ) : (
                           <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#e2e8f0", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "bold", flexShrink: 0 }}>
                             {auth?.username?.charAt(0).toUpperCase() || "U"}
                           </div>
                         )
                      )}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input Area */}
          {(!isStaff || activeUser) && (
            <div style={{ padding: "12px", background: "white", borderTop: "1px solid #e2e8f0", display: "flex", gap: "8px" }}>
              <input 
                type="text" 
                placeholder="Type a message..." 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  borderRadius: "20px",
                  border: "1px solid #cbd5e1",
                  outline: "none",
                  fontSize: "13px"
                }}
              />
              <button 
                onClick={handleSendMessage}
                style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#06b6d4", color: "white", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Chat Bubble Button */}
      <button 
        onClick={handleOpenChat}
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          background: "#06b6d4",
          border: "none",
          color: "white",
          fontSize: "24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 12px rgba(6, 182, 212, 0.4)",
          cursor: "pointer",
          zIndex: 1000,
          transition: "transform 0.2s"
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
        onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
      >
        {showChat ? "×" : (
          <>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            {unreadCount > 0 && (
              <span style={{
                position: "absolute",
                top: "-5px",
                right: "-5px",
                width: "20px",
                height: "20px",
                background: "#ec5b13",
                borderRadius: "50%",
                border: "2px solid white",
                fontSize: "11px",
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white"
              }}>
                {unreadCount}
              </span>
            )}
          </>
        )}
      </button>
    </>
  );
};

export default SupportChatWidget;
