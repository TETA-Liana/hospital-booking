const router = require('express').Router();
const controller = require('../controllers/auth.controller');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const {
  registerPatientSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} = require('../validators/auth.validator');

router.post('/register', validate(registerPatientSchema), controller.register);
router.post('/login', validate(loginSchema), controller.login);
router.post('/refresh', controller.refresh);
router.post('/logout', controller.logout);
router.get('/me', authenticate, controller.me);
router.post('/forgot-password', validate(forgotPasswordSchema), controller.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), controller.resetPassword);
router.post('/change-password', authenticate, validate(changePasswordSchema), controller.changePassword);

module.exports = router;
