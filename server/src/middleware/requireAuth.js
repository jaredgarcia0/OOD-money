// What this does: when a route uses this middleware, Express runs this function first. If req.session.userId doesn't exist (meaning nobody logged in yet, or the session expired), it immediately sends back a 401 error and stops, the actual route code never runs. If someone is logged in, next() tells Express to continue on to the real route. You'll see req.session.userId get set in the login route next.

function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  next();
}

module.exports = requireAuth;
