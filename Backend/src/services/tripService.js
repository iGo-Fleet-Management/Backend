const { DateTime } = require('luxon');
const { Stop, User, Address } = require('../models');
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

exports.getTripAddressesByDateAndType = async (date, tripType) => {
  const zoneDate = DateTime.fromISO(date, { zone: 'America/Sao_Paulo' });

  if (!zoneDate.isValid) {
    throw new Error('Data inválida');
  }

  let address = '';

  if (tripType !== 'ida') {
    address = 'casa';
  }

  const dateOnly = zoneDate.toFormat('yyyy-MM-dd');

  const resume = await TripRepository.model.findAll({
    where: {
      trip_date: dateOnly,
      trip_type: tripType,
    },
    include: [
      {
        model: Stop,
        as: 'stops',
        attributes: ['user_id'],
        required: false,
        include: [
          {
            model: Address,
            as: 'address',
            attributes: ['street', 'number', 'neighbourhood', 'city', 'state'],
            required: false,
          },
        ],
      },
    ],
    attributes: ['trip_type', 'trip_date'],
  });

  return resume;
};

exports.getTripResumeByDateAndType = async (date) => {
  const zoneDate = DateTime.fromISO(date, { zone: 'America/Sao_Paulo' });

  if (!zoneDate.isValid) {
    throw new Error('Data inválida');
  }

  const dateOnly = zoneDate.toFormat('yyyy-MM-dd');

  const results = await sequelize.query(
    `
    WITH user_trip_stats AS (
      SELECT
        s.user_id,
        t.trip_date,
        MAX(CASE WHEN t.trip_type = 'ida' THEN 1 ELSE 0 END) AS has_ida,
        MAX(CASE WHEN t.trip_type = 'volta' THEN 1 ELSE 0 END) AS has_volta
      FROM stop s
      INNER JOIN trip t ON s.trip_id = t.trip_id
      WHERE t.trip_date = :dateParam::DATE
      GROUP BY s.user_id, t.trip_date
    )
    SELECT
      trip_date,
      COUNT(CASE WHEN has_ida = 1 AND has_volta = 1 THEN 1 END) AS ida_e_volta,
      COUNT(CASE WHEN has_ida = 1 AND has_volta = 0 THEN 1 END) AS somente_ida,
      COUNT(CASE WHEN has_ida = 0 AND has_volta = 1 THEN 1 END) AS somente_volta
    FROM user_trip_stats
    GROUP BY trip_date
    ORDER BY trip_date;
    `,
    {
      type: sequelize.QueryTypes.SELECT,
      replacements: { dateParam: dateOnly },
    }
  );

  return results;
};
