// src/services/forgotPasswordService.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const { JWT_SECRET } = require('../config/jwt');
const UserRepository = require('../repositories/userRepository');
const TokenBlacklistRepository = require('../repositories/tokenBlacklistRepository');
const emailService = require('./emailService');

// Gerar código numérico de 6 dígitos
const generateResetCode = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

exports.requestPasswordReset = async (email) => {
  try {
    const user = await UserRepository.findByEmail(email);
    if (!user) return { sent: false }; // Não revela se o email existe

    const { resetCode, token } = await this.generatePasswordResetToken(email);

    await emailService.sendPasswordResetEmail(email, resetCode);

    // Simular envio de email mesmo se usuário não existir
    return {
      sent: true,
      token,
      message:
        'Se o email estiver cadastrado, você receberá um código de verificação.',
    };
  } catch (error) {
    throw new Error('FAILED_TO_PROCESS_RESET_REQUEST');
  }
};

exports.generatePasswordResetToken = async (email) => {
  const user = await UserRepository.findByEmail(email);
  if (!user) throw new Error('USER_NOT_FOUND');

  const resetCode = generateResetCode();

  const token = jwt.sign(
    { email, code: resetCode, purpose: 'password-reset' },
    JWT_SECRET,
    { expiresIn: '10m' }
  );

  return { resetCode, token };
};

exports.resetPasswordWithToken = async (token, userCode, newPassword) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.purpose !== 'password-reset') {
      throw new Error('INVALID_TOKEN_PURPOSE');
    }

    if (decoded.code !== userCode) {
      throw new Error('INVALID_VERIFICATION_CODE');
    }

    const user = await UserRepository.findByEmail(decoded.email);
    if (!user) throw new Error('USER_NOT_FOUND');

    this.validateNewPassword(newPassword, user.password_hash);

    const password_hash = await bcrypt.hash(newPassword, 10);
    await UserRepository.update(user.user_id, {
      password_hash,
      reset_password: false,
    });

    await TokenBlacklistRepository.create({
      token,
      expires_at: new Date(decoded.exp * 1000),
    });

    return { success: true };
  } catch (error) {
    this.mapJwtErrors(error);
    throw error;
  }
};

exports.resetPasswordFirstLogin = async (email, newPassword) => {
  try {
    // Log de busca do usuário
    const user = await UserRepository.findByEmail(email, {
      attributes: ['user_id', 'password_hash'],
    });

    if (!user) {
      console.error('Usuário não encontrado para o email:', email);
      const error = new Error('INVALID_CREDENTIALS');
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }

    // Validação de nova senha
    try {
      this.validateNewPassword(newPassword);
    } catch (validationError) {
      console.error('Erro na validação da nova senha:', validationError);
      throw validationError;
    }

    // Hash da nova senha
    const password_hash = await bcrypt.hash(newPassword, 10);

    // Atualização do usuário
    await UserRepository.update(user.user_id, {
      password_hash,
      reset_password: false,
    });

    // Geração de novo token
    return this.generateNewAuthToken(user);
  } catch (error) {
    console.error('Erro detalhado:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    throw error;
  }
};

// Helpers
exports.validateNewPassword = (newPassword) => {
  if (
    !validator.isStrongPassword(newPassword, {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    })
  ) {
    throw new Error('WEAK_PASSWORD');
  }
};

exports.generateNewAuthToken = (user) => {
  return jwt.sign(
    { user_id: user.user_id, user_type: user.user_type },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
};

exports.mapJwtErrors = (error) => {
  const errorMap = {
    TokenExpiredError: 'TOKEN_EXPIRED',
    JsonWebTokenError: 'INVALID_TOKEN',
    NotBeforeError: 'TOKEN_NOT_ACTIVE',
  };

  if (errorMap[error.name]) {
    error.message = errorMap[error.name];
  }
};
