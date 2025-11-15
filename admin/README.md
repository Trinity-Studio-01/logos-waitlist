# LogosAI Waitlist Admin Dashboard

A modern, full-featured admin dashboard for managing LogosAI waitlist signups. Built with React, React Router, Tailwind CSS, and Recharts.

## Features

### 📊 Dashboard
- Overview statistics (Total, Monthly, Weekly, Daily signups)
- 7-day trend chart
- Recent signups feed
- Quick export functionality

### 👥 Waitlist Management
- Complete list of all signups
- Search by name, email, or church
- Filter by time period (Today, This Week, This Month, All Time)
- Real-time data refresh
- CSV export

### 📈 Analytics
- Monthly signup trends (Line & Bar charts)
- Growth rate calculation
- Church distribution (Pie chart)
- Top churches breakdown
- 6-month historical data

### ⚙️ Settings
- Email notification preferences
- API key management
- Auto-export configuration
- Export format selection (CSV, JSON, Excel)

## Navigation Structure

- **Dashboard** (`/`) - Home page with overview stats and charts
- **Waitlist** (`/waitlist`) - Full table with search and filters
- **Analytics** (`/analytics`) - Detailed charts and insights
- **Settings** (`/settings`) - Configuration options

## Tech Stack

- **React 18** - UI library
- **React Router v6** - Client-side routing
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **Lucide React** - Icons

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- LogosAI server running on port 3000

### Installation

```bash
cd admin
npm install
```

### Development

```bash
npm run dev
```

The admin dashboard will automatically open at **http://localhost:5173**

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
admin/
├── src/
│   ├── components/       # Reusable components
│   ├── layouts/          # Layout components (DashboardLayout)
│   ├── pages/            # Page components (Dashboard, Waitlist, Analytics, Settings)
│   ├── utils/            # Utility functions (API helpers)
│   ├── App.jsx           # Main app with routing
│   └── main.jsx          # Entry point
├── public/               # Static assets
└── package.json          # Dependencies
```

## API Integration

The admin dashboard uses these API endpoints:

- `GET /api/waitlist/all` - Fetch all signups
- `GET /api/waitlist/count` - Get total count
- `GET /api/waitlist/export` - Download CSV

## Design System

Matches the waitlist landing page design:

- **Colors**: Black primary, blue accent, green success
- **Typography**: System fonts with precise sizing
- **Components**: Rounded corners (16px), subtle shadows
- **Interactions**: Smooth transitions, hover states
- **Responsive**: Mobile-first approach

## Future Backend Integration

The frontend is ready for backend integration. You'll need to implement:

1. **Settings persistence**
   - Save/load email preferences
   - API key generation/management
   - Auto-export configuration

2. **Real-time updates**
   - WebSocket for live signup notifications
   - Auto-refresh dashboard stats

3. **Additional features**
   - Bulk email to waitlist
   - Individual signup management (edit/delete)
   - Export to other formats (JSON, Excel)
   - Advanced filtering and sorting

