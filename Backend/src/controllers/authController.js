const authService = require('../services/authService');
const TokenBlacklist = require('../models/TokenBlacklist');

// Controlador para registro de usuários
exports.register = async (req, res) => {
  try {
    // Extrai dados do corpo da requisição
    const { user_type, name, last_name, email, password, reset_password } =
      req.body;

    // Chama o serviço de registro
    const user = await authService.register(
      user_type,
      name,
      last_name,
      email,
      password,
      reset_password
    );

    // Retorna sucesso 201 (Created) com dados do usuário
    res.status(201).json({ user });
  } catch (error) {
    // Tratamento específico para erros conhecidos
    if (error.message === 'O e-mail já está em uso') {
      res.status(409).json({ error: error.message }); // 409 Conflict
    }
    if (error.message === 'Resete sua senha') {
      res.status(403).json({ error: error.message }); // 403 Forbidden
    } else {
      res.status(500).json({ error: error.message }); // Erro genérico para casos inesperados
    }
  }
};

// Controlador para autenticação de usuários
exports.login = async (req, res) => {
  try {
    // Extrai dados do corpo da requisição
    const { email, password } = req.body;

    // Autentica via serviço
    const result = await authService.login(email, password);

    // Retorna token JWT e status de senha
    res.json({
      token: result.token,
      reset_password: result.reset_password,
    });
  } catch (error) {
    // Erro genérico de autenticação
    res.status(401).json({ error: error.message }); // 401 Unauthorized
  }
};

exports.logout = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Formato de autorização inválido. Use: Bearer <token>',
      });
    }

    const token = authHeader.split(' ')[1];
    await authService.logout(token);

    res.status(200).json({
      success: true,
      message: 'Logout realizado com sucesso',
    });
  } catch (error) {
    console.error('Erro no logout:', error);
    const statusCode = error.message.includes('jwt') ? 401 : 500;
    res.status(statusCode).json({
      success: false,
      error: error.message,
    });
  }
};
