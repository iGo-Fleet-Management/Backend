const forgotPasswordService = require('../services/forgotPasswordService');
const emailService = require('../services/emailService');

exports.resetPasswordFirstLogin = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const { email } = req.user;

    // Validação usando o padrão de resposta estabelecido
    if (!newPassword) {
      return res.status(400).json({
        success: false,
        code: 'MISSING_REQUIRED_FIELDS',
        message: 'Todos os campos obrigatórios devem ser informados',
      });
    }

    const result = await forgotPasswordService.resetPasswordFirstLogin(
      email,
      newPassword
    );

    console.log('Resultado do resetPasswordFirstLogin:', result);
    console.log(result.token);

    return res.status(200).json({
      success: true,
      data: {
        token: result,
        message: 'Senha atualizada com sucesso',
      },
    });
  } catch (error) {
    const errorMapping = {
      INVALID_CREDENTIALS: {
        code: 'INVALID_CREDENTIALS',
        status: 401,
        message: 'Credenciais inválidas',
      },
      WEAK_PASSWORD: {
        code: 'WEAK_PASSWORD',
        status: 400,
        message:
          'A senha deve conter pelo menos 8 caracteres com números e símbolos',
      },
      NEW_PASSWORD_SAME_AS_CURRENT: {
        code: 'NEW_PASSWORD_SAME_AS_CURRENT',
        status: 400,
        message: 'A nova senha não pode ser igual à senha atual',
      },
    };

    const knownError = errorMapping[error.code] || {
      code: 'PASSWORD_RESET_ERROR',
      status: 500,
      message: 'Erro ao processar a solicitação de alteração de senha',
    };

    return res.status(knownError.status).json({
      success: false,
      code: knownError.code,
      message: knownError.message,
    });
  }
};

// Controlador para solicitar redefinição de senha
exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const { token } = await forgotPasswordService.requestPasswordReset(email);

    res.status(200).json({
      success: true,
      token,
      message:
        'Se o e-mail estiver cadastrado, você receberá um código de verificação. - teste',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      code: 'PASSWORD_RESET_ERROR',
      message: 'Erro ao processar solicitação de recuperação de senha',
    });
  }
};

// Controlador para redefinir senha com token
exports.resetPasswordWithToken = async (req, res) => {
  try {
    const { token, code, newPassword } = req.body;
    await forgotPasswordService.resetPasswordWithToken(
      token,
      code,
      newPassword
    );

    res.json({
      success: true,
      message: 'Senha redefinida com sucesso',
    });
  } catch (error) {
    const errorMap = {
      TokenExpiredError: [401, 'TOKEN_EXPIRED', 'Link de recuperação expirado'],
      JsonWebTokenError: [401, 'INVALID_TOKEN', 'Token inválido'],
      WEAK_PASSWORD: [400, 'WEAK_PASSWORD', error.message],
    };

    const [status, code, message] = errorMap[error.name] || [
      500,
      'SERVER_ERROR',
      'Erro ao redefinir senha',
    ];

    res.status(status).json({
      success: false,
      code,
      message,
    });
  }
};
