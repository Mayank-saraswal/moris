# 🌌 Moris

**Moris** is an advanced, AI-powered full-stack coding assistant that helps you seamlessly build, debug, and execute applications right from your browser. It elegantly combines a powerful conversational AI interface with a live coding workspace, intelligent artifact generation, real-time previews, and instant browser-based execution powered by WebContainers.

![Moris Screenshot](/public/screenshot.png)

## ✨ Features

- **🤖 Multi-Model AI Support**: Powered by leading LLMs including Claude 3.5 Sonnet, GPT-4o, Gemini, Groq, Mistral, and more through OpenRouter, Anthropic, Google, and OpenAI providers via Vercel AI SDK
- **🧠 Advanced Agentic Workflows**: Sophisticated AI agent orchestration using Inngest Agent Kit for planning, executing, and refining code with multi-step reasoning and tool execution
- **⚡ Native Browser Execution**: Full-stack Node.js environments running instantly in your browser via WebContainers API—zero backend infrastructure required
- **💬 Real-time Conversational Interface**: Stream AI responses with transparent reasoning, chain-of-thought visualization, and step-by-step tool execution tracking
- **🖥️ Integrated Development Environment**: Complete with xterm.js terminal, CodeMirror 6 editor with syntax highlighting for 20+ languages, minimap, and indentation markers
- **📂 Advanced File Management**: VS Code-like file explorer with drag-and-drop, rename, delete, and complex multi-file project handling
- **🌐 Live Preview**: Instant visual feedback with hot-reload as your web applications evolve alongside the chat interface
- **🐙 GitHub Integration**: One-click export and import of projects directly to/from GitHub repositories
- **🔐 Secure Authentication**: User management powered by Clerk with support for multiple auth providers
- **💾 Real-time Database**: Convex backend for instant data synchronization and serverless functions
- **🎨 Modern UI/UX**: Beautiful glassmorphic design with Tailwind CSS v4, Shadcn UI, Radix UI, and Motion (Framer Motion) animations
- **📊 Observability**: Integrated Sentry monitoring for error tracking and performance insights

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router), React 19, TypeScript 5
- **Styling**: Tailwind CSS v4, Shadcn UI, Radix UI, Lucide Icons
- **Animation**: Motion (Framer Motion v12)
- **Editor**: CodeMirror 6 with 20+ language support, minimap, and indentation markers
- **State Management**: Zustand, React Hook Form, TanStack Form
- **UI Components**: Radix UI primitives, CMDK, Sonner (toast notifications), Vaul (drawers)

### AI & Agentic System
- **AI SDK**: Vercel AI SDK v6
- **Model Providers**: 
  - OpenRouter (multi-model access)
  - Anthropic (Claude)
  - Google (Gemini)
  - OpenAI (GPT-4)
  - Groq, Mistral, Moonshot AI
- **Agent Orchestration**: Inngest Agent Kit v0.13
- **Streaming**: Streamdown with support for code, math, mermaid diagrams, and CJK languages

### Backend & Infrastructure
- **Database**: Convex (real-time, serverless)
- **Authentication**: Clerk
- **Storage**: Azure Blob Storage
- **Workflow Engine**: Inngest v3
- **Monitoring**: Sentry
- **API Client**: Ky (HTTP client)

### Development Environment
- **Browser Runtime**: WebContainers API
- **Terminal**: xterm.js v6 with fit addon
- **Code Execution**: In-browser Node.js environment
- **File System**: Virtual file system with binary file detection

### Additional Tools
- **GitHub Integration**: Octokit v5
- **Web Scraping**: Firecrawl
- **Syntax Highlighting**: Shiki
- **Date Handling**: date-fns
- **Layout**: Allotment (split panes), React Resizable Panels
- **Flow Diagrams**: XYFlow React

## ⚡ Getting Started

### Prerequisites

- Node.js 18+ or Node.js 20+ (recommended)
- npm or pnpm package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/moris.git
   cd moris
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory with the following configuration:

   ```env
   # Convex Database
   CONVEX_DEPLOYMENT=your_deployment_name
   NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
   MORIS_CONVEX_INTERNAL_KEY=your_convex_internal_key

   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
   CLERK_SECRET_KEY=sk_test_xxxxx

   # AI Model Providers (configure at least one)
   OPENROUTER_API_KEY=sk-or-xxxxx
   ANTHROPIC_API_KEY=sk-ant-xxxxx
   OPENAI_API_KEY=sk-xxxxx
   GOOGLE_GENERATIVE_AI_API_KEY=xxxxx
   
   # Inngest Workflow Engine
   INNGEST_EVENT_KEY=your_inngest_event_key
   INNGEST_SIGNING_KEY=signkey-xxxxx

   # Azure Blob Storage (optional, for file storage)
   AZURE_STORAGE_CONNECTION_STRING=your_connection_string

   # Firecrawl (optional, for web scraping)
   FIRECRAWL_API_KEY=fc-xxxxx

   # Sentry (optional, for error monitoring)
   SENTRY_AUTH_TOKEN=your_sentry_token
   ```

4. **Set up Convex**
   ```bash
   npx convex dev
   ```
   This will initialize your Convex backend and provide you with the deployment URL and keys.

5. **Run the development servers**
   
   You need to run three processes concurrently (use separate terminal windows/tabs):

   ```bash
   # Terminal 1: Next.js development server
   npm run dev

   # Terminal 2: Convex backend (if not already running)
   npx convex dev

   # Terminal 3: Inngest development server
   npx inngest-cli@latest dev
   ```

6. **Access the application**
   
   Open your browser and navigate to `http://localhost:3000`

### Quick Start Guide

1. Sign up or log in using Clerk authentication
2. Create a new project or start a conversation
3. Ask the AI to build something (e.g., "Create a React todo app")
4. Watch as the AI generates code, creates files, and sets up the project
5. Use the integrated terminal to run commands
6. Preview your application in real-time
7. Export to GitHub when ready

## 📁 Project Structure

```
moris/
├── src/
│   ├── app/              # Next.js app router pages and API routes
│   ├── components/       # Reusable UI components
│   │   ├── ai-elements/  # AI-specific components (chat, artifacts, etc.)
│   │   ├── landing/      # Landing page components
│   │   └── ui/           # Base UI components (Shadcn)
│   ├── features/         # Feature-based modules
│   │   ├── auth/         # Authentication logic
│   │   ├── conversations/# Chat and messaging
│   │   ├── editor/       # Code editor integration
│   │   ├── preview/      # Live preview functionality
│   │   ├── projects/     # Project management
│   │   └── terminal/     # Terminal integration
│   ├── hooks/            # Custom React hooks
│   ├── inngest/          # Inngest functions and workflows
│   └── lib/              # Utility functions and configurations
├── convex/               # Convex backend schema and functions
├── public/               # Static assets
└── .agents/              # AI agent skills and configurations
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
