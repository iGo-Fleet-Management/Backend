const { withTransaction } = require('./utilities/transactionHelper');
const {
  getUserWithAddresses,
  checkUserExists,
} = require('./utilities/UserHelpers');
const UserRepository = require('../repositories/userRepository');
const Address = require('../models/Address');

exports.deleteUser = async (userId) =>
  withTransaction(null, async (transaction) => {
    await checkUserExists(userId, transaction);
    await UserRepository.delete(userId, { transaction });
    return { message: 'Usuário deletado com sucesso' };
  });

exports.getAllUsers = async () =>
  withTransaction(null, async (transaction) => {
    const users = await UserRepository.findAll({
      include: [
        {
          model: Address,
          as: 'addresses',
          where: {
            address_type: 'Casa',
          },
          required: false,
          attributes: {
            exclude: [
              'user_id',
              'address_id',
              'address_type',
              'cep',
              'complement',
              'state',
            ],
          },
        },
      ],
      attributes: {
        exclude: [
          'user_type',
          'cpf',
          'birthdate',
          'email',
          'password_hash',
          'reset_password',
        ],
      },
      transaction,
    });
    return users;
  });
