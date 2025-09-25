import { App } from '@microsoft/teams.apps';
import { DevtoolsPlugin } from '@microsoft/teams.dev';
import OpenAI from 'openai';
import { DefaultAzureCredential } from '@azure/identity';
import * as fs from 'fs';
import * as path from 'path';
import { createCanvas, loadImage } from 'canvas';
import cors from 'cors';
import ChatHistory, { ChatMessage, ChatSession } from './chatHistory';

// Configure Azure OpenAI GPT-4 client
const gptApiKey = process.env.AZURE_OPENAI_API_KEY!;
const gptApiVersion = process.env.AZURE_OPENAI_API_VERSION || "2025-01-01-preview";
const gptEndpoint = process.env.AZURE_OPENAI_ENDPOINT!;
const gptDeployment = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-4";

const gptClient = new OpenAI({
  apiKey: gptApiKey,
  baseURL: `${gptEndpoint}openai/deployments/${gptDeployment}`,
  defaultQuery: { 'api-version': gptApiVersion },
  defaultHeaders: {
    'api-key': gptApiKey,
  },
});

// Configure FLUX.1-Kontext-pro image generation client
const fluxApiKey = process.env.FLUX_API_KEY!;
const fluxApiVersion = process.env.FLUX_API_VERSION || "2025-04-01-preview";
const fluxEndpoint = process.env.FLUX_ENDPOINT!;
const fluxDeployment = process.env.FLUX_DEPLOYMENT_NAME || "FLUX.1-Kontext-pro";

const fluxClient = new OpenAI({
  apiKey: fluxApiKey,
  baseURL: `${fluxEndpoint}openai/deployments/${fluxDeployment}`,
  defaultQuery: { 'api-version': fluxApiVersion },
  defaultHeaders: {
    'api-key': fluxApiKey,
  },
});

// Function to create thumbnail from full image
async function createThumbnail(fullImagePath: string): Promise<string> {
  try {
    const image = await loadImage(fullImagePath);
    const canvas = createCanvas(256, 256);
    const ctx = canvas.getContext('2d');

    // Calculate aspect ratio to maintain proportions
    const aspectRatio = image.width / image.height;
    let drawWidth = 256;
    let drawHeight = 256;

    if (aspectRatio > 1) {
      drawHeight = 256 / aspectRatio;
    } else {
      drawWidth = 256 * aspectRatio;
    }

    const offsetX = (256 - drawWidth) / 2;
    const offsetY = (256 - drawHeight) / 2;

    // Fill background with white
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 256, 256);

    // Draw the resized image
    ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);

    // Save thumbnail
    const thumbnailPath = fullImagePath.replace('.png', '_thumb.png');
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(thumbnailPath, buffer);

    console.log(`[DEBUG] Thumbnail created: ${thumbnailPath}`);
    return thumbnailPath;
  } catch (error) {
    console.error('[ERROR] Thumbnail creation failed:', error);
    throw error;
  }
}

// Image generation function using Azure AI FLUX format from playground
async function generateImage(prompt: string, inputImageUrl?: string): Promise<{fullImageUrl: string, thumbnailUrl: string}> {
  try {
    console.log(`[DEBUG] Generating image with FLUX.1-Kontext-pro: "${prompt}"`);

    // Use exact format from Azure AI playground
    const generationsPath = `openai/deployments/${fluxDeployment}/images/generations`;
    const params = `?api-version=${fluxApiVersion}`;
    const generationsUrl = `${fluxEndpoint}${generationsPath}${params}`;

    const requestBody: any = {
      prompt: prompt,
      n: 1,
      size: "1024x1024",  // Back to full size
      output_format: "png"
    };

    // If inputImageUrl is provided, this is an image-to-image request
    if (inputImageUrl) {
      console.log(`[DEBUG] Image-to-image mode with input: ${inputImageUrl}`);
      requestBody.image = inputImageUrl;
    }

    console.log(`[DEBUG] FLUX request URL: ${generationsUrl}`);
    console.log(`[DEBUG] FLUX request body:`, JSON.stringify(requestBody, null, 2));

    const response = await fetch(generationsUrl, {
      method: 'POST',
      headers: {
        'Api-Key': fluxApiKey,  // Note: Capital 'A' in 'Api-Key' as per playground
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[ERROR] FLUX API Error (${response.status}):`, errorText);
      throw new Error(`FLUX API Error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log(`[DEBUG] FLUX response:`, JSON.stringify(result, null, 2));

    // Handle b64_json response format from playground sample
    if (result.data && result.data[0]) {
      if (result.data[0].b64_json) {
        // Convert base64 to PNG file and serve it
        const base64Data = result.data[0].b64_json;
        const timestamp = Date.now();
        const filename = `flux_image_${timestamp}.png`;
        const filepath = path.join(process.cwd(), 'generated_images', filename);

        // Create directory if it doesn't exist
        const dir = path.dirname(filepath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        // Convert base64 to buffer and save as PNG
        const imageBuffer = Buffer.from(base64Data, 'base64');
        fs.writeFileSync(filepath, imageBuffer);

        // Create thumbnail with error handling
        let thumbnailPath = filepath; // Fallback to full image
        let thumbnailFilename = filename;

        try {
          thumbnailPath = await createThumbnail(filepath);
          thumbnailFilename = path.basename(thumbnailPath);
        } catch (thumbnailError) {
          console.error('[WARN] Thumbnail creation failed, using full image:', thumbnailError);
        }

        // Return both full image and thumbnail URLs on image server port
        const fullImageUrl = `http://localhost:${IMAGE_SERVER_PORT}/images/${filename}`;
        const thumbnailUrl = `http://localhost:${IMAGE_SERVER_PORT}/images/${thumbnailFilename}`;

        console.log(`[DEBUG] Full image saved to: ${filepath}`);
        console.log(`[DEBUG] Thumbnail saved to: ${thumbnailPath}`);
        console.log(`[DEBUG] Full image available at: ${fullImageUrl}`);
        console.log(`[DEBUG] Thumbnail available at: ${thumbnailUrl}`);

        return { fullImageUrl, thumbnailUrl };
      } else if (result.data[0].url) {
        console.log(`[DEBUG] Image generated successfully (URL format): ${result.data[0].url}`);
        // For URL format, we can't create thumbnails easily, so return the same URL for both
        return { fullImageUrl: result.data[0].url, thumbnailUrl: result.data[0].url };
      }
    }

    throw new Error('No image data returned from FLUX.1-Kontext-pro');
  } catch (error) {
    console.error('[ERROR] FLUX.1-Kontext-pro image generation failed:', error);
    throw error;
  }
}

// Function to detect if user wants image generation
function shouldGenerateImage(text: string): { shouldGenerate: boolean; prompt?: string; isImageToImage?: boolean } {
  const imageKeywords = [
    'generate image', 'create image', 'make image', 'draw', 'paint', 'illustrate',
    'show me', 'create picture', 'generate picture', 'make picture',
    'image of', 'picture of', 'photo of', 'illustration of'
  ];

  const imageToImageKeywords = [
    'modify image', 'edit image', 'change image', 'update image', 'transform image',
    'alter image', 'improve image', 'enhance image'
  ];

  const lowerText = text.toLowerCase();

  // Check for image-to-image keywords first
  const isImageToImage = imageToImageKeywords.some(keyword => lowerText.includes(keyword));
  if (isImageToImage) {
    return { shouldGenerate: true, prompt: text, isImageToImage: true };
  }

  // Check for regular image generation
  const shouldGenerate = imageKeywords.some(keyword => lowerText.includes(keyword));
  if (shouldGenerate) {
    return { shouldGenerate: true, prompt: text, isImageToImage: false };
  }

  return { shouldGenerate: false };
}

const app = new App({
  plugins: [new DevtoolsPlugin()],
});

// Add static file serving and API server
import express from 'express';
const webServer = express();
const WEB_SERVER_PORT = 3981;
const IMAGE_SERVER_PORT = 3980;

// Middleware
webServer.use(cors());
webServer.use(express.json());

// Serve static files
webServer.use('/images', express.static(path.join(process.cwd(), 'generated_images')));
webServer.use('/', express.static(path.join(__dirname, 'web')));

// API Routes for chat sessions
webServer.get('/api/sessions', (req, res) => {
  try {
    const sessions = ChatHistory.getAllSessions();
    const sessionSummaries = sessions.map(session => ({
      id: session.id,
      title: session.title,
      updatedAt: session.updatedAt,
      messageCount: session.messageCount
    }));
    res.json(sessionSummaries);
  } catch (error) {
    console.error('[ERROR] Failed to get sessions:', error);
    res.status(500).json({ error: 'Failed to get sessions' });
  }
});

webServer.get('/api/sessions/search', (req, res) => {
  try {
    const query = req.query.q as string;
    if (!query) {
      return res.json([]);
    }

    const sessions = ChatHistory.searchSessions(query);
    const sessionSummaries = sessions.map(session => ({
      id: session.id,
      title: session.title,
      updatedAt: session.updatedAt,
      messageCount: session.messageCount
    }));
    res.json(sessionSummaries);
  } catch (error) {
    console.error('[ERROR] Failed to search sessions:', error);
    res.status(500).json({ error: 'Failed to search sessions' });
  }
});

webServer.get('/api/sessions/:id', (req, res) => {
  try {
    const session = ChatHistory.loadSession(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json(session);
  } catch (error) {
    console.error('[ERROR] Failed to get session:', error);
    res.status(500).json({ error: 'Failed to get session' });
  }
});

webServer.post('/api/sessions', (req, res) => {
  try {
    const { title } = req.body;
    const session = ChatHistory.createSession(title);
    res.json(session);
  } catch (error) {
    console.error('[ERROR] Failed to create session:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

webServer.delete('/api/sessions/:id', (req, res) => {
  try {
    const success = ChatHistory.deleteSession(req.params.id);
    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Session not found' });
    }
  } catch (error) {
    console.error('[ERROR] Failed to delete session:', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

// Message handling endpoint
webServer.post('/api/sessions/:id/messages', async (req, res) => {
  try {
    const { content, role } = req.body;
    const sessionId = req.params.id;

    // Add user message
    const session = ChatHistory.addMessage(sessionId, {
      role: role,
      content: content,
      type: 'text'
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Generate AI response
    const assistantMessage = await generateAIResponse(content, session);

    // Add assistant message
    const updatedSession = ChatHistory.addMessage(sessionId, assistantMessage);

    res.json({
      session: updatedSession,
      assistantMessage: assistantMessage
    });
  } catch (error) {
    console.error('[ERROR] Failed to send message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Separate image server (keep for backward compatibility)
const imageServer = express();
imageServer.use('/images', express.static(path.join(process.cwd(), 'generated_images')));

// Start the servers
webServer.listen(WEB_SERVER_PORT, () => {
  console.log(`🌐 Web server running on http://localhost:${WEB_SERVER_PORT}`);
  console.log(`💬 Chat interface: http://localhost:${WEB_SERVER_PORT}`);
});

imageServer.listen(IMAGE_SERVER_PORT, () => {
  console.log(`📸 Image server running on http://localhost:${IMAGE_SERVER_PORT}/images`);
});

// AI Response generation function
async function generateAIResponse(userMessage: string, session: ChatSession): Promise<ChatMessage> {
  // Check if this is an image generation request
  const imageRequest = shouldGenerateImage(userMessage);

  if (imageRequest.shouldGenerate) {
    // Generate image using existing logic
    try {
      // First, let GPT-4 improve the prompt
      const promptImproveResponse = await gptClient.chat.completions.create({
        model: gptDeployment,
        messages: [
          {
            role: 'system',
            content: `You are an expert at writing image generation prompts. Your task is to take a user's image request and create a detailed, vivid prompt that will produce the best possible image.

              Rules:
              1. Keep the core intent of the user's request
              2. Add artistic details, style, lighting, composition details
              3. Be descriptive but concise (under 200 words)
              4. Don't add explanations, just return the improved prompt
              5. If it's an image-to-image request, focus on the modifications requested`
          },
          {
            role: 'user',
            content: imageRequest.isImageToImage
              ? `Improve this image modification request: "${userMessage}"`
              : `Improve this image generation prompt: "${userMessage}"`
          }
        ],
        max_tokens: 300,
        temperature: 0.7
      });

      const improvedPrompt = promptImproveResponse.choices[0]?.message?.content || userMessage;
      const { fullImageUrl, thumbnailUrl } = await generateImage(improvedPrompt);

      return {
        id: '',
        role: 'assistant',
        content: `🖼️ **Here's your generated image!**\n\n**Original request:** ${userMessage}\n**Enhanced prompt:** ${improvedPrompt}\n\n✨ **Created by FLUX.1-Kontext-pro**`,
        timestamp: new Date(),
        type: 'image',
        imageUrl: fullImageUrl,
        thumbnailUrl: thumbnailUrl
      };
    } catch (error) {
      console.error('[ERROR] Image generation failed:', error);
      return {
        id: '',
        role: 'assistant',
        content: '❌ I apologize, but I encountered an error while generating your image. Please try again with a different prompt.',
        timestamp: new Date(),
        type: 'text'
      };
    }
  } else {
    // Generate text response using GPT-4
    try {
      // Build conversation context
      const messages: any[] = [
        {
          role: 'system',
          content: `You are Corgan, a helpful AI assistant integrated with Microsoft Teams. You are knowledgeable, friendly, and concise in your responses.

            IMPORTANT: You can also generate images! When users want images, tell them to use phrases like:
            - "generate image of..."
            - "create picture of..."
            - "draw me..."
            - "show me an image of..."
            - "illustrate..."

            For image modifications, they can say:
            - "modify image..."
            - "edit image..."
            - "change image..."
            - "transform image..."`
        }
      ];

      // Add recent conversation history for context (last 10 messages)
      const recentMessages = session.messages.slice(-10).filter(m => m.role !== 'system');
      recentMessages.forEach(msg => {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      });

      // Add current user message
      messages.push({
        role: 'user',
        content: userMessage
      });

      const response = await gptClient.chat.completions.create({
        model: gptDeployment,
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7
      });

      const aiResponse = response.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';

      return {
        id: '',
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
        type: 'text'
      };
    } catch (error) {
      console.error('[ERROR] GPT-4 response failed:', error);
      return {
        id: '',
        role: 'assistant',
        content: 'I apologize, but I encountered an error while processing your request. Please try again.',
        timestamp: new Date(),
        type: 'text'
      };
    }
  }
}

app.on('message', async ({ send, activity }) => {
  await send({ type: 'typing' });

  try {
    console.log(`[DEBUG] Received message: "${activity.text}"`);

    const userMessage = activity.text || '';
    const imageRequest = shouldGenerateImage(userMessage);

    // Check if this is an image generation request
    if (imageRequest.shouldGenerate) {
      console.log(`[DEBUG] Image generation requested: ${imageRequest.isImageToImage ? 'Image-to-image' : 'Text-to-image'}`);

      try {
        // First, let GPT-4 improve the prompt for better image generation
        const promptImproveResponse = await gptClient.chat.completions.create({
          model: gptDeployment,
          messages: [
            {
              role: 'system',
              content: `You are an expert at writing image generation prompts. Your task is to take a user's image request and create a detailed, vivid prompt that will produce the best possible image.

              Rules:
              1. Keep the core intent of the user's request
              2. Add artistic details, style, lighting, composition details
              3. Be descriptive but concise (under 200 words)
              4. Don't add explanations, just return the improved prompt
              5. If it's an image-to-image request, focus on the modifications requested`
            },
            {
              role: 'user',
              content: imageRequest.isImageToImage
                ? `Improve this image modification request: "${userMessage}"`
                : `Improve this image generation prompt: "${userMessage}"`
            }
          ],
          max_tokens: 300,
          temperature: 0.7
        });

        const improvedPrompt = promptImproveResponse.choices[0]?.message?.content || userMessage;
        console.log(`[DEBUG] GPT-4 improved prompt: "${improvedPrompt}"`);

        // Generate the image using FLUX.1-Kontext-pro
        await send('🎨 Generating your image with FLUX.1-Kontext-pro...');

        const { fullImageUrl, thumbnailUrl } = await generateImage(improvedPrompt);

        // Send the thumbnail for DevTools display with link to full image
        await send({
          type: 'message',
          text: `🖼️ **Here's your generated image!**\n\n**Original request:** ${userMessage}\n**Enhanced prompt:** ${improvedPrompt}\n\n📸 **Thumbnail (click for full size):** [View Full Image](${fullImageUrl})\n\n✨ **Created by FLUX.1-Kontext-pro**`,
          attachments: [{
            contentType: 'image/png',
            contentUrl: thumbnailUrl,
            name: 'FLUX Generated Image Thumbnail'
          }]
        });

        console.log(`[SUCCESS] 🎨 Image generated and saved successfully!`);
        console.log(`[DEBUG] Full image sent at: ${fullImageUrl}`);

      } catch (imageError) {
        console.error('[ERROR] Image generation failed:', imageError);
        await send('❌ I apologize, but I encountered an error while generating your image. Please try again with a different prompt.');
      }

    } else {
      // Regular GPT-4 chat response
      const response = await gptClient.chat.completions.create({
        model: gptDeployment,
        messages: [
          {
            role: 'system',
            content: `You are Corgan, a helpful AI assistant integrated with Microsoft Teams. You are knowledgeable, friendly, and concise in your responses.

            IMPORTANT: You can also generate images! When users want images, tell them to use phrases like:
            - "generate image of..."
            - "create picture of..."
            - "draw me..."
            - "show me an image of..."
            - "illustrate..."

            For image modifications, they can say:
            - "modify image..."
            - "edit image..."
            - "change image..."
            - "transform image..."`
          },
          {
            role: 'user',
            content: userMessage
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      });

      const aiResponse = response.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';
      console.log(`[DEBUG] GPT-4 Response: "${aiResponse}"`);
      await send(aiResponse);
    }

  } catch (error) {
    console.error('Error in message processing:', error);
    await send('I apologize, but I encountered an error while processing your request. Please try again.');
  }
});

(async () => {
  console.log('🚀 Starting Corgan AI Chat with DevTools, GPT-4, and FLUX.1-Kontext-pro...');
  console.log('💬 GPT-4 Chat: Ready for conversations');
  console.log('🎨 FLUX.1-Kontext-pro: Ready for image generation');
  console.log('🛠️ DevTools: http://localhost:3979/devtools');
  console.log('🌐 Chat History Interface: http://localhost:3981');
  await app.start(process.env.PORT || 3978);
})();
