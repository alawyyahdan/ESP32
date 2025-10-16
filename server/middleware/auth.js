const jwt = require('jsonwebtoken');
const { userService } = require('../services/database');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userService.findUserById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Middleware to check if user is already authenticated (for login/register pages)
const redirectIfAuthenticated = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await userService.findUserById(decoded.userId);
      
      if (user) {
        return res.redirect('/dashboard');
      }
    }
    
    next();
  } catch (error) {
    // Token is invalid, continue to login/register
    next();
  }
};

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Set token cookie
const setTokenCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

// Clear token cookie
const clearTokenCookie = (res) => {
  res.clearCookie('token');
};

module.exports = {
  authenticateToken,
  redirectIfAuthenticated,
  generateToken,
  setTokenCookie,
  clearTokenCookie,
};

