const authService = require('../services/authService');

exports.register = async (req, res) => {
  try {
    const { user_type, name, last_name, email, password, reset_password } =
      req.body;

    const user = await authService.register({
      user_type,
      name,
      last_name,
      email,
      password,
      reset_password,
    });

    res.status(201).json({
      success: true,
      data: {
        id: user.user_id,
        email: user.email,
      },
    });
  } catch (error) {
    const statusCode = error.message.includes('already registered') ? 409 : 500;
    res.status(statusCode).json({
      success: false,
      code: 'REGISTRATION_ERROR',
      message: this.translateError(error.message),
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json({
      success: true,
      data: {
        token: result.token,
        reset_password: result.reset_password,
        user_type: result.user_type,
      },
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      code: 'AUTHENTICATION_FAILED',
      message: 'Credenciais inválidas',
    });
  }
};

exports.logout = async (req, res) => {
  try {
    const token = this.extractToken(req);
    await authService.logout(token);

    res.status(200).json({
      success: true,
      message: 'Logout realizado com sucesso',
    });
  } catch (error) {
    const statusCode = error.message.includes('Token') ? 401 : 500;
    res.status(statusCode).json({
      success: false,
      code: 'LOGOUT_FAILED',
      message: this.translateError(error.message),
    });
  }
};

// Métodos auxiliares
exports.extractToken = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.split(' ')[1];
};

exports.translateError = (errorMessage) => {
  const translations = {
    'Invalid credentials': 'Credenciais inválidas',
    'Token not provided': 'Token não fornecido',
    'Invalid token format': 'Formato do token inválido',
    'Email already registered': 'O e-mail já está em uso',
  };
  return translations[errorMessage] || 'Erro interno do servidor';
};
