# Live Mapper - Real-time Vehicle Tracking

A lightweight, modern web application for tracking vehicles in real-time using the Cartrack Fleet API.

## Features

- 🗺️ **Interactive Map** - MapLibre GL for smooth, responsive mapping
- 📍 **Real-time Tracking** - Updates every 15 seconds automatically
- 🎨 **Beautiful UI** - Modern design with Tailwind CSS
- 🚀 **Fast & Lightweight** - FastAPI backend, Vite frontend
- 🐳 **Easy Deployment** - Docker Compose setup
- 🔒 **Secure** - API credentials in environment variables

## Tech Stack

### Backend
- **FastAPI** - Modern, fast Python web framework
- **Uvicorn** - Lightning-fast ASGI server
- **httpx** - Async HTTP client

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Fast build tool
- **MapLibre GL** - Open-source mapping
- **Tailwind CSS** - Utility-first CSS

### Deployment
- **Docker** - Containerization
- **Nginx** - Production web server

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Cartrack API credentials

### Setup

1. Clone and configure:
```bash
cp .env.template .env
# Edit .env with your Cartrack API credentials
```

2. Build and run:
```bash
make build
make up
```

3. Open your browser:
```
http://localhost
```

## Available Commands

```bash
make build    # Build Docker images
make up       # Start containers
make down     # Stop containers
make logs     # View logs
make restart  # Restart containers
make clean    # Clean up everything
```

## Configuration

Edit `.env` file:

```env
CARTRACK_API_URL=https://fleetapi-za.cartrack.com/rest
CARTRACK_VEHICLE_ID=YOUR_VEHICLE_ID
CARTRACK_AUTH_TOKEN=Basic YOUR_BASE64_TOKEN
```

## Production Deployment

### With Domain

1. Point your domain to your server's IP
2. Update `nginx.conf` with your domain
3. Add SSL with Let's Encrypt:

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com
```

### Environment Variables

For production, use Docker secrets or a secure secrets manager instead of `.env` files.

## API Endpoints

- `GET /` - Health check
- `GET /api/vehicle/status` - Get current vehicle status

## Development

### Backend Development
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

## License

MIT

## Author

Built with ❤️ for real-time vehicle tracking
