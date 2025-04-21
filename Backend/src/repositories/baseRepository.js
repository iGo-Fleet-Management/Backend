const { Op } = require('sequelize');

class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  async findById(id, options = {}) {
    return this.model.findByPk(id, options);
  }

  async findByField(field, value, options = {}) {
    return this.model.findOne({
      where: { [field]: value },
      ...options,
    });
  }

  async create(data, options = {}) {
    return this.model.create(data, {
      transaction: options.transaction, // 👈 Transação propagada
      ...options,
    });
  }

  async update(id, data, options = {}) {
    const [affectedRows] = await this.model.update(data, {
      where: {
        [this.model.primaryKeyAttribute]: id,
      },
      ...options,
    });

    if (affectedRows === 0) throw new Error('Registro não encontrado');
    return this.findById(id, options);
  }

  async delete(id, options = {}) {
    const affectedRows = await this.model.destroy({
      where: { [this.model.primaryKeyAttribute]: id },
      ...options,
    });
    if (affectedRows === 0) throw new Error('Registro não encontrado');
    return true;
  }

  async findAll(options = {}) {
    return this.model.findAll(options);
  }

  async findOne(options = {}) {
    return this.model.findOne(options);
  }
}

module.exports = BaseRepository;
