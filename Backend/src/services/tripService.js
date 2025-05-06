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

    const dateOnly = parsedDate.toISODate('yyyy-MM-dd');
    return TripRepository.createDailyTrips(dateOnly, { transaction });
  });
};

// Método para obter viagens do dia
exports.getDailyTrips = async (date) => {
  const zoneDate = DateTime.fromISO(date, { zone: 'America/Sao_Paulo' });

  if (!zoneDate.isValid) {
    throw new Error('Data inválida');
  }

  const dateOnly = zoneDate.toISODate('yyyy-MM-dd');

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

exports.getTripData = async (date, tripType) => {
  const zoneDate = DateTime.fromISO(date, { zone: 'America/Sao_Paulo' });

  if (!zoneDate.isValid) {
    throw new Error('Data inválida');
  }

  let address = '';

  if (tripType !== 'ida') {
    address = 'casa';
  }

  const dateOnly = zoneDate.toISODate('yyyy-MM-dd');

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
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['user_id', 'name', 'last_name'],
                required: false,
              },
            ],
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

  const dateOnly = zoneDate.toISODate('yyyy-MM-dd');

  const results = await sequelize.query(
    `
    WITH user_trip_stats AS (
      SELECT
        s.user_id,
        u.name         AS first_name,
        u.last_name    AS last_name,
        t.trip_date,
        MAX(CASE WHEN t.trip_type = 'ida'   THEN 1 ELSE 0 END) AS has_ida,
        MAX(CASE WHEN t.trip_type = 'volta' THEN 1 ELSE 0 END) AS has_volta
      FROM stop s
      INNER JOIN trip  t ON s.trip_id = t.trip_id
      INNER JOIN users u ON s.user_id = u.user_id
      WHERE t.trip_date = :dateParam::DATE
      GROUP BY s.user_id, u.name, u.last_name, t.trip_date
    )
    SELECT
      trip_date,

      COUNT(*) FILTER (WHERE has_ida = 1 AND has_volta = 1) AS ida_e_volta,
      COUNT(*) FILTER (WHERE has_ida = 1 AND has_volta = 0) AS somente_ida,
      COUNT(*) FILTER (WHERE has_ida = 0 AND has_volta = 1) AS somente_volta,

      ARRAY_AGG(
        JSON_BUILD_OBJECT(
          'user_id', user_id,
          'full_name', first_name || ' ' || last_name
        )
      ) FILTER (WHERE has_ida = 1 AND has_volta = 1) AS users_ida_e_volta,

      ARRAY_AGG(
        JSON_BUILD_OBJECT(
          'user_id', user_id,
          'full_name', first_name || ' ' || last_name
        )
      ) FILTER (WHERE has_ida = 1 AND has_volta = 0) AS users_somente_ida,

      ARRAY_AGG(
        JSON_BUILD_OBJECT(
          'user_id', user_id,
          'full_name', first_name || ' ' || last_name
        )
      ) FILTER (WHERE has_ida = 0 AND has_volta = 1) AS users_somente_volta

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

exports.getTripReleasedUsers = async (date) => {
  // 1. Parse e validação da data no fuso de São Paulo
  const zoneDate = DateTime.fromISO(date, { zone: 'America/Sao_Paulo' });
  if (!zoneDate.isValid) {
    throw new Error('Data inválida');
  }
  const dateOnly = zoneDate.toISODate('yyyy-MM-dd');

  // 2. Busca os stops liberados nessa data, incluindo o usuário
  const releasedStops = await Stop.findAll({
    where: {
      stop_date: dateOnly,
      is_released: true,
    },
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['user_id', 'name', 'email'], // ajuste os campos conforme seu model
        required: true,
      },
    ],
    order: [
      ['stop_date', 'ASC'],
      ['user_id', 'ASC'],
    ],
  });

  // 3. Extrai e deduplica a lista de usuários
  const users = releasedStops
    .map((stop) => stop.user)
    .filter(
      (user, idx, self) =>
        self.findIndex((u) => u.user_id === user.user_id) === idx
    );

  return users;
};
