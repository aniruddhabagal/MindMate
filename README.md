# 🧠 MindMate

> A modern, privacy-first mental wellness companion that helps you take meaningful steps toward better mental health.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-mindmate.aniruddha.fyi-brightgreen)](https://mindmate.aniruddha.fyi)
[![Built with Next.js](https://img.shields.io/badge/Built%20with-Next.js-black)](https://nextjs.org/)
[![Styled with Tailwind](https://img.shields.io/badge/Styled%20with-Tailwind%20CSS-blue)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 🌟 Overview

MindMate is a comprehensive mental wellness platform designed with simplicity, privacy, and accessibility at its core. Built using modern web technologies, it provides users with practical tools for stress management, emotional awareness, and personal reflection without the friction of complex interfaces.

**🚀 Live Demo:** [mindmate.aniruddha.fyi](https://mindmate.aniruddha.fyi)


## ✨ Features

### Core Functionality
- **🎯 Advanced Mood Tracking** - Comprehensive mood logging with:
  - Visual trend charts with customizable time periods (7, 30, 90 days)
  - Mood streak tracking and statistics
  - Mood score analytics (1-10 scale)
  - Recent entries overview with emoji indicators
- **🧘 Interactive Breathing Exercises** - Guided breathing animation with:
  - 4-4-6-2 breathing pattern (inhale-hold-exhale-hold)
  - Visual circle animation for breathing guidance
  - Start/stop controls with smooth transitions
- **📝 Complete Journaling System** - Feature-rich journaling with:
  - Rich text entries with title and content
  - Daily writing prompts for inspiration
  - Full CRUD operations (Create, Read, Update, Delete)
  - Entry editing with confirmation modals
- **🤖 Advanced AI Chat Integration** - Powered by Google's Gemini AI:
  - Multi-session chat management
  - Session title editing and organization
  - Context-aware mental wellness responses
  - Crisis detection and professional help redirection
  - Credit-based usage system
- **👥 Admin Dashboard** - Comprehensive user management:
  - User listing with pagination
  - Credit management and role assignment
  - Blacklisting capabilities for moderation
  - Real-time user statistics

### Technical Features
- **🔐 JWT Authentication** - Secure token-based authentication system
- **🛡️ Middleware Protection** - Route-level security for API endpoints
- **📊 Data Visualization** - Chart.js integration for mood analytics
- **⚡ Real-time Updates** - Dynamic UI updates without page refreshes
- **🎨 Modern UI/UX** - Tailwind CSS with gradient backgrounds and animations
- **📱 Mobile-First Design** - Responsive layout with mobile-optimized components
- **🔧 Modular Architecture** - Clean separation of components and API logic

## 🛠️ Tech Stack

### Core Technologies
- **Framework:** Next.js 14+ (App Router)
- **Runtime:** React 18+
- **Styling:** Tailwind CSS + PostCSS
- **Language:** JavaScript (with JSX)
- **Authentication:** JWT with jose library
- **Database:** MongoDB (via connection models)
- **AI Integration:** Google Gemini API (@google/generative-ai)
- **Charts:** Chart.js for data visualization
- **Notifications:** react-hot-toast for user feedback
- **Linting:** ESLint with custom configurations
- **Package Manager:** npm / pnpm / yarn / bun

### Key Integrations
- **Google Gemini AI** - Advanced conversational AI for mental health support
- **Chart.js** - Interactive mood tracking visualizations
- **JWT Authentication** - Secure user sessions and API protection
- **MongoDB** - Persistent data storage for users, moods, and journal entries

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (LTS recommended)
- Package manager of choice (npm, pnpm, yarn, or bun)
- Git for version control

### Installation

```bash
# Clone the repository
git clone https://github.com/aniruddhabagal/MindMate.git
cd MindMate

# Install dependencies (choose one)
npm install
# or
pnpm install
# or
yarn install
# or
bun install

# Start the development server
npm run dev
# or
pnpm dev
# or
yarn dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### Environment Setup

Create a `.env.local` file in the project root:

```bash
# Basic Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=MindMate

# JWT Configuration (Required)
JWT_SECRET=your-super-secure-jwt-secret-key-here

# MongoDB Configuration (Required)
MONGODB_URI=mongodb://localhost:27017/mindmate
# or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mindmate

# Google Gemini AI Configuration (Required for Chat)
GEMINI_API_KEY=your-google-gemini-api-key-here

# Optional: Additional Configuration
NODE_ENV=development
```

> **Security Notes:** 
> - Never commit `.env*` files to version control
> - Use strong, unique JWT secrets in production
> - Store sensitive API keys securely

## 📁 Project Structure

```
MindMate/
├── app/                    # Next.js App Router (pages, layouts, API routes)
│   ├── admin/             # Admin dashboard page
│   │   └── page.js        # User management interface
│   ├── api/               # API routes
│   │   ├── admin/         # Admin-only endpoints
│   │   ├── auth/          # Authentication endpoints
│   │   ├── chat/          # AI chat functionality
│   │   ├── journal/       # Journal CRUD operations
│   │   └── moods/         # Mood tracking endpoints
│   ├── globals.css        # Global styles and animations
│   ├── layout.js          # Root layout component
│   └── page.js            # Main application page
├── components/            # Reusable UI components
│   ├── BreathingModal.js  # Interactive breathing exercise component
│   ├── ChatPage.js        # Multi-session chat interface
│   ├── ConfirmationModal.js # Reusable confirmation dialog
│   ├── Header.js          # Application header with user menu
│   ├── HomePage.js        # Dashboard with quick actions
│   ├── JournalPage.js     # Full-featured journaling interface
│   ├── Loader.js          # Loading spinner component
│   └── MoodTrackerPage.js # Analytics and mood visualization
├── lib/                  # Utility functions and configurations
│   ├── apiClient.js      # API communication functions
│   ├── formatters.js     # Date, mood, and data formatting
│   ├── geminiClient.js   # Google Gemini AI configuration
│   └── mongodb.js        # Database connection setup
├── models/               # MongoDB data schemas
│   ├── User.js           # User account model
│   ├── Mood.js           # Mood entry model
│   ├── Journal.js        # Journal entry model
│   └── ChatSession.js    # Chat session model
├── public/               # Static assets
│   ├── images/           # Image assets
│   └── favicon.ico       # Application icon
├── middleware.js         # JWT authentication middleware
├── next.config.mjs       # Next.js configuration
├── tailwind.config.js    # Tailwind CSS configuration
├── postcss.config.js     # PostCSS configuration
├── eslint.config.mjs     # ESLint configuration
├── package.json          # Dependencies and scripts
└── README.md             # This file
```

### Key Directories Explained

- **`app/`** - Next.js App Router with single-page application structure
- **`app/api/`** - RESTful API endpoints with JWT authentication middleware
- **`components/`** - Feature-complete UI components (Chat, Journal, Mood Tracker, etc.)
- **`lib/`** - Core utilities including API client, AI integration, and data formatting
- **`models/`** - MongoDB schemas for Users, Moods, Journal entries, and Chat sessions
- **`middleware.js`** - JWT verification and role-based access control

## 📜 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server on `http://localhost:3000` |
| `npm run build` | Build the application for production |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint to check code quality |
| `npm run lint:fix` | Run ESLint and automatically fix issues |
| `npm run type-check` | Run TypeScript compiler to check types |

## 🏗️ Development Guidelines

### Code Standards
- **Components:** Functional components with hooks-based state management
- **Styling:** Utility-first approach with Tailwind CSS classes
- **State Management:** React state with useCallback/useMemo for optimization
- **API Design:** RESTful endpoints with consistent error handling
- **Authentication:** JWT-based with middleware protection
- **Database:** MongoDB with proper schema validation

### Component Architecture
```javascript
// Example component structure
"use client"; // For client-side components

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";

export default function Component({ currentUser, apiClient, ...props }) {
  const [state, setState] = useState(initialValue);
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = useCallback(async () => {
    setIsLoading(true);
    try {
      // API call logic
      const result = await apiClient.someAPI();
      // Update state
      setState(result);
      toast.success("Action completed!");
    } catch (error) {
      console.error("Error:", error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [apiClient]);

  // Component JSX with proper loading states and error handling
  return (
    <div className="component-wrapper">
      {/* Component content */}
    </div>
  );
}
```

### API Endpoint Pattern
```javascript
// app/api/example/route.js
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Model from "@/models/Model";

export async function GET(request) {
  try {
    const userId = request.headers.get("x-user-id"); // Set by middleware
    await connectDB();
    
    const data = await Model.find({ userId });
    return NextResponse.json(data);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
```

## 🔮 Roadmap

### Planned Features
- [ ] **User Profile Management** - Complete profile editing and preferences
- [ ] **Data Export** - Export mood and journal data in various formats
- [ ] **Advanced Analytics** - Weekly/monthly mood reports and insights
- [ ] **Reminder System** - Customizable notifications for check-ins
- [ ] **Goal Setting** - Personal wellness goals with progress tracking
- [ ] **Community Features** - Anonymous peer support groups (optional)
- [ ] **Integration APIs** - Connect with fitness trackers and health apps
- [ ] **Offline Support** - Progressive Web App capabilities
- [ ] **Multi-language Support** - Internationalization (i18n)
- [ ] **Advanced AI Features** - Personalized recommendations and insights

### Technical Improvements
- [ ] **TypeScript Migration** - Gradual conversion to TypeScript
- [ ] **Enhanced Testing** - Unit and integration test coverage
- [ ] **Performance Monitoring** - Real-time performance metrics
- [ ] **Advanced Security** - Rate limiting and enhanced data protection
- [ ] **CI/CD Pipeline** - Automated testing and deployment
- [ ] **Docker Support** - Containerized deployment options
- [ ] **Database Optimization** - Indexing and query optimization
- [ ] **API Documentation** - OpenAPI/Swagger documentation

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### Getting Started
1. **Fork** the repository
2. **Clone** your fork locally
3. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
4. **Install** dependencies and run the development server
5. **Make** your changes following our coding standards
6. **Test** your changes thoroughly
7. **Commit** using conventional commit format
8. **Push** to your branch (`git push origin feature/amazing-feature`)
9. **Open** a Pull Request with a clear description

## 📚 Key Features Deep Dive

### 🎯 Mood Tracking System
- **Visual Analytics:** Interactive Chart.js graphs showing mood trends
- **Smart Statistics:** Automatic calculation of streaks, averages, and dominant moods
- **Flexible Timeframes:** View data for last 7, 30, or 90 days
- **Score-Based System:** 1-10 mood scoring with emoji representations

### 🤖 AI-Powered Chat
- **Google Gemini Integration:** Advanced conversational AI specifically trained for mental wellness
- **Multi-Session Management:** Organize conversations with editable titles
- **Crisis Detection:** Automatic detection of crisis language with professional help redirection
- **Context Awareness:** AI remembers conversation context within sessions
- **Credit System:** Usage-based system to manage AI costs

### 📝 Advanced Journaling
- **Rich Text Editor:** Title and content fields with formatting preservation
- **Writing Prompts:** Daily inspiration prompts to encourage reflection
- **Full CRUD Operations:** Create, read, update, and delete entries seamlessly
- **Confirmation System:** Safe deletion with confirmation modals

### 🧘 Breathing Exercises
- **4-4-6-2 Pattern:** Scientifically-backed breathing rhythm for relaxation
- **Visual Guidance:** Animated circle that scales with breathing phases
- **Smooth Animations:** CSS transitions for calming visual experience

### 👥 Admin Dashboard
- **User Management:** View and edit user accounts with pagination
- **Credit Management:** Adjust user credits and monitor usage
- **Role Assignment:** Promote users to admin or manage permissions
- **Moderation Tools:** Blacklist users who violate terms of service

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Aniruddha Bagal**
- GitHub: [@aniruddhabagal](https://github.com/aniruddhabagal)
- Portfolio: [aniruddha.fyi](https://aniruddha.fyi)

## 🙏 Acknowledgments

- Thanks to the mental health community for inspiration
- Next.js team for the amazing framework
- Tailwind CSS for the utility-first approach
- All contributors who help make MindMate better

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/aniruddhabagal/MindMate/issues) page
2. Create a new issue with detailed information
3. Join our community discussions
4. Contact the maintainer directly

---

<div align="center">

**Made with ❤️ by [Aniruddha Bagal](https://github.com/aniruddhabagal)**

*Building technology for better mental wellness, one commit at a time.*

</div>
