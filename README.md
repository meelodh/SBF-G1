# 📚 Study Buddy Finder

A collaborative study platform where students can find study groups and connect with peers.

## 🚀 Quick Start

### Prerequisites
- Node.js installed
- Supabase project with credentials in `.env`
- Database schema already deployed

### Setup (2 minutes)
```bash
# Install dependencies
npm install

# Start the server
npm start
```

Then open: `http://localhost:3000/StudyBuddyFinder/public/index.html`

---

## 📖 Documentation

### For First-Time Users
- **[ARCHITECTURE_DIAGRAMS.md](ARCHITECTURE_DIAGRAMS.md)** - How the system works
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Common issues & fixes
- **[IMPLEMENTATION_CHECKLIST.md](IMPLEMENTATION_CHECKLIST.md)** - Feature walkthrough

---

## 🗂️ File Structure

```
SBF-G1/
├── server.js                    ← Express backend (API server)
├── supabaseClient.js            ← Supabase configuration
├── .env                         ← Your credentials (Supabase)
├── package.json                 ← Dependencies
│
└── StudyBuddyFinder/
    ├── db/
    │   └── create_listings.sql  ← Database schema
    └── public/
        ├── index.html           ← Login page
        ├── signup.html          ← Sign up page
        ├── home.html            ← Main dashboard
        ├── home.js              ← Listing logic
        ├── profile.html         ← User profile
        ├── profile.js           ← Profile logic
        ├── style.css            ← Styles
        └── about.html           ← About page
```

---

## 💡 How It Works

1. **User signs up** → Credentials sent to Express server
2. **Server validates & creates user** → Stored in Supabase Auth
3. **User creates listing** → Posted to Express API
4. **Server saves to database** → Stored in PostgreSQL
5. **Session maintained** → Via secure httpOnly cookies
6. **Users can edit/delete** → Only their own listings (RLS enforced)

---

## 🔒 Security Features

- **Password Hashing** - bcrypt with Supabase Auth
- **Row Level Security** - Users can only access their own data
- **httpOnly Cookies** - Session tokens cannot be accessed by JavaScript
- **CORS Protection** - API only accepts requests from your domain

---

## 🎯 Core Features

- ✅ User authentication (signup/login)
- ✅ Create study listings
- ✅ View all listings
- ✅ Edit your listings
- ✅ Delete your listings
- ✅ View your profile
- ✅ Secure logout

---

## 🆘 Troubleshooting

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common issues and solutions.

---

## 📚 Learn More

- **System Architecture** → [ARCHITECTURE_DIAGRAMS.md](ARCHITECTURE_DIAGRAMS.md)
- **Feature Testing** → [IMPLEMENTATION_CHECKLIST.md](IMPLEMENTATION_CHECKLIST.md)
- **Common Issues** → [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
