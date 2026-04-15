// Not strictly required since we use express-async-errors, but kept for clarity
// and explicit call sites.
module.exports = function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
