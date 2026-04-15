const argon2 = require('argon2');

async function hashPassword(plain) {
  return argon2.hash(plain, { type: argon2.argon2id });
}

async function verifyPassword(hash, plain) {
  try {
    return await argon2.verify(hash, plain);
  } catch (err) {
    return false;
  }
}

// Basic password strength check used on register/reset.
function isStrongPassword(pw) {
  return (
    typeof pw === 'string' &&
    pw.length >= 8 &&
    /[A-Z]/.test(pw) &&
    /[a-z]/.test(pw) &&
    /[0-9]/.test(pw)
  );
}

module.exports = { hashPassword, verifyPassword, isStrongPassword };
