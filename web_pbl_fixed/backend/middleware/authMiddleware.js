const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ════════════════════════════════════════════════════
//  protect — verifies JWT token on every protected route
// ════════════════════════════════════════════════════
const protect = async (req, res, next) => {
  let token;

  // Expect: "Authorization: Bearer <token>"
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorised — no token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach lean user payload (id, role, name) to request
    req.user = {
      id:   decoded.id,
      role: decoded.role,
      name: decoded.name,
    };

    next();
  } catch (error) {
    return res.status(401).json({ message: "Not authorised — token is invalid or expired" });
  }
};

// ════════════════════════════════════════════════════
//  authoriseRoles(...roles)
//  Factory that returns middleware restricting access
//  to the given roles only.
//
//  Usage:
//    router.post("/addEvent", protect, authoriseRoles("faculty","admin"), ...)
// ════════════════════════════════════════════════════
const authoriseRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied — role '${req.user.role}' is not permitted`,
      });
    }
    next();
  };
};

module.exports = { protect, authoriseRoles };