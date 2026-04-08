# 🚀 Premium Invoice Generator (Integrated)

A professional billing system with an integrated frontend form, automated MySQL storage, PDF generation, and automatic email delivery.

## 📁 System Structure
- **`/frontend`**: React/Vite dashboard with "Midnight Neon" UI.
- **`/backend`**: Node.js Express API + MySQL + PDF Engine + Nodemailer.

## 🛠️ Setup Instructions

### 1. Database Setup
- Run `backend/schema.sql` in your MySQL environment.
- Configure `backend/.env` with your DB details.

### 2. Email Setup (CRITICAL)
For the "Auto-mailing" feature to work:
1. Use a Gmail account.
2. Enable **2-Factor Authentication**.
3. Generate an **App Password** (Google Account > Security > App Passwords).
4. Add your email and app password to `backend/.env`.

### 3. Running the System
**Backend:**
```powershell
cd backend
npm install
npm run dev
```

**Frontend:**
```powershell
cd frontend
npm install
npm run dev
```

## ✨ New Features
- ✅ **Custom Form**: No more Google Forms! Enter data directly in the dashboard.
- ✅ **Automatic Mailing**: Invoices are sent instantly to the customer's email upon creation.
- ✅ **Rich Aesthetics**: New "Midnight Neon" theme with glassmorphism and animations.
- ✅ **SQL Persistence**: Every customer and invoice is tracked in MySQL.
- ✅ **Dual-Storage Sync**: Automatically syncs data to Google Sheets (Excel) for extra safety.

## 📁 Google Sheets Sync Setup (Optional)
To sync data to an "Excel" file automatically:
1. Open your Google Sheet > **Extensions > Apps Script**.
2. Add a `doPost(e)` function to append data.
3. Deploy as a **Web App** (Access: "Anyone").
4. Add the URL to `backend/.env` as `GOOGLE_SCRIPT_URL`.

---
*Built with ❤️ by Antigravity AI*
