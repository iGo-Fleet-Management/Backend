const { DateTime } = require('luxon');
const { Stop } = require('../models');
const { withTransaction } = require('./utilities/transactionHelper');
const sequelize = require('../config/db');
const TripRepository = require('../repositories/tripRepository');

exports.createDailyTrips = async (tripDate = new Date()) => {
  return withTransaction(null, async (transaction) => {
    const zone = 'America/Sao_Paulo';
    const parsedDate = DateTime.fromJSDate(tripDate).setZone(zone);
    const now = DateTime.now().setZone(zone);

    if (parsedDate < now.startOf('day')) {
      throw new Error('Não é possível criar viagens para datas passadas');
    }

    const dateOnly = parsedDate.toFormat('yyyy-MM-dd');
    return TripRepository.createDailyTrips(dateOnly, { transaction });
  });
};

// Método para obter viagens do dia
exports.getDailyTrips = async (date) => {
  const zoneDate = DateTime.fromISO(date, { zone: 'America/Sao_Paulo' });

  if (!zoneDate.isValid) {
    throw new Error('Data inválida');
  }

  const dateOnly = zoneDate.toFormat('yyyy-MM-dd');

  return TripRepository.model.findAll({
    where: { trip_date: dateOnly },
    include: [
      {
        model: Stop,
        as: 'stops',
        attributes: ['stop_id', 'stop_date'],
        required: false,
      },
    ],
    order: [
      ['trip_type', 'ASC'],
      [sequelize.col('stops.stop_date'), 'ASC'],
    ],
  });
};

exports.getTripByDateAndType = async (date, tripType) => {
  const zoneDate = DateTime.fromISO(date, { zone: 'America/Sao_Paulo' });

  console.log(date, tripType);
  console.log(zoneDate);

  if (!zoneDate.isValid) {
    throw new Error('Data inválida');
  }

  const dateOnly = zoneDate.toFormat('yyyy-MM-dd');

  //const resume = await TripRepository.findTripByDateAndType(dateOnly, tripType);
  const resume = await TripRepository.model.findAll({
    where: {
      trip_date: dateOnly,
      trip_type: tripType,
    },
    include: [
      {
        model: Stop,
        as: 'stops',
        attributes: ['stop_id', 'stop_date'],
        required: false,
      },
    ],
    order: [
      ['trip_type', 'ASC'],
      [sequelize.col('stops.stop_date'), 'ASC'],
    ],
  });

  return resume;
};
