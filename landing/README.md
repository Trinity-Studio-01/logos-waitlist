# LogosAI Waitlist Landing Page

Professional waitlist landing page for collecting early access signups.

## Features

- **Modern Design**: Clean, responsive layout with gradient background
- **Form Validation**: Client-side email validation
- **Real-time Counter**: Shows number of people on waitlist
- **Success Animation**: Smooth transition after signup
- **Mobile Responsive**: Works perfectly on all devices
- **Backend Integration**: Connected to server API with SQLite database

## Pages

- **Main Page**: `/waitlist/index.html` or `http://localhost:3000/waitlist/`
- **Direct Access**: `http://localhost:3000/waitlist`

## API Endpoints

### POST /api/waitlist/signup
Add a new signup to the waitlist.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "church": "Grace Community Church" // optional
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Successfully added to waitlist",
  "id": 1
}
```

**Response (Duplicate):**
```json
{
  "success": false,
  "message": "Email already registered"
}
```

### GET /api/waitlist/count
Get the total number of signups.

**Response:**
```json
{
  "success": true,
  "count": 42
}
```

### GET /api/waitlist/export
Export all waitlist signups as CSV file.

**Response:**
- Content-Type: `text/csv`
- Downloads: `waitlist.csv`

## Database

Waitlist data is stored in `server/data/waitlist.db` (SQLite)

**Schema:**
```sql
CREATE TABLE waitlist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  church TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ip_address TEXT,
  user_agent TEXT
)
```

## Deployment

### Local Development

1. Start the server:
```bash
cd server
npm start
```

2. Visit: `http://localhost:3000/waitlist/`

### Production Deployment

For production, you can:

1. **Deploy with main server**: The waitlist page is served as static files from the main API server

2. **Deploy separately**: Host the `waitlist/` folder on any static hosting service (Netlify, Vercel, GitHub Pages, etc.)
   - Update `API_URL` in `script.js` to point to your production API

3. **Custom Domain**: Set up a subdomain like `signup.logosai.com` or `join.logosai.com`

## Customization

### Update Branding

1. **Logo**: Replace `../images/logos.png` with your logo
2. **Colors**: Edit CSS variables in `styles.css`:
   ```css
   :root {
     --primary-color: #2563eb;
     --primary-dark: #1e40af;
     --secondary-color: #10b981;
   }
   ```

### Update Content

Edit `index.html` to change:
- Headline and subheadline
- Feature descriptions
- Footer links
- Meta descriptions for SEO

### Analytics

Add Google Analytics or other tracking:

```html
<!-- Add before </head> in index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=YOUR-GA-ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'YOUR-GA-ID');
</script>
```

The signup form already includes `gtag` event tracking for successful signups.

## Export Signups

To export all waitlist signups:

```bash
# Using curl
curl http://localhost:3000/api/waitlist/export -o waitlist.csv

# Or visit in browser
http://localhost:3000/api/waitlist/export
```

## Security Considerations

- Email validation on both client and server
- Duplicate email prevention
- Rate limiting recommended for production
- IP address and user agent logged for fraud prevention
- Consider adding CAPTCHA for production deployment

## Files

- `index.html` - Main landing page structure
- `styles.css` - Styling and responsive design
- `script.js` - Form handling and API integration
- `README.md` - This file

## Tech Stack

- **Frontend**: Vanilla HTML/CSS/JavaScript (no frameworks needed)
- **Backend**: Node.js + Express
- **Database**: SQLite (via better-sqlite3)
- **Styling**: Custom CSS with CSS variables

## Future Enhancements

- [ ] Add email verification flow
- [ ] Send welcome email on signup
- [ ] Add CAPTCHA protection
- [ ] Implement rate limiting
- [ ] Add social sharing buttons
- [ ] A/B testing for copy
- [ ] Add countdown timer to launch
- [ ] Show position in queue (#42 in line!)
