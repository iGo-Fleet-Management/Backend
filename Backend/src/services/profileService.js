const UserRepository = require('../repositories/userRepository');
const AddressRepository = require('../repositories/addressRepository');
const { withTransaction } = require('./utilities/transactionHelper');
const {
  getUserWithAddresses,
  checkUserExists,
} = require('./utilities/UserHelpers');

exports.getProfileById = async (userId) => {
  if (!userId) throw new Error('ID do usuário não fornecido');
  const user = await getUserWithAddresses(userId);
  if (!user) throw new Error('Usuário não encontrado');
  return user;
};

exports.saveProfile = async (userId, userData, options = {}) =>
  withTransaction(options.transaction, async (transaction) => {
    await checkUserExists(userId, transaction);

    if (options.isInitialCompletion) {
      userData = {
        cpf: userData.cpf,
        birthdate: userData.birthdate,
        phone: userData.phone,
      };
    }

    if (userData && Object.keys(userData).length > 0) {
      await UserRepository.update(userId, userData, { transaction });
    }

    return getUserWithAddresses(userId, transaction);
  });

exports.saveAddress = async (userId, addressData, options = {}) =>
  withTransaction(options.transaction, async (transaction) => {
    await checkUserExists(userId, transaction);

    const addressesToProcess = options.isInitialCompletion
      ? [{ ...addressData, user_id: userId }]
      : addressData.map((addr) => ({
          ...addr,
          user_id: addr.address_id ? undefined : userId,
        }));

    await Promise.all(
      addressesToProcess.map((addrData) =>
        AddressRepository.updateOrCreate(addrData, {
          transaction,
          where: addrData.address_id ? { user_id: userId } : undefined,
        })
      )
    );

    return getUserWithAddresses(userId, transaction);
  });

exports.createProfile = async (userId, userData, addressData) =>
  withTransaction(null, async (transaction) => {
    await checkUserExists(userId, transaction);

    if (userData && Object.keys(userData).length > 0)
      await UserRepository.update(userId, userData, { transaction });
    if (addressData)
      await AddressRepository.create(
        { ...addressData, user_id: userId },
        { transaction }
      );

    return getUserWithAddresses(userId, transaction);
  });
