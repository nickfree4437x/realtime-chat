const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  room: {
    type: String,
    required: true,
    index: true // Added for better search performance
  },
  username: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true,
    text: true // Enable text indexing for search
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true // Index for sorting
  },
  seenBy: {
    type: [String],
    default: []
  },
  deliveredTo: {
    type: [String],
    default: []
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message",
    default: null
  },
  // New fields for additional features
  reactions: {
    type: Map,
    of: [String], // Map of emoji -> array of usernames who reacted
    default: new Map()
  },
  pinned: {
    type: Boolean,
    default: false,
    index: true // For quick lookup of pinned messages
  },
  edited: {
    type: Boolean,
    default: false
  },
  editHistory: {
    type: [{
      content: String,
      timestamp: Date
    }],
    default: []
  },
  systemMessage: {
    type: Boolean,
    default: false
  }
}, {
  // Add these options for better query performance
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      // Convert Map to Object for better client-side handling
      if (ret.reactions instanceof Map) {
        ret.reactions = Object.fromEntries(ret.reactions);
      }
      return ret;
    }
  }
});

// Index for text search across messages
messageSchema.index({ message: 'text' });

// Virtual for formatted timestamp
messageSchema.virtual('timeFormatted').get(function() {
  return this.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
});

// Middleware to track edit history
messageSchema.pre('save', function(next) {
  if (this.isModified('message') && !this.isNew) {
    this.edited = true;
    this.editHistory.push({
      content: this.message,
      timestamp: new Date()
    });
  }
  next();
});

module.exports = mongoose.model("Message", messageSchema);