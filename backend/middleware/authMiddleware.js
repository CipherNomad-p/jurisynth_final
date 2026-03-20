const jwt = require("jsonwebtoken");

// PROTECT ROUTES
const protect = (req, res, next) => {
  let token = null;

  // ✅ Support BOTH cookie + Bearer (merged properly)
  if (req.cookies?.token) {
    token = req.cookies.token;
  } else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      message: "Not authorized, token missing"
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // decoded = { id, role }
    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Not authorized, invalid or expired token"
    });
  }
};

// ROLE AUTHORIZATION
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Role (${req.user?.role}) is not authorized`
      });
    }
    next();
  };
};

module.exports = { protect, authorize };