const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../config/jwt');

exports.authenticate = async (req, res, next) => {
  try {
    // Obter o token do cabeçalho Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        code: 'UNAUTHORIZED',
        message: 'Token de autenticação não fornecido ou formato inválido',
      });
    }

    const token = authHeader.split(' ')[1];
    console.log('Token recebido:', token);

    // Verificar e decodificar o token
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Token decodificado:', decoded);

    // Encontrar o usuário no banco de dados
    console.log('Procurando usuário com ID:', decoded.user_id);
    const user = await User.findByPk(decoded.user_id);
    console.log('Usuário encontrado:', user ? 'Sim' : 'Não');
    if (!user) {
      return res.status(404).json({
        code: 'USER_NOT_FOUND',
        message: 'Usuário não encontrado',
      });
    }

    // Adicionar o usuário à requisição para uso em outros middlewares
    req.user = {
      user_id: user.user_id,
      email: user.email,
      user_type: user.user_type,
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        code: 'INVALID_TOKEN',
        message: 'Token inválido',
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        code: 'TOKEN_EXPIRED',
        message: 'Token expirado',
      });
    }

    console.error('Erro de autenticação:', error);
    res.status(500).json({
      code: 'SERVER_ERROR',
      message: 'Erro interno no servidor',
    });
  }
};
