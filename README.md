# 🤖 Corgan AI Chat - Intelligent Teams Bot

[![Teams App](https://img.shields.io/badge/Microsoft%20Teams-Ready-6264A7.svg?style=flat-square&logo=microsoft-teams)](https://teams.microsoft.com/)
[![Azure OpenAI](https://img.shields.io/badge/Azure%20OpenAI-GPT--4-0078D4.svg?style=flat-square&logo=microsoft-azure)](https://azure.microsoft.com/products/ai-services/openai-service)
[![FLUX.1](https://img.shields.io/badge/FLUX.1-Kontext--pro-FF6B6B.svg?style=flat-square)](https://docs.microsoft.com/azure/ai-services/)

A comprehensive AI-powered chat assistant for Microsoft Teams featuring GPT-4 conversations, FLUX.1-Kontext-pro image generation, and persistent chat history with a modern web interface.

## ✨ Features

### 🤖 **AI-Powered Conversations**
- **GPT-4 Integration** - Advanced natural language processing
- **Context Awareness** - Maintains conversation context
- **Multi-turn Dialogues** - Complex, coherent conversations

### 🎨 **Image Generation**
- **FLUX.1-Kontext-pro** - High-quality image synthesis
- **Prompt Enhancement** - GPT-4 optimized prompts
- **Thumbnail Creation** - Automatic image previews

### 💬 **Chat History Management**
- **Persistent Storage** - All conversations saved locally
- **Search & Filter** - Find conversations quickly
- **Session Management** - Organized chat sessions
- **Export Capabilities** - Data portability

### 🛠️ **Teams Integration**
- **Bot Framework** - Native Teams bot experience
- **Static Tabs** - Dedicated chat history interface
- **DevTools Support** - Development and debugging tools
- **Cross-platform** - Works on desktop, web, and mobile

## 🚀 Quick Start

### Prerequisites
1. **Azure OpenAI Service** with GPT-4 deployment
2. **Azure AI Services** with FLUX.1-Kontext-pro access
3. **Node.js 18+** and npm

### Setup
1. **Clone and Install**
   ```bash
   git clone <your-repo-url>
   cd Corgan-AI-Chat-4
   npm install
   ```

2. **Environment Configuration**
   Create `.env` file in root directory:
   ```bash
   # Azure OpenAI Configuration
   AZURE_OPENAI_API_KEY=your_api_key_here
   AZURE_OPENAI_ENDPOINT=https://your-instance.cognitiveservices.azure.com/
   AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4
   AZURE_OPENAI_API_VERSION=2025-01-01-preview

   # FLUX.1-Kontext-pro Configuration
   FLUX_API_KEY=your_flux_api_key_here
   FLUX_ENDPOINT=https://your-instance.services.ai.azure.com/
   FLUX_DEPLOYMENT_NAME=FLUX.1-Kontext-pro
   FLUX_API_VERSION=2025-04-01-preview

   # Server Configuration
   PORT=3978
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

### Access Your App
- 🤖 **Teams DevTools**: http://localhost:3979/devtools
- 💬 **Chat Interface**: http://localhost:3981
- 📱 **History Widget**: http://localhost:3981/chat-history-widget.html
- 🖼️ **Generated Images**: http://localhost:3980/images

### Production Deployment
```bash
# Build application
npm run build

# Package Teams app
npm run package:teams

# Deploy to Azure
# See TEAMS_DEPLOYMENT.md for detailed instructions
```

## 📁 Project Structure

```
├── src/
│   ├── index.ts              # Main application entry
│   ├── chatHistory.ts        # Chat persistence logic
│   └── web/                  # Frontend interface
│       ├── index.html        # Main chat interface
│       ├── chat.js          # Frontend JavaScript
│       ├── styles.css       # UI styling
│       └── chat-history-widget.html  # Compact widget
├── appPackage/
│   ├── manifest.json        # Teams app manifest
│   ├── color.png           # App icon (color)
│   └── outline.png         # App icon (outline)
├── chat_sessions/          # Local chat storage
├── generated_images/       # Generated image files
└── TEAMS_DEPLOYMENT.md     # Deployment guide
```

## 🔧 Configuration

### Current Features
- ✅ **GPT-4 Chat** - Advanced conversation capabilities
- ✅ **Image Generation** - FLUX.1-Kontext-pro integration
- ✅ **Chat History** - Persistent local storage with search
- ✅ **Web Interface** - Modern responsive design with DevTools integration
- ✅ **Teams Ready** - Full Microsoft Teams bot framework support

### Servers & Ports
| Service | Port | Purpose |
|---------|------|---------|
| Teams App | 3978 | Main bot framework endpoint |
| DevTools | 3979 | Development and debugging interface |
| Images | 3980 | Generated image file server |
| Chat Interface | 3981 | Web-based chat history interface |

### API Endpoints
- `GET /api/sessions` - List all chat sessions
- `GET /api/sessions/:id` - Get specific session
- `POST /api/sessions` - Create new session
- `DELETE /api/sessions/:id` - Delete session
- `POST /api/sessions/:id/messages` - Send message
- `GET /api/sessions/search?q=query` - Search conversations

## 💡 Usage Examples

### Text Conversations
```
User: "Explain quantum computing in simple terms"
Bot: "Quantum computing is like having a super-powerful calculator that can solve certain problems exponentially faster than traditional computers..."
```

### Image Generation
```
User: "Create an image of a futuristic city at sunset"
Bot: "I'll create that image for you!"
[Generates and displays high-quality image]
```

### Chat History
- **Search**: Find specific conversations
- **Browse**: Navigate through past sessions
- **Export**: Download conversation data
- **Delete**: Remove unwanted sessions

## 🏗️ Architecture

### Components
- **Bot Framework** - Microsoft Teams integration
- **Express Server** - Web interface and API
- **Chat History Engine** - Persistent conversation storage
- **Azure OpenAI Client** - GPT-4 API integration
- **FLUX Client** - Image generation API
- **Static File Server** - Frontend asset delivery

### Data Flow
```
Teams Message → Bot Handler → GPT-4 API → Response → Teams
                     ↓
            Chat History Storage → Web Interface
                     ↓
               Image Generation → File Storage
```

## 🔒 Security & Privacy

### Environment Security
- **API Keys** - Stored in `.env` file (gitignored for security)
- **Local Development** - All data stays on your machine
- **No Cloud Dependencies** - Chat history stored locally in `chat_sessions/`

### Production Security
- **Azure Key Vault** - Recommended for production API key storage
- **Environment Variables** - Secure configuration in Azure App Service
- **Bot Framework** - Enterprise-grade Teams integration security

## 📊 Monitoring & Analytics

### Built-in Tracking
- **Conversation Metrics** - Message counts and session lengths
- **Image Generation Stats** - Usage and performance data
- **Error Logging** - Comprehensive error tracking
- **Performance Monitoring** - Response times and throughput

### Customization
- **Application Insights** - Azure monitoring integration
- **Custom Telemetry** - Track specific business metrics
- **Usage Analytics** - User engagement patterns

## 🛠️ Development

### Local Development
```bash
# Watch mode with auto-reload
npm run dev

# Build TypeScript
npm run build

# Clean build artifacts
npm run clean
```

### Testing & Development
```bash
# Development with auto-reload
npm run dev

# Build production version
npm run build

# Create Teams app package
npm run package:teams

# Clean build artifacts
npm run clean
```

### Live Development URLs
- **DevTools**: http://localhost:3979/devtools
- **Chat Interface**: http://localhost:3981
- **Chat Widget**: http://localhost:3981/chat-history-widget.html
- **Images**: http://localhost:3980/images
- **API Base**: http://localhost:3981/api

## 📦 Deployment Options

### Microsoft Teams
- **Organization App** - Deploy org-wide through Admin Center
- **Side-loading** - Individual developer installation
- **App Store** - Submit for public Teams App Store

### Azure Infrastructure
- **App Service** - Managed web application hosting
- **Container Instances** - Docker-based deployment
- **Kubernetes** - Scalable container orchestration

## 🤝 Contributing

This application is built with modern Microsoft Teams development practices:

1. **Teams Toolkit** - Official Microsoft development tools
2. **Bot Framework** - Enterprise-grade bot platform
3. **Azure AI Services** - Production-ready AI APIs
4. **TypeScript** - Type-safe development
5. **Modern Web Standards** - Progressive web app features

## 📄 License

MIT License - See [LICENSE](LICENSE) for details

## 🆘 Support

For deployment assistance, see [TEAMS_DEPLOYMENT.md](TEAMS_DEPLOYMENT.md)

---

## 🎯 Current Status: Fully Functional!

This application is **ready for use** and includes:

✅ **Working GPT-4 Integration** - Chat with advanced AI
✅ **Image Generation** - Create images with FLUX.1-Kontext-pro
✅ **Chat History System** - Persistent conversation storage
✅ **Modern Web Interface** - Responsive design with search
✅ **Teams Bot Framework** - Ready for Teams deployment
✅ **DevTools Integration** - Development workflow optimized

## 🚧 What's Next?

### Immediate Use
1. Set up your `.env` with Azure API keys
2. Run `npm run dev`
3. Access the chat interface at http://localhost:3981

### Teams Deployment
1. Configure production environment variables
2. Deploy to Azure App Service
3. Upload Teams app package
4. See `TEAMS_DEPLOYMENT.md` for full guide

---

**Current Version**: Fully functional chat bot with history management
**Status**: ✅ Ready for development and testing
**Deployment**: 📋 Teams deployment guide available