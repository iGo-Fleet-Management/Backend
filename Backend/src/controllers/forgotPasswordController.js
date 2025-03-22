const forgotPasswordService = require('../services/forgotPasswordService');
const emailService = require('../services/emailService');

// Controlador para solicitar redefinição de senha
exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    // Busca o usuário pelo email
    const user = await forgotPasswordService.findUserByEmail(email);

    // Gera token JWT para recuperação de senha
    const { resetCode, token } =
      await forgotPasswordService.generatePasswordResetToken(email);

    // Se o usuário existir, gera token e envia email
    if (user) {
      // Envia email com o link de recuperação
      await emailService.sendPasswordResetEmail(email, resetCode);
    }

    // Retorna sempre sucesso (mesmo se email não existir, por segurança)
    // Isso evita enumeração de emails existentes
    res.status(200).json({
      success: true,
      message:
        'Se o email estiver cadastrado, você receberá as instruções para redefinição de senha.',
      token,
    });
  } catch (error) {
    if (error.message === 'Usuário não encontrado') {
      // Mantém a resposta genérica por segurança
      return res.status(200).json({
        success: true,
        message:
          'Se o e-mail estiver cadastrado, você receberá um código de verificação.',
      });
    }
    console.error('Erro ao solicitar recuperação de senha:', error);
    res.status(500).json({
      code: 'SERVER_ERROR',
      message: 'Erro ao processar a solicitação.',
    });
  }
};

// Controlador para redefinir senha com token
exports.resetPasswordWithToken = async (req, res) => {
  try {
    const { token, code, newPassword } = req.body;

    // Redefine a senha usando o token
    const result = await forgotPasswordService.resetPasswordWithToken(
      token,
      code,
      newPassword
    );

    res.status(200).json({
      success: true,
      code: 'PASSWORD_RESET_SUCCESS',
      message: 'Senha redefinida com sucesso.',
    });
  } catch (error) {
    // Tratamento específico para tipos de erro
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        code: 'TOKEN_EXPIRED',
        message: 'O link de recuperação expirou. Solicite um novo link.',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        code: 'INVALID_TOKEN',
        message: 'Link de recuperação inválido.',
      });
    }

    if (
      error.message === 'Senha deve ter 8+ caracteres com números e símbolos'
    ) {
      return res.status(400).json({
        code: 'WEAK_PASSWORD',
        message: error.message,
      });
    }

    // Erro genérico
    res.status(500).json({
      code: 'SERVER_ERROR',
      message: 'Erro ao redefinir a senha.',
    });
  }
};
