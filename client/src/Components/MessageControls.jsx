import React from "react";
import socket from "../socket";
import {
  FaReply,
  FaEdit,
  FaTrash,
  FaThumbtack
} from "react-icons/fa";
import { BiPin } from "react-icons/bi"; // For unpinned (outline) pin icon
import "./MessageControls.css";

const MessageControls = ({
  message,
  currentUser,
  onReply,
  onEdit,
  onDelete
}) => {
  const isSender = message.username === currentUser;

  const handlePinToggle = () => {
    socket.emit("togglePin", {
      messageId: message._id,
      room: message.room
    });
  };

  return (
    <div className="message-controls">
      {!message.system && (
        <div className="controls-container">
          <button
            className="control-btn reply"
            onClick={() => onReply(message)}
            aria-label="Reply"
            title="Reply"
          >
            <FaReply className="control-icon" />
            <span className="control-text">Reply</span>
          </button>

          {isSender && (
            <>
              <button
                className="control-btn edit"
                onClick={() => onEdit(message)}
                aria-label="Edit"
                title="Edit"
              >
                <FaEdit className="control-icon" />
                <span className="control-text">Edit</span>
              </button>
              <button
                className="control-btn delete"
                onClick={() => onDelete(message)}
                aria-label="Delete"
                title="Delete"
              >
                <FaTrash className="control-icon" />
                <span className="control-text">Delete</span>
              </button>
            </>
          )}

          <button
            className={`control-btn pin ${message.pinned ? "pinned" : ""}`}
            onClick={handlePinToggle}
            aria-label={message.pinned ? "Unpin" : "Pin"}
            title={message.pinned ? "Unpin" : "Pin"}
          >
            {message.pinned ? (
              <FaThumbtack className="control-icon" />
            ) : (
              <BiPin className="control-icon" />
            )}
            <span className="control-text">
              {message.pinned ? "Unpin" : "Pin"}
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

export default MessageControls;
