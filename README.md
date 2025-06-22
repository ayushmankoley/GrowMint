# 🌱 GrowMint - AI-Powered Business Growth Platform

<div align="center">

![GrowMint Logo](https://img.shields.io/badge/GrowMint-AI%20Business%20Platform-green?style=for-the-badge&logo=leaf)

[![React](https://img.shields.io/badge/React-18.3.1-blue?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.3.5-purple?style=flat-square&logo=vite)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green?style=flat-square&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.1-blue?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)

**Transform your business ideas into reality with AI-powered tools for sales, marketing, and intelligent project management.**

[Live Demo](https://your-demo-url.com) • [Documentation](#documentation) • [Contributing](#contributing)

</div>

---

## 🚀 Features

### 🎯 **Sales Engine**
- **Pitch Deck Generator** - Create professional presentations with AI
- **Cold Email Templates** - Personalized outreach campaigns
- **Lead Qualification** - Smart lead scoring and management
- **Sales Analytics** - Track performance and conversion rates

### 📈 **Marketing Engine**
- **Content Repurposer** - Transform long-form content into micro-content
- **Marketing Email Generator** - Craft compelling promotional emails
- **SEO Assistant** - Generate keywords, meta tags, and SEO outlines
- **A/B Test Ideas** - Suggest variations for copy, layout, and CTAs
- **Newsletter Generator** - Professional email newsletters
- **Campaign Idea Generator** - Creative campaign concepts with CTAs

### 🧠 **Context Engine**
- **Intelligent Conversations** - AI-powered project discussions
- **Project Context Management** - Upload documents, URLs, and text
- **Persona-Based Responses** - Tailored AI responses based on user roles
- **Chat History** - Persistent conversation management
- **Smart Context Indicators** - Visual feedback on available context

### 🔐 **Authentication & Security**
- **Civic Auth Integration** - Secure blockchain-based authentication
- **User Profiles** - Personalized user experience
- **Role-Based Access** - Different user personas and permissions
- **Data Privacy** - Secure data handling and storage

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Framer Motion
- **Backend**: Supabase (Database, Auth, Storage)
- **AI**: Google Gemini API
- **Authentication**: Civic Auth
- **Deployment**: Netlify
- **Icons**: Lucide React
- **Markdown**: React Markdown

## 📦 Installation

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Supabase Account** ([Create one here](https://supabase.com))
- **Google AI Studio Account** ([Get API key here](https://aistudio.google.com/apikey))
- **Civic Auth Account** ([Sign up here](https://civic.com))

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/growmint.git
cd growmint
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env.local` file in the project root:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Gemini AI
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_GEMINI_API_KEY_BACKUP=your_backup_gemini_api_key

# Civic Auth
VITE_CIVIC_CLIENT_ID=your_civic_client_id
```

### 4. Database Setup

#### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** → **New Query**
3. Copy and run the contents of `database_changes.sql`
4. Copy and run the contents of `context_engine_schema.sql`

#### Option B: Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login and link project
supabase login
supabase link --project-ref your-project-ref

# Apply migrations
supabase db push
```

### 5. Storage Setup

1. In Supabase Dashboard, go to **Storage**
2. Create a new bucket named `project-files`
3. Set bucket to public for easier file access

### 6. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:5173` to see the application running!

## 🔧 Configuration

### Gemini API Setup

1. Visit [Google AI Studio](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Add the key to your `.env.local` file

**Features enabled:**
- Website content scraping and analysis
- AI-powered content generation
- Intelligent project context understanding

### Civic Auth Setup

1. Register at [Civic Auth](https://civic.com)
2. Create a new application
3. Get your Client ID
4. Add to `.env.local` file

**Benefits:**
- Secure blockchain-based authentication
- No traditional passwords required
- Enhanced user privacy and security

## 📁 Project Structure

```
growmint/
├── public/                 # Static assets
├── src/
│   ├── components/        # React components
│   │   ├── ContextEngine.tsx
│   │   ├── MarketingTools.tsx
│   │   ├── SalesTools.tsx
│   │   └── ...
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility libraries
│   ├── pages/            # Page components
│   └── types/            # TypeScript type definitions
├── database_changes.sql   # Main database schema
├── context_engine_schema.sql  # Context engine tables
├── package.json
└── README.md
```

## 🚀 Deployment

### Netlify Deployment

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Deploy to Netlify:**
   - Connect your GitHub repository to Netlify
   - Set build command: `npm run build`
   - Set publish directory: `dist`
   - Add environment variables in Netlify dashboard

3. **Configure redirects:**
   The `netlify.toml` file is already configured for SPA routing.

### Manual Deployment

```bash
# Build for production
npm run build

# Preview the build
npm run preview
```

## 📖 Documentation

- **[Database Setup Guide](DATABASE_SETUP.md)** - Detailed database configuration
- **[Gemini API Setup](SETUP_GEMINI.md)** - AI integration guide
- **[Civic Auth Integration](CIVIC_AUTH_INTEGRATION.md)** - Authentication setup

## 🎯 Usage

### Creating Your First Project

1. **Sign in** using Civic Auth
2. **Create a Project** from the dashboard
3. **Add Context** - Upload documents, URLs, or text
4. **Start Generating** - Use Sales or Marketing tools
5. **Chat with AI** - Use Context Engine for project discussions

### Using AI Tools

#### Sales Engine
- Generate professional pitch decks
- Create personalized cold email templates
- Qualify leads with AI assistance

#### Marketing Engine
- Repurpose content across platforms
- Generate marketing emails for mass distribution
- Create SEO-optimized content
- Generate A/B test variations

#### Context Engine
- Have intelligent conversations about your projects
- Get AI advice based on your uploaded context
- Maintain conversation history
- Use different personas for varied perspectives

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines

- Follow TypeScript best practices
- Use Tailwind CSS for styling
- Write meaningful commit messages
- Test your changes thoroughly
- Update documentation as needed

## 🐛 Known Issues

- **Context Loading**: First-time context loading may take a few seconds
- **File Upload**: Large files (>5MB) may take longer to process
- **AI Generation**: Rate limits may apply during high usage

## 🔄 Changelog

### v1.0.0 (Current)
- ✅ Complete Sales Engine with pitch deck generation
- ✅ Full Marketing Engine with 6 AI tools
- ✅ Context Engine with intelligent conversations
- ✅ Civic Auth integration
- ✅ Supabase database integration
- ✅ Responsive design with Tailwind CSS

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Gemini AI** for powerful AI capabilities
- **Supabase** for backend infrastructure
- **Civic** for secure authentication
- **Tailwind CSS** for beautiful styling
- **React Community** for excellent ecosystem

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/growmint/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/growmint/discussions)
- **Email**: support@growmint.com

---

<div align="center">

**Made with ❤️ by the GrowMint Team**

[⭐ Star this repo](https://github.com/yourusername/growmint) • [🍴 Fork it](https://github.com/yourusername/growmint/fork) • [📢 Share it](https://twitter.com/intent/tweet?text=Check%20out%20GrowMint%20-%20AI-Powered%20Business%20Growth%20Platform!&url=https://github.com/yourusername/growmint)

</div> 