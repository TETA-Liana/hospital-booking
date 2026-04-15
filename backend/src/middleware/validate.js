const { failure } = require('../utils/apiResponse');

// Wraps a Zod schema and validates req.body / req.query / req.params.
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const errors = result.error.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      }));
      return failure(res, 422, 'Validation failed', errors);
    }
    req[source] = result.data;
    next();
  };
}

module.exports = validate;
