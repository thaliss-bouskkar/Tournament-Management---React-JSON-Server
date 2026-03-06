const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/forgotpassword', authController.forgotPassword);
router.put('/resetpassword/:resetToken', authController.resetPassword);

module.exports = router;
