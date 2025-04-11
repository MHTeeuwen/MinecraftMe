# MinecraftMe - AI Photo Converter

Transform your photos into Minecraft-style artwork using AI! This application uses OpenAI's advanced AI models to convert regular photos into Minecraft-themed images.

## Features

- Drag-and-drop image upload
- AI-powered image conversion
- Minecraft-themed UI
- Payment integration with Stripe
- Credit system for conversions
- Responsive design

## Tech Stack

- **Frontend**: React.js, CSS
- **Backend**: Node.js, Express
- **AI**: OpenAI Vision and Image Generation APIs
- **Payments**: Stripe
- **Deployment**: Vercel (frontend), Render (backend)

## Development Setup

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/minecraftme.git
   cd minecraftme
   ```

2. Install dependencies:
   ```
   # Install server dependencies
   cd server
   npm install

   # Install client dependencies
   cd ../client
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env` in the server directory
   - Fill in your API keys for OpenAI and Stripe (test mode)

4. Start development servers:
   ```
   # Start the server (from the server directory)
   npm run dev

   # Start the client (from the client directory)
   npm start
   ```

## Deployment Instructions

### Backend Deployment (Render)

1. Push your code to GitHub
2. Create a new Web Service on Render
3. Connect your GitHub repository
4. Use the following settings:
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Add the environment variables from `.env.production`
6. Deploy!

### Frontend Deployment (Vercel)

1. Push your code to GitHub
2. Create a new project on Vercel
3. Connect your GitHub repository
4. Use the following settings:
   - Framework Preset: Create React App
   - Root Directory: `client`
   - Build Command: `npm run build`
   - Output Directory: `build`
5. Add the environment variables:
   - `REACT_APP_API_URL=https://your-backend-url.onrender.com`
6. Deploy!

## Production Checklist

Before going live, ensure you have:

1. Set up Stripe live mode with real API keys
2. Updated the OpenAI API key for production use
3. Configured proper CORS settings
4. Set up environment variables for production
5. Tested the entire payment and conversion flow
6. Ensured SSL/HTTPS is enabled for both frontend and backend
7. Set up proper rate limiting and security measures

## License

This project is licensed under the MIT License - see the LICENSE file for details. 