const profileService = require('../services/profileService');

exports.getProfile = async (req, res) => {
  try {
    const profile = await profileService.getProfileById(req.user.user_id);
    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      code: 'PROFILE_NOT_FOUND',
      message: 'Perfil não encontrado',
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { userData } = req.body;
    const result = await profileService.saveProfile(req.user.user_id, userData);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    const status = error.message.includes('não encontrado') ? 404 : 500;
    res.status(status).json({
      success: false,
      code: 'PROFILE_UPDATE_ERROR',
      message: this.translateProfileError(error.message),
    });
  }
};

exports.updateAddresses = async (req, res) => {
  try {
    const { addressUpdates } = req.body;
    const result = await profileService.saveAddress(
      req.user.user_id,
      addressUpdates
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    const status = error.message.includes('não encontrado') ? 404 : 500;
    res.status(status).json({
      success: false,
      code: 'ADDRESS_UPDATE_ERROR',
      message: this.translateProfileError(error.message),
    });
  }
};

// Controller que mantém a funcionalidade combinada para compatibilidade
exports.createProfile = async (req, res) => {
  try {
    const { userData, addressData } = req.body;
    const result = await profileService.createProfile(
      req.user.user_id,
      userData,
      addressData
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    const status = error.message.includes('não encontrado') ? 404 : 500;
    res.status(status).json({
      success: false,
      code: 'PROFILE_UPDATE_ERROR',
      message: this.translateProfileError(error.message),
    });
  }
};

exports.translateProfileError = (errorMessage) => {
  const translations = {
    'User not found': 'Usuário não encontrado',
    'Invalid address data': 'Dados de endereço inválidos',
    'Profile incomplete': 'Perfil incompleto',
  };
  return translations[errorMessage] || errorMessage;
};
