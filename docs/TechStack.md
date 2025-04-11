# Tech Stack

## Frontend
- **React**: Single-page app for UI (drag-and-drop upload, result display).
- **CSS**: Minecraft-inspired (pixel fonts, green/brown palette).
- **Tools**: npm, Create React App.

## Backend
- **Node.js**: Runtime for server.
- **Express**: API framework (routes: /upload, /create-checkout).
- **Multer**: File upload handling.
- **OpenAI**: GPT-4o API for image conversion (prompt: "blocky, pixelated Minecraft style").
- **Stripe**: Payment processing (Popcorn Pricing).
- **Sharp**: Image resizing for previews.

## Hosting
- **Vercel**: Deployment for frontend and backend.
- **Domain**: minecraftme.com (TBD).

## Testing
- **Jest**: Backend unit tests.
- **React Testing Library**: Frontend tests.
- **Mocks**: Fake OpenAI/Stripe responses.

## Environment Variables
- `OPENAI_API_KEY`: OpenAI access.
- `STRIPE_SECRET_KEY`: Stripe payments.
- `STRIPE_PUBLISHABLE_KEY`: Frontend Stripe integration.