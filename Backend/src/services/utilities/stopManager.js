const TripRepository = require('../../repositories/tripRepository');
const StopRepository = require('../../repositories/stopRepository');
const { Op } = require('sequelize');

exports.getExistingStop = async (userId, tripId, transaction) => {
  return StopRepository.findOne({
    where: {
      user_id: userId,
      trip_id: tripId,
    },
    transaction,
  });
};

exports.deleteOtherStops = async (
  userId,
  allowedTripIds,
  date,
  transaction
) => {
  const trips = await TripRepository.findAll({
    where: {
      trip_date: date,
      trip_id: { [Op.notIn]: allowedTripIds },
    },
    attributes: ['trip_id'],
    transaction,
  });

  if (trips.length === 0) return;

  return StopRepository.deleteUserOtherStopsForTrips(
    userId,
    date,
    trips.map((t) => t.trip_id),
    transaction
  );
};

exports.removeStops = async (userId, allowedTripIds, date, transaction) => {
  const trips = await TripRepository.findAll({
    where: {
      trip_date: date,
      trip_id: { [Op.in]: allowedTripIds },
    },
    attributes: ['trip_id'],
    transaction,
  });

  if (trips.length === 0) return;

  return StopRepository.removeAllUserStops(
    userId,
    trips.map((t) => t.trip_id),
    transaction
  );
};

exports.upsertStop = async (stopData, transaction) => {
  // Verificar se a parada já existe
  const existingStop = await StopRepository.findOne({
    where: {
      user_id: stopData.user_id,
      trip_id: stopData.trip_id,
    },
    transaction,
  });

  // Fazer upsert (atualizar ou criar)
  if (existingStop) {
    return StopRepository.update(existingStop.stop_id, stopData, {
      transaction,
    });
  } else {
    return StopRepository.create(stopData, { transaction });
  }
};

exports.updateIsReleased = async (stopId, isReleased, transaction) => {
  return StopRepository.update(
    stopId,
    { is_released: isReleased },
    { transaction }
  );
};
