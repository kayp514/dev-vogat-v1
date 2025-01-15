# Vogat Cloud Phone System

A modern cloud-based phone system built with Next.js that combines internal communication tools with PSTN connectivity.

## Features

### Unified Communications
- Internal messaging system for team collaboration
- Voice calling between internal users
- PSTN connectivity for external calls
- SIP trunk integration for telephony services

### Admin Console
- User management and permissions
- DID (Direct Inward Dialing) number management
- SIP trunk configuration
- System monitoring and analytics

### Real-time Communication
- Instant messaging between users
- Voice calls with HD audio quality
- Presence indicators (online, busy, offline)
- Call history and message logs

## Technical Stack

- **Frontend**: Next.js 14 with App Router
- **UI Components**: shadcn/ui + Tailwind CSS
- **Real-time**: WebSocket for messaging and calls
- **Voice**: WebRTC for voice communication
- **PSTN Integration**: SIP protocol for external calling

## Getting Started

1. Clone the repository:
```bash
git clone [repository-url]
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env.local
```

4. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the application.

## Configuration

### SIP Trunk Setup
1. Configure your SIP provider credentials
2. Set up DID numbers
3. Configure routing rules

### User Management
- Create user accounts
- Assign roles and permissions
- Configure extension numbers

## Documentation

For detailed documentation, please refer to:
- [User Guide](docs/user-guide.md)
- [Admin Guide](docs/admin-guide.md)
- [API Documentation](docs/api.md)
- [Development Guide](docs/development.md)

## License

[License Type] - See LICENSE file for details

## Support

For support, please contact [support contact information]
