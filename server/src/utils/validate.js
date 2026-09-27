// What this does: isValidEmail checks the string roughly looks like an email (something@something.something), and isValidPassword just enforces a minimum length of 8 characters. These aren't perfect validators (email validation is famously hard to do 100% correctly), but they're good enough to catch obvious mistakes, which is all this project needs.

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPassword(password) {
  return typeof password === 'string' && password.length >= 8;
}

module.exports = { isValidEmail, isValidPassword };