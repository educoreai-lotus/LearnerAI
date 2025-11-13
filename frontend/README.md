# LearnerAI Frontend

React + Vite frontend for the LearnerAI microservice.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Create .env file from template
cp env.template .env

# Edit .env and set:
# VITE_API_URL=http://localhost:5000
```

### Development

```bash
# Start dev server
npm run dev

# The app will open at http://localhost:5173
```

### Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/      # Reusable UI components
│   │   ├── Header.jsx
│   │   ├── PrimaryButton.jsx
│   │   ├── Card.jsx
│   │   ├── UserCard.jsx
│   │   ├── LearningPathTimeline.jsx
│   │   └── LoadingSpinner.jsx
│   ├── pages/           # Page components
│   │   ├── CompanyDashboard.jsx
│   │   └── UserView.jsx
│   ├── hooks/           # Custom React hooks
│   │   └── useTheme.js
│   ├── services/        # API services
│   │   └── api.js
│   └── App.jsx          # Main app component
├── index.css            # Tailwind CSS + global styles
├── tailwind.config.js   # Tailwind configuration
└── vite.config.js       # Vite configuration
```

## 🎨 Design System

### Colors
- **Emerald Brand**: Primary brand colors (emeraldbrand-50 to emeraldbrand-900)
- **Gold Brand**: Accent colors (goldbrand-400, goldbrand-500)
- **Theme-aware**: Background and text colors adapt to light/dark mode

### Components
- **Header**: Fixed header with logo, navigation, and theme toggle
- **PrimaryButton**: Reusable button with variants (primary, secondary, accent)
- **Card**: Card component with gradient and shadow
- **UserCard**: User information card for dashboard
- **LearningPathTimeline**: Vertical timeline for learning paths

## 🌓 Theme Support

The app supports both Light and Dark modes:
- Theme toggle in header
- Theme preference saved in localStorage
- All components use theme-aware colors

## 🔌 API Integration

All API calls are handled through `src/services/api.js`:
- Learning paths
- Jobs
- Companies
- Approvals
- Completions
- Suggestions

## 📱 Pages

### Company Dashboard
- View all users in a company
- Search and filter users
- View learning paths per user
- Expandable user cards

### User View
- Course selection dropdown
- Learning path timeline display
- Step-by-step path visualization

## 🛠️ Development

### Adding New Components

1. Create component in `src/components/`
2. Use Tailwind CSS classes
3. Support light/dark mode
4. Follow design system guidelines

### Adding New Pages

1. Create page in `src/pages/`
2. Import and use Header component
3. Use Card and other reusable components
4. Integrate with API service

## 📝 Environment Variables

Create `.env` file:
```env
VITE_API_URL=http://localhost:5000
VITE_API_VERSION=v1
VITE_RAILWAY_ASSET_KEY=your_key
VITE_ENV=development
```

## 🚢 Deployment

Deploy to Vercel:
1. Connect GitHub repository
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push

---

**Status**: ✅ Frontend UI Complete
**Next**: Connect to backend API and test end-to-end

