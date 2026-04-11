const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const jwt = require("jsonwebtoken");

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }

  jwt.verify(token, process.env.JWT_SECRET || "dev_jwt_secret_change_me", (err, decoded) => {
    if (err) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }
    req.user = decoded;
    next();
  });
};

// @route   GET /api/messages/conversations
// @desc    Get all conversations for a user
// @access  Private
router.get("/conversations/all", verifyToken, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.id,
      isActive: true,
    })
      .populate("participants", "name profilePicture")
      .populate("lastMessage")
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      conversations,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/messages/conversations
// @desc    Create or get conversation with a user
// @access  Private
router.post("/conversations", verifyToken, async (req, res) => {
  try {
    const { otherUserId, bookingId } = req.body;

    if (!otherUserId) {
      return res.status(400).json({
        success: false,
        message: "otherUserId is required",
      });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [req.user.id, otherUserId] },
    })
      .populate("participants", "name profilePicture")
      .populate("lastMessage");

    if (!conversation) {
      conversation = new Conversation({
        participants: [req.user.id, otherUserId],
        bookingId,
        isActive: true,
      });

      await conversation.save();
      await conversation.populate("participants", "name profilePicture");
    }

    res.status(200).json({
      success: true,
      conversation,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/messages/:conversationId
// @desc    Get all messages in a conversation
// @access  Private
router.get("/:conversationId", verifyToken, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId)
      .populate("participants", "name profilePicture _id");

    if (!conversation) {
      return res.status(404).json({ success: false, message: "Conversation not found" });
    }

    // Check if user is participant
    if (!conversation.participants.some(p => p._id.toString() === req.user.id)) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const messages = await Message.find({
      conversationId: req.params.conversationId,
      deleted: false,
    })
      .populate("senderId", "name profilePicture _id")
      .sort({ createdAt: 1 });

    // Mark messages as read
    await Message.updateMany(
      {
        conversationId: req.params.conversationId,
        recipientId: req.user.id,
        isRead: false,
      },
      { isRead: true, readAt: new Date() }
    );

    res.status(200).json({
      success: true,
      conversation,
      messages,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/messages/:conversationId
// @desc    Send a message
// @access  Private
router.post("/:conversationId", verifyToken, async (req, res) => {
  try {
    const { content, attachments } = req.body;

    const conversation = await Conversation.findById(req.params.conversationId);

    if (!conversation) {
      return res.status(404).json({ success: false, message: "Conversation not found" });
    }

    if (!conversation.participants.includes(req.user.id)) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const recipientId = conversation.participants.find(
      (id) => id.toString() !== req.user.id
    );

    const message = new Message({
      conversationId: req.params.conversationId,
      senderId: req.user.id,
      recipientId,
      content,
      attachments,
    });

    await message.save();
    await message.populate("senderId", "name profilePicture");

    // Update last message
    conversation.lastMessage = message._id;
    await conversation.save();

    res.status(201).json({
      success: true,
      message,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/messages/:messageId/read
// @desc    Mark message as read
// @access  Private
router.put("/:messageId/read", verifyToken, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    if (message.recipientId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    message.isRead = true;
    message.readAt = new Date();
    await message.save();

    res.status(200).json({
      success: true,
      message,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/messages/:messageId
// @desc    Delete a message
// @access  Private
router.delete("/:messageId", verifyToken, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    if (message.senderId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    message.deleted = true;
    await message.save();

    res.status(200).json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
