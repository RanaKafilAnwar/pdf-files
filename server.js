const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const pool = require('./config/db'); // Import your MySQL pool
const app = express();
const path = require('path');
require('dotenv').config();

const cors = require('cors');

app.use(cors({
  origin: [
    "http://localhost:3000", // your local dev frontend
    "https://quizz-18uyh9iw3-zaheer-ahmeds-projects.vercel.app" // production frontend
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.options("*", cors()); 

app.use(bodyParser.json());
app.use(express.json());
app.use(cookieParser());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// ✅ Serve uploaded files BEFORE auth middleware
app.use('/uploads', express.static('/data/uploads'));

// Create MySQL session store
const sessionStore = new MySQLStore({
  expiration: 86400000, // 1 day in milliseconds
  createDatabaseTable: true, // Will create sessions table if it doesn't exist
  schema: {
    tableName: 'sessions',
    columnNames: {
      session_id: 'session_id',
      expires: 'expires',
      data: 'data'
    }
  }
}, pool);

app.use(session({
    secret: process.env.SECRET_KEY || 'fallback-secret-key-for-development-only',
    resave: true,  // Changed from false to true
    saveUninitialized: true,  // Changed from false to true
    store: sessionStore,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

app.use((req, res, next) => {
    // console.log('Session ID:', req.sessionID);
    // console.log('Session data:', req.session);
    next();
});

app.set('public', path.join(__dirname, 'public'));

const adminRoutes = require('./routes/adminRoutes');
const lectureRoutes = require("./routes/lectureRoutes");

const { bindUser, authenticate, isAdmin } = require('./middleware/authenticate');

// Routes
app.use(bindUser);
app.use("/", lectureRoutes);
app.use(authenticate);
app.use(isAdmin);
app.use("/admin", adminRoutes);

app.listen(process.env.PORT, () => {
    console.log(`Server is running on http://localhost:${process.env.PORT}`);
});
