import React, { useRef, useEffect } from 'react';
import { 
  FaUserPlus, 
  FaUserTimes, 
  FaComment, 
  FaClock,
  FaEdit,
  FaTrash,
  FaReply,
  FaRegCheckCircle
} from 'react-icons/fa';
import './ActivityLog.css';

const ActivityLog = ({ logs = [] }) => {
  const sortedLogs = [...logs].sort((a, b) => new Date(b.time) - new Date(a.time));
  const activityEndRef = useRef(null);

  const getActivityIcon = (type) => {
    switch (type) {
      case 'join': return <FaUserPlus className="icon join" />;
      case 'leave': return <FaUserTimes className="icon leave" />;
      case 'message': return <FaComment className="icon message" />;
      case 'edit': return <FaEdit className="icon edit" />;
      case 'delete': return <FaTrash className="icon delete" />;
      case 'reply': return <FaReply className="icon reply" />;
      default: return <FaRegCheckCircle className="icon default" />;
    }
  };

  const getActivityText = (log) => {
    switch (log.type) {
      case 'join':
        return <><strong>{log.username}</strong> joined the room</>;
      case 'leave':
        return <><strong>{log.username}</strong> left the room</>;
      case 'message':
        return <><strong>{log.username}</strong> sent a message</>;
      case 'edit':
        return <><strong>{log.username}</strong> edited a message</>;
      case 'delete':
        return <><strong>{log.username}</strong> deleted a message</>;
      case 'reply':
        return (
          <>
            <strong>{log.username}</strong> replied to <strong>{log.replyTo}</strong>
          </>
        );
      default:
        return <><strong>{log.username}</strong> performed an action</>;
    }
  };

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    activityEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="activity-log">
      <div className="header">
        <h3>Room Activity</h3>
        <span className="count">{logs.length} events</span>
      </div>
      
      <div className="log-container">
        {sortedLogs.length === 0 ? (
          <div className="empty">
            <p>No activity yet</p>
            <small>Activities will appear here</small>
          </div>
        ) : (
          sortedLogs.map((log, index) => (
            <div key={`${log.time}-${index}`} className="log-item">
              <div className="icon-container">
                {getActivityIcon(log.type)}
              </div>
              <div className="content">
                <p>{getActivityText(log)}</p>
                {log.content && (
                  <div className="message-preview">
                    {log.type === 'delete' ? (
                      <span className="deleted-message">Message deleted</span>
                    ) : (
                      <span className="message-content">"{log.content}"</span>
                    )}
                    {log.oldContent && log.type === 'edit' && (
                      <span className="old-message">Original: "{log.oldContent}"</span>
                    )}
                  </div>
                )}
                <div className="time">
                  <FaClock className="clock-icon" />
                  {new Date(log.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={activityEndRef} />
      </div>
    </div>
  );
};

export default ActivityLog;