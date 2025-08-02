# PiSecure Chat

## Overview

PiSecure Chat is an end-to-end encrypted peer-to-peer chat application built for the Pi Network ecosystem. The application provides secure, ephemeral messaging with features including text chat, disappearing photo sharing, and real-time audio calling with comprehensive security monitoring. All communications are encrypted and designed to be temporary with no permanent storage of chat data or metadata.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Library**: shadcn/ui components built on top of Radix UI primitives
- **Styling**: Tailwind CSS with a dark theme configuration and CSS variables
- **State Management**: TanStack React Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Real-time Communication**: WebSocket integration for live messaging and WebRTC for peer-to-peer audio calls
- **Audio Calling**: End-to-end encrypted audio calls with anti-spyware detection and security scanning

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Development Server**: `server/index.ts` with Vite integration for hot reload
- **Production Server**: `server/index.prod.ts` with static file serving (no Vite dependencies)
- **WebSocket**: ws library for real-time messaging capabilities
- **Data Storage**: In-memory storage with automatic cleanup for ephemeral data
- **Database**: Drizzle ORM configured for PostgreSQL with schema definitions
- **Session Management**: Express sessions with PostgreSQL session store

### Build Process
- **Development**: Uses `server/index.ts` with Vite middleware for hot reload
- **Production**: Uses `server/index.prod.ts` built with esbuild, completely separate from Vite
- **Deployment**: Dual-file strategy prevents Vite import errors in production environments

### Security & Encryption
- **End-to-End Encryption**: Web Crypto API with RSA-OAEP encryption for message and media
- **Key Management**: Client-side key pair generation and exchange
- **Anti-Tampering**: Screenshot prevention and comprehensive spyware detection
- **Ephemeral Data**: Automatic cleanup of expired rooms and messages
- **Audio Call Security**: WebRTC DTLS encryption with pre-call security scanning
- **Environment Monitoring**: Real-time detection of developer tools, screen recording, and suspicious extensions

### Data Models
- **Chat Rooms**: Temporary rooms with expiration timestamps and participant tracking
- **Messages**: Support for text and image types with view-once functionality
- **Participants**: User sessions with nicknames and public keys for encryption

### External Dependencies
- **Database**: PostgreSQL with Neon Database serverless driver
- **Pi Network**: Pi SDK integration for user validation and ecosystem integration
- **WebRTC**: STUN/TURN servers for peer-to-peer audio communication
- **Real-time**: WebSocket connections for instant messaging

The application follows a client-server architecture where the server acts primarily as a relay for encrypted messages, with automatic cleanup ensuring no permanent data storage. The frontend handles all encryption/decryption operations client-side to maintain end-to-end security.