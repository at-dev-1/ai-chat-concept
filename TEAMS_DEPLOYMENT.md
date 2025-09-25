# 🚀 Microsoft Teams Deployment Guide

## Overview
This Corgan AI Chat app is ready for deployment to Microsoft Teams! It provides:
- 🤖 GPT-4 powered conversations
- 🎨 FLUX.1-Kontext-pro image generation
- 💬 Comprehensive chat history
- 🛠️ Teams integration with tabs and bot

## Prerequisites

### 1. Azure Resources Required
- **Azure OpenAI Service** with GPT-4 deployment
- **Azure AI Services** with FLUX.1-Kontext-pro deployment
- **Azure Bot Service** registration
- **Azure App Service** or **Azure Container Instances** for hosting

### 2. Microsoft Teams Environment
- Microsoft Teams admin access (for organization deployment)
- Teams App Studio or Developer Portal access
- M365 tenant with Teams enabled

## Deployment Steps

### Step 1: Configure Environment Variables
Create production environment variables:

```bash
# Azure OpenAI Configuration
AZURE_OPENAI_API_KEY=your_azure_openai_key
AZURE_OPENAI_ENDPOINT=https://your-openai-instance.cognitiveservices.azure.com/
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4
AZURE_OPENAI_API_VERSION=2025-01-01-preview

# FLUX.1-Kontext-pro Configuration
FLUX_API_KEY=your_flux_api_key
FLUX_ENDPOINT=https://your-flux-instance.services.ai.azure.com/
FLUX_DEPLOYMENT_NAME=FLUX.1-Kontext-pro
FLUX_API_VERSION=2025-04-01-preview

# Teams Bot Configuration
BOT_ID=your_bot_id
BOT_PASSWORD=your_bot_password
BOT_DOMAIN=your-app-domain.azurewebsites.net
TEAMS_APP_ID=your_teams_app_id
APP_NAME_SUFFIX=prod

# Server Configuration
PORT=3978
```

### Step 2: Azure Bot Service Setup
1. **Create Azure Bot Resource**:
   ```bash
   az bot create \
     --resource-group myResourceGroup \
     --name corgan-ai-chat-bot \
     --kind webapp \
     --endpoint https://your-app-domain.azurewebsites.net/api/messages
   ```

2. **Configure Bot Channels**:
   - Enable Microsoft Teams channel
   - Copy Bot ID and Secret

### Step 3: Azure App Service Deployment
1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Deploy to Azure App Service**:
   ```bash
   az webapp create \
     --resource-group myResourceGroup \
     --plan myAppServicePlan \
     --name corgan-ai-chat \
     --runtime "node|18-lts"

   az webapp deployment source config-zip \
     --resource-group myResourceGroup \
     --name corgan-ai-chat \
     --src ./dist.zip
   ```

3. **Configure App Settings** with environment variables above

### Step 4: Teams App Package
1. **Update manifest variables**:
   Replace placeholders in `appPackage/manifest.json`:
   - `${{TEAMS_APP_ID}}` → Your Teams App ID
   - `${{BOT_ID}}` → Your Bot ID
   - `${{BOT_DOMAIN}}` → your-app-domain.azurewebsites.net
   - `${{APP_NAME_SUFFIX}}` → prod

2. **Create app package**:
   ```bash
   cd appPackage
   zip -r ../corgan-ai-chat.zip manifest.json color.png outline.png
   ```

### Step 5: Teams Admin Center Deployment

#### Option A: Org-wide Deployment (Admin)
1. Go to **Teams Admin Center** → **Teams apps** → **Manage apps**
2. Click **Upload custom app**
3. Upload `corgan-ai-chat.zip`
4. Set availability policies for users/groups

#### Option B: Side-loading (Developer)
1. Go to **Teams** → **Apps** → **Manage your apps**
2. Click **Upload a custom app**
3. Upload `corgan-ai-chat.zip`
4. Add to team or use personally

## App Features in Teams

### 🤖 Bot Conversations
- Direct message the bot in Teams
- Use in channels and group chats
- Full GPT-4 capabilities with context

### 📋 Chat History Tab
- Personal tab showing all conversations
- Search and filter chat history
- Direct access to past sessions

### 🎨 Image Generation
- Request images directly in chat
- FLUX.1-Kontext-pro powered generation
- Automatic thumbnail creation

## Security & Compliance

### 🔐 Data Privacy
- All conversations stored locally in app
- Azure OpenAI data processing policies apply
- No data shared with third parties

### 🛡️ Authentication
- Teams SSO integration
- Azure AD authentication
- Bot Framework security

### 📊 Monitoring
- Application Insights integration
- Bot Framework analytics
- Custom telemetry tracking

## Troubleshooting

### Common Issues

**Bot not responding**:
- Check Bot ID and password configuration
- Verify endpoint URL is accessible
- Review App Service logs

**Chat history not loading**:
- Check static file serving configuration
- Verify API endpoints are accessible
- Review CORS settings

**Image generation failing**:
- Verify FLUX API credentials
- Check Azure AI Services quotas
- Review image storage permissions

### Support Endpoints
- **Health Check**: `https://your-domain/health`
- **API Status**: `https://your-domain/api/status`
- **DevTools**: `https://your-domain/devtools` (development only)

## Scaling Considerations

### Performance
- Azure App Service scaling rules
- CDN for image assets
- Database optimization for chat history

### Costs
- Azure OpenAI usage-based pricing
- FLUX.1 generation costs
- App Service hosting fees

## Updates & Maintenance

### Version Updates
1. Update app version in `manifest.json`
2. Build and deploy new version
3. Update Teams app package
4. Notify users of new features

### Monitoring
- Set up Azure Monitor alerts
- Track API usage and costs
- Monitor bot conversation metrics

---

## 🎯 Ready for Production!

Your Corgan AI Chat app is fully prepared for Microsoft Teams deployment with enterprise-grade features:

✅ **Bot Framework Integration**
✅ **Azure OpenAI & FLUX.1 APIs**
✅ **Chat History Management**
✅ **Teams Tabs & Navigation**
✅ **Security & Compliance**
✅ **Scalable Architecture**

Deploy with confidence! 🚀