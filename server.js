require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and parsing of JSON/form data
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Generates a user-friendly unique feedback ID.
 * Format: FB-XXXXXX (e.g., FB-A79B3E)
 */
function generateFeedbackId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `FB-${result}`;
}

/**
 * Escapes characters that are reserved in Telegram's legacy Markdown parse mode.
 * Reserved characters: *, _, `, [
 */
function escapeMarkdown(text) {
  if (!text) return '';
  return text.toString().replace(/([*_`\[])/g, '\\$1');
}

/**
 * Helper function to send an HTTP POST request to the Telegram Bot API
 * using Node.js built-in 'https' module (no external fetch packages required).
 */
function sendTelegramMessage(token, chatId, text) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'Markdown'
    });

    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${token}/sendMessage`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve({ success: true, message: 'Message sent, but response parsing failed.' });
          }
        } else {
          reject(new Error(`Telegram API Error (Status ${res.statusCode}): ${data}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(payload);
    req.end();
  });
}

// Endpoint to process feedback submissions
app.post('/api/feedback', async (req, res) => {
  try {
    const { name, email, feedback } = req.body;

    // 1. Basic validation
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Name is required.' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, error: 'Email ID is required.' });
    }
    // Simple email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, error: 'Please enter a valid Email ID.' });
    }
    if (!feedback || !feedback.trim()) {
      return res.status(400).json({ success: false, error: 'Feedback message is required.' });
    }

    // 2. Auto-generate feedback ID
    const feedbackId = generateFeedbackId();

    // 3. Check Telegram Bot credentials
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || token === 'YOUR_TELEGRAM_BOT_TOKEN_HERE' || !chatId || chatId === 'YOUR_TELEGRAM_CHAT_ID_HERE') {
      console.warn('⚠️ Telegram credentials not configured. Skipping notification.');
      // We will return a simulated success in this case to allow user testing before setting up token
      return res.status(200).json({
        success: true,
        id: feedbackId,
        warning: 'Feedback received, but Telegram credentials are not configured in .env.'
      });
    }

    // 4. Format the Markdown message
    const escapedId = escapeMarkdown(feedbackId);
    const escapedName = escapeMarkdown(name.trim());
    const escapedEmail = escapeMarkdown(email.trim());
    const escapedFeedback = escapeMarkdown(feedback.trim());

    const message = `🔔 *New Feedback Received!*
- *ID:* ${escapedId}
- *Name:* ${escapedName}
- *Email:* ${escapedEmail}
- *Feedback:* ${escapedFeedback}`;

    // 5. Send message via Telegram Bot API
    await sendTelegramMessage(token, chatId, message);

    // 6. Return response
    return res.status(200).json({
      success: true,
      id: feedbackId
    });

  } catch (error) {
    console.error('Error handling feedback submission:', error);
    return res.status(500).json({
      success: false,
      error: 'An internal error occurred while processing your feedback.'
    });
  }
});

// Fallback to serve index.html for undefined GET routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
