# feedback.app.syedrahmi

A premium, web-based Feedback Link Application with instant Telegram Bot notifications.

## Features
- Auto-generated unique Feedback ID
- Mobile-responsive frontend with a glassmorphism theme and dark mode
- Asynchronous form validation & submission
- Safe Telegram legacy Markdown escaping to prevent Bot API parsing errors
- Instant delivery of feedback straight to your Telegram account

## Quick Setup
1. Rename `.env.example` to `.env` and fill in your:
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the server:
   ```bash
   npm start
   ```
4. Visit `http://localhost:3000` in your web browser.
