const express = require('express');
const bcrypt = require('bcryptjs');
const { userService } = require('../services/database');
const { generateToken, setTokenCookie, clearTokenCookie, redirectIfAuthenticated } = require('../middleware/auth');

const router = express.Router();

// Register page
router.get('/register', redirectIfAuthenticated, (req, res) => {
  res.render('register', { error: null });
});

// Register POST
router.post('/register', async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;

    // Validation
    if (!email || !password || !confirmPassword) {
      return res.render('register', { error: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.render('register', { error: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.render('register', { error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = await userService.findUserByEmail(email);
    if (existingUser) {
      return res.render('register', { error: 'Email already registered' });
    }

    // Hash password and create user
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await userService.createUser(email, passwordHash);

    // Generate token and set cookie
    const token = generateToken(user.id);
    setTokenCookie(res, token);

    res.redirect('/dashboard');
  } catch (error) {
    console.error('Register error:', error);
    res.render('register', { error: 'Registration failed. Please try again.' });
  }
});

// Login page
router.get('/login', redirectIfAuthenticated, (req, res) => {
  res.render('login', { error: null });
});

// Login POST
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.render('login', { error: 'Email and password are required' });
    }

    // Find user
    const user = await userService.findUserByEmail(email);
    if (!user) {
      return res.render('login', { error: 'Invalid email or password' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.render('login', { error: 'Invalid email or password' });
    }

    // Generate token and set cookie
    const token = generateToken(user.id);
    setTokenCookie(res, token);

    res.redirect('/dashboard');
  } catch (error) {
    console.error('Login error:', error);
    res.render('login', { error: 'Login failed. Please try again.' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  clearTokenCookie(res);
  res.redirect('/login');
});

// Root redirect
router.get('/', (req, res) => {
  res.redirect('/login');
});

module.exports = router;

