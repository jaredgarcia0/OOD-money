// What this does: when a route uses this middleware, Express runs this function first. If the session has no userId or householdId (nobody is logged in, or the session expired), it immediately sends back a 401 error and stops, so the actual route code never runs. If someone is logged in, next() tells Express to continue on to the real route. Login and register set both values in the session.

function requireAuth(req, res, next) {
  if (!req.session.userId || !req.session.householdId) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  next();
}

module.exports = requireAuth;
