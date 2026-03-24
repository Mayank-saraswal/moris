# Moris

**Moris** is an advanced AI-powered full-stack coding assistant that helps you build, debug, and deploy applications directly from your browser. It combines a powerful chat interface with a live coding environment, real-time preview, and instant deployment capabilities.



## 🚀 Features

- **🤖 AI Coding Assistant**: Powered by advanced LLMs (Claude 3.5 Sonnet, GPT-4o, DeepSeek R1, etc.) to understand your intent and write code.
- **⚡ WebContainer Execution**: Run Node.js full-stack applications directly in your browser with zero server overhead.
- **🧠 Real-time Thinking**: Visualize the AI's reasoning process and tool usage in real-time as it works on your tasks.
- **🖥️ Integrated Terminal**: Full-featured xterm.js terminal for running commands, installing packages, and managing your app.
- **📂 File Management**: Create, edit, rename, and delete files with a VS Code-like file explorer.
- **👀 Live Preview**: Instant preview of your web application as you build it.
- **🐙 GitHub Integration**: Export your generated projects directly to GitHub with a single click.
- **🎨 Beautiful UI**: Modern, responsive interface built with Tailwind CSS v4 and Framer Motion.

## 🛠️ Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4, Shadcn UI, Radix UI, Lucide Icons
- **State Management**: Convex (Real-time DB), Zustand
- **AI & Agents**: Vercel AI SDK, Inngest (Agentic Workflows), OpenRouter
- **Execution Environment**: WebContainers API
- **Editor**: CodeMirror 6 with language support
- **Auth**: Clerk

## ⚡ Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/moris.git
    cd moris
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    Create a `.env.local` file in the root directory and add the following keys:

    ```env
    # Convex
    CONVEX_DEPLOYMENT=
    NEXT_PUBLIC_CONVEX_URL=
    MORIS_CONVEX_INTERNAL_KEY=your_secret_key

    # Clerk Auth
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
    CLERK_SECRET_KEY=

    # AI Providers (OpenRouter is recommended)
    OPENROUTER_API_KEY=
    
    # Inngest
    INNGEST_EVENT_KEY=
    INNGEST_SIGNING_KEY=
    ```

4.  **Run the development server**
    You need to run three processes (concurrently or in separate terminals):

    ```bash
    # 1. Next.js App
    npm run dev

    # 2. Convex Backend
    npx convex dev

    # 3. Inngest Dev Server
    npx inngest-cli@latest dev
    ```

5.  **Open the App**
    Visit `http://localhost:3000` to start building!

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the repository
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
