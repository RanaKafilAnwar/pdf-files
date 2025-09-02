const jwt = require('jsonwebtoken');
require('dotenv').config();

function bindUser(req, res, next) {
    const token = req.cookies.token;
    
    if (!token) {
        req.user = null;
        return next();
    }

    jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
        if (err) {
            req.user = null;
            return next();
        }
        req.user = decoded;
        next();
    });
}

// Keep your existing middlewares for routes that need strict authentication
function authenticate(req, res, next) {
    if (!req.user) {
        return res.status(401).redirect('/auth/login');
    }
    next();
}

function isAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).redirect('/');
    }
    next();
}

module.exports = { bindUser, authenticate, isAdmin };