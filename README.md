# Medi AI - Personalized Medical Treatment Platform

A complete full-stack medical platform with role-based authentication and AI-driven treatment recommendations.

## 🎯 Features

- **Role-Based Authentication**: Admin, Doctor, and Patient roles with JWT authentication
- **Admin Dashboard**: Manage users, verify doctors, monitor subscriptions
- **Doctor Dashboard**: View patients, create prescriptions (verified doctors only)
- **Patient Dashboard**: Book appointments, view prescriptions, AI recommendations (premium users)
- **Verification System**: Provisional vs Verified doctors
- **Subscription Gating**: Premium features for subscribed patients

## 🛠️ Technology Stack

### Frontend
- React.js 18
- Vite (build tool)
- Tailwind CSS (styling)
- React Router (routing)
- Axios (HTTP client)
- Lucide React (icons)

### Backend
- FastAPI (Python web framework)
- JWT Authentication
- Bcrypt (password hashing)
- Uvicorn (ASGI server)

## 📦 Project Structure

```
medi-ai/
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── DoctorDashboard.jsx
│   │   │   └── PatientDashboard.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── index.html
├── backend/
|___routes/
|     |___auth.js
|____venv
}
│   ├── main.py
│   └── requirements.txt
└── README.md
```

## 🚀 Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- Python 3.8+
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
```

3. Activate virtual environment:
```bash
# On Windows
venv\Scripts\activate

# On macOS/Linux
source venv/bin/activate
```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Run the backend server:
```bash
python main.py
```

The backend will run on `http://localhost:8000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## 🔐 Test Accounts

### Admin Account
- **Email**: admin@medi.ai
- **Password**: Admin123!
- **Features**: Full system access, user management, doctor verification

### Doctor Accounts

**Verified Doctor:**
- **Email**: doctor1@medi.ai
- **Password**: Doctor123!
- **Status**: Verified
- **Features**: Full access to patient records and AI recommendations

**Provisional Doctor:**
- **Email**: doctor2@medi.ai
- **Password**: Doctor123!
- **Status**: Provisional (limited access)
- **Features**: Limited access until admin verification

### Patient Accounts

**Premium Patient:**
- **Email**: patient1@medi.ai
- **Password**: Patient123!
- **Subscription**: Active
- **Features**: Full access including AI recommendations

**Free Patient:**
- **Email**: patient2@medi.ai
- **Password**: Patient123!
- **Subscription**: Inactive
- **Features**: Basic access, upgrade required for premium features

## 📱 Using the Application

1. Open your browser and go to `http://localhost:3000`
2. You'll see the login page with role selection
3. Select a role (Admin, Doctor, or Patient)
4. Enter credentials from the test accounts above
5. You'll be redirected to the appropriate dashboard

## 🎨 Dashboard Features

### Admin Dashboard
- View total users, doctors, and patients statistics
- Monitor verified vs provisional doctors
- Track active subscriptions
- System status indicators
- Quick action buttons for user management

### Doctor Dashboard
- Patient statistics and appointment overview
- Verification status indicator
- Limited access warning for provisional doctors
- Today's schedule (for verified doctors)
- Quick actions for patient care

### Patient Dashboard
- Upcoming appointments and prescriptions
- Medical records count
- Subscription status indicator
- Upgrade prompt for free users
- Recent activity timeline (premium users)

## 🔒 Security Features

- JWT-based authentication
- Bcrypt password hashing
- Role-based access control (RBAC)
- Protected API endpoints
- Token expiration handling
- Automatic logout on token expiration

## 🌐 API Endpoints

### Authentication
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user

### Admin
- `GET /admin/dashboard` - Admin dashboard stats
- `GET /admin/doctors` - List all doctors

### Doctor
- `GET /doctor/dashboard` - Doctor dashboard stats

### Patient
- `GET /patient/dashboard` - Patient dashboard stats

## 📝 Notes

- This is a simplified version focusing on authentication and role-based dashboards
- The backend uses in-memory storage (no database) for demonstration
- All features are functional but use mock data
- Production deployment would require:
  - MySQL database integration
  - Environment variables for secrets
  - HTTPS configuration
  - Rate limiting
  - Logging and monitoring

## 🎯 Future Enhancements

- MySQL database integration
- Registration functionality
- File upload system
- ML-powered recommendations
- PDF generation for prescriptions
- Real-time notifications
- Admin panel for doctor verification
- Subscription management
- Medical record parsing

## 🐛 Troubleshooting

**Backend won't start:**
- Make sure virtual environment is activated
- Check if port 8000 is available
- Verify all dependencies are installed

**Frontend won't start:**
- Delete `node_modules` and run `npm install` again
- Check if port 3000 is available
- Clear npm cache: `npm cache clean --force`

**Login not working:**
- Ensure backend is running on port 8000
- Check browser console for errors
- Verify you're using correct test credentials

## 📄 License

This project is for educational purposes.

## 👨‍💻 Author

Created as part of the Medi AI platform development.
# Medi_AI
