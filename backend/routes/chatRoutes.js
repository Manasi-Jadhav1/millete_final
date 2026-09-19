import express from 'express';
import { handleChat } from '../controllers/chatController.js';

const router = express.Router();

/**
 * @route   POST /api/chat
 * @desc    Chat with Millet AI Assistant
 * @access  Public
 */
router.post('/', handleChat);

export default router;
