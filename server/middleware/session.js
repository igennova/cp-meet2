import session from "express-session";

const sessionMiddleware = session({
  secret: process.env.COOKIE_KEY || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
});

export default sessionMiddleware; 