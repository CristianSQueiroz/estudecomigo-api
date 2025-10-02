const jwt = require("jsonwebtoken");

// Autenticação
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET || "seuSegredo", (err, user) => {
    if (err) return res.sendStatus(403);
    console.log("🔑 Payload do token:", user); // debug
    req.user = user;
    next();
  });
}

// Controle de cargo
function requireRole(roles) {
  return (req, res, next) => {
    if (!Array.isArray(roles)) {
      roles = [roles];
    }

    console.log("👤 Cargo recebido:", req.user.tipo, " | Cargos permitidos:", roles);

    if (!roles.includes(req.user.tipo)) {
      return res.status(403).json({ error: "Permissão negada + Cargo"+req.user.tipo });
    }

    next();
  };
}

module.exports = { authenticateToken, requireRole };
