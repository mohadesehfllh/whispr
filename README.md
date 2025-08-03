# Whispr - Encrypted P2P Chat Application

A privacy-focused, end-to-end encrypted peer-to-peer chat application built for secure communication with ephemeral messaging and advanced security features.

## Features

- 🔐 **End-to-End Encryption**: RSA-OAEP with Web Crypto API
- ⏰ **Ephemeral Messaging**: Auto-delete messages with timers
- 👤 **No Accounts Required**: Anonymous by design
- 🖼️ **Self-Destructing Images**: View-once media sharing
- ☎️ **Real-Time Audio Calls**: WebRTC P2P communication
- 🛡️ **Spyware Detection**: Screen recording prevention
- 🔄 **Real-time Communication**: WebSocket-based messaging

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express + WebSocket
- **UI**: shadcn/ui + Tailwind CSS
- **Database**: PostgreSQL with Drizzle ORM
- **Deployment**: Docker + Render.com

## Quick Start

### Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```
   
   The app will be available at `http://localhost:5000`

### Production Build

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Start production server**:
   ```bash
   npm start
   ```

## Docker Deployment

### Build and Run with Docker

1. **Build the Docker image**:
   ```bash
   docker build -t whispr-chat .
   ```

2. **Run the container**:
   ```bash
   docker run -p 5000:5000 -e NODE_ENV=production whispr-chat
   ```

### Deploy to Render.com

#### Option 1: Using render.yaml (Recommended)

1. **Connect your GitHub repository** to Render.com
2. **Use the provided render.yaml** file for automatic configuration
3. The build process will:
   - Install dependencies
   - Build the React frontend  
   - Build the Node.js backend (without Vite)
   - Start the production server

#### Option 2: Manual Configuration

1. **Create a new Web Service** with these settings:
   - **Build Command**: 
     ```bash
     npm ci && npx vite build && npx esbuild server/index.prod.ts --bundle --platform=node --target=node20 --format=esm --outdir=dist --external:express --external:ws --external:drizzle-orm --external:@neondatabase/serverless --external:memorystore --external:connect-pg-simple --external:passport --external:passport-local --external:express-session --external:crypto --external:path --external:fs --external:http --external:url --external:zod --external:zod-validation-error --external:nanoid && rm -f dist/index.js
     ```
   - **Start Command**: `node dist/index.prod.js`
   - **Environment**: `NODE_ENV=production`

#### Option 3: Docker Deployment

1. Set **Runtime** to "Docker"
2. The Dockerfile will handle the entire build process automatically

### Environment Variables

For production deployment, you may need to set:

```bash
NODE_ENV=production
PORT=5000
DATABASE_URL=your_postgresql_connection_string
```

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── lib/            # Utilities and services
│   │   └── hooks/          # Custom React hooks
├── server/                 # Node.js backend
│   ├── index.ts           # Main server file
│   ├── routes.ts          # API routes and WebSocket handling
│   ├── storage.ts         # Data storage interface
│   └── vite.ts            # Development Vite integration
├── shared/                # Shared types and schemas
└── Dockerfile            # Docker configuration
```

## Security Features

- **Client-side encryption**: All messages encrypted before transmission
- **No data persistence**: Messages automatically deleted
- **Anti-tampering**: Screenshot and screen recording detection
- **Secure WebRTC**: DTLS encryption for audio calls
- **Environment monitoring**: Detection of developer tools and suspicious extensions

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/chat/create` - Create new chat room
- `GET /api/chat/:roomId` - Get chat room details
- `WebSocket /ws` - Real-time messaging

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Build Scripts

- **Development**: `npm run dev` - Starts development server with hot reload
- **Production Build**: `./build.sh` - Builds frontend and backend for production
- **Deployment Build**: `./deploy.sh` - Complete deployment preparation with verification

## Troubleshooting

### Common Deployment Issues

1. **"Cannot find package 'vite'" error**:
   - **SOLUTION**: Use `server/index.prod.ts` for production builds instead of `server/index.ts`
   - The production server file has no Vite dependencies
   - Ensure deployment uses `node dist/index.prod.js`

2. **Recurring Vite errors in production**:
   - **SOLUTION**: Always use the deployment script `./deploy.sh`
   - This script ensures only the production server file is built
   - Removes any development artifacts that might contain Vite imports

3. **WebSocket connection issues**:
   - Check that the WebSocket endpoint `/ws` is properly configured
   - Ensure your hosting platform supports WebSocket connections

4. **Build failures**:
   - Run `./deploy.sh` for a complete verified build
   - Check that all dependencies are properly installed
   - Verify the build process completes without errors locally

### Deployment Verification

Before deploying, always run:
```bash
./deploy.sh
```

This script will:
- Build both frontend and backend
- Remove any development artifacts
- Verify no Vite imports exist in production
- Confirm all required files are present

For more help, check the project's GitHub issues or create a new one.
