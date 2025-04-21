const express = require('express');
const forgotPasswordController = require('../controllers/forgotPasswordController');
const { validate } = require('../middlewares/validationMiddleware');
const authMiddleware = require('../middlewares/authMiddleware');
const forgotPasswordValidation = require('../validators/forgotPasswordValidation');

const router = express.Router();

/**
 * @swagger
 * /forgot-password/reset-password:
 *   post:
 *     summary: Redefinir senha no primeiro login
 *     description: Rota para atualizar a senha durante o primeiro login
 *     tags: [Autenticação]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: Senha atual do usuário
 *               newPassword:
 *                 type: string
 *                 description: Nova senha a ser definida
 *     responses:
 *       200:
 *         description: Senha atualizada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       description: Novo token de autenticação
 *                     message:
 *                       type: string
 *       400:
 *         description: Erro na validação da senha
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 code:
 *                   type: string
 *                   enum:
 *                     - MISSING_REQUIRED_FIELDS
 *                     - WEAK_PASSWORD
 *                     - NEW_PASSWORD_SAME_AS_CURRENT
 *                 message:
 *                   type: string
 *       401:
 *         description: Credenciais inválidas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 code:
 *                   type: string
 *                   example: INVALID_CREDENTIALS
 *                 message:
 *                   type: string
 */
router.post(
  '/reset-password',
  forgotPasswordController.resetPasswordFirstLogin
);

/**
 * @swagger
 * /forgot-password/forgot-password:
 *   post:
 *     summary: Solicitar recuperação de senha
 *     description: Rota para solicitar token de recuperação de senha
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: E-mail do usuário para recuperação de senha
 *     responses:
 *       200:
 *         description: Solicitação de recuperação de senha enviada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *                   description: Token para recuperação de senha
 *                 message:
 *                   type: string
 *       500:
 *         description: Erro ao processar solicitação de recuperação de senha
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 code:
 *                   type: string
 *                   example: PASSWORD_RESET_ERROR
 *                 message:
 *                   type: string
 */
router.post(
  '/forgot-password',
  validate(forgotPasswordValidation.forgotPasswordSchema()),
  forgotPasswordController.requestPasswordReset
);

/**
 * @swagger
 * /forgot-password/reset-password-token:
 *   post:
 *     summary: Redefinir senha com token
 *     description: Rota para redefinir senha utilizando token de recuperação
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 description: Token de recuperação de senha
 *               code:
 *                 type: string
 *                 description: Código de verificação
 *               newPassword:
 *                 type: string
 *                 description: Nova senha a ser definida
 *     responses:
 *       200:
 *         description: Senha redefinida com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Erro na validação da nova senha
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 code:
 *                   type: string
 *                   example: WEAK_PASSWORD
 *                 message:
 *                   type: string
 *       401:
 *         description: Erro de autenticação com o token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 code:
 *                   type: string
 *                   enum:
 *                     - TOKEN_EXPIRED
 *                     - INVALID_TOKEN
 *                 message:
 *                   type: string
 */
router.post(
  '/reset-password-token',
  validate(forgotPasswordValidation.resetPasswordSchema()),
  forgotPasswordController.resetPasswordWithToken
);

module.exports = router;
