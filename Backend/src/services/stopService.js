const { DateTime } = require('luxon');
const { withTransaction } = require('./utilities/transactionHelper');
const { validateStopRelations } = require('./utilities/stopValidator');
const stopManager = require('./utilities/stopManager');
const dateFormatter = require('./utilities/dateFormatter');
const TripRepository = require('../repositories/tripRepository');

exports.upsertStop = async (stopData, transaction) => {
  return withTransaction(transaction, async (t) => {
    return stopManager.upsertStop(stopData, t);
  });
};

// Função para adicionar viagem de ida e volta
exports.addRoundTripStop = async (
  userId,
  date,
  goStopDate,
  backStopDate,
  options = {}
) => {
  return withTransaction(options.transaction, async (transaction) => {
    // Buscar viagens de ida e volta
    const [goTrip, backTrip] = await Promise.all([
      TripRepository.findTripByDateAndType(date, 'ida', { transaction }),
      TripRepository.findTripByDateAndType(date, 'volta', { transaction }),
    ]);

    if (!goTrip || !backTrip) {
      throw new Error(
        'Viagens de ida e/ou volta não encontradas para esta data'
      );
    }

    // Preparar dados das paradas
    const baseData = { user_id: userId };
    const goData = {
      ...baseData,
      ...goStopDate,
      trip_id: goTrip.trip_id,
    };
    const backData = {
      ...baseData,
      ...backStopDate,
      trip_id: backTrip.trip_id,
    };

    // Validar relações
    await Promise.all([
      validateStopRelations(goData, transaction),
      validateStopRelations(backData, transaction),
    ]);

    // Remover paradas de outros tipos
    await stopManager.deleteOtherStops(
      userId,
      [goTrip.trip_id, backTrip.trip_id],
      date,
      transaction
    );

    // Processar paradas de ida e volta
    const [goStop, backStop] = await Promise.all([
      stopManager.upsertStop(goData, transaction),
      stopManager.upsertStop(backData, transaction),
    ]);

    return { goStop, backStop };
  });
};

exports.addOnlyGoStop = async (userId, date, goStopData, options = {}) => {
  return withTransaction(options.transaction, async (transaction) => {
    //Encontrar uma viagem de ida
    const goTrip = await TripRepository.findTripByDateAndType(date, 'ida', {
      transaction,
    });
    if (!goTrip) throw new Error('Viagem de ida não encontrada');

    //Preparar dados da parada
    const goData = {
      ...goStopData,
      user_id: userId,
      trip_id: goTrip.trip_id,
    };

    await validateStopRelations(goData, transaction);

    const allowedTrips = [goTrip.trip_id];

    // Remover paradas de outros tipos
    await stopManager.deleteOtherStops(userId, allowedTrips, date, transaction);

    // Criar/atualizar parada de ida
    const goStop = await this.upsertStop(goData, transaction);
    return { goStop };
  });
};

exports.addOnlyBackStop = async (userId, date, backStopData, options = {}) => {
  return withTransaction(options.transaction, async (transaction) => {
    // Buscar viagem de VOLTA (corrigir tipo para 'volta')
    const backTrip = await TripRepository.findTripByDateAndType(date, 'volta', {
      transaction,
    });
    if (!backTrip) throw new Error('Viagem de volta não encontrada');

    // Preparar dados da parada
    const backData = {
      ...backStopData,
      user_id: userId,
      trip_id: backTrip.trip_id,
    };

    await validateStopRelations(backData, transaction);

    // IDs permitidos (apenas volta)
    const allowedTrips = [backTrip.trip_id];

    // Remover outras paradas (incluindo ida se existir)
    await stopManager.deleteOtherStops(userId, allowedTrips, date, transaction);

    // Upsert da parada de volta
    const backStop = await this.upsertStop(backData, transaction);
    return { backStop };
  });
};

exports.removeStop = async (
  userId,
  date,
  goStopDate,
  backStopDate,
  options = {}
) => {
  return withTransaction(options.transaction, async (transaction) => {
    // Buscar viagens de ida e volta
    const [goTrip, backTrip] = await Promise.all([
      TripRepository.findTripByDateAndType(date, 'ida', { transaction }),
      TripRepository.findTripByDateAndType(date, 'volta', { transaction }),
    ]);

    if (!goTrip || !backTrip) {
      throw new Error(
        'Viagens de ida e/ou volta não encontradas para esta data'
      );
    }

    // Preparar dados das paradas
    const baseData = { user_id: userId };
    const goData = {
      ...baseData,
      ...goStopDate,
      trip_id: goTrip.trip_id,
    };
    const backData = {
      ...baseData,
      ...backStopDate,
      trip_id: backTrip.trip_id,
    };

    // Validar relações
    await Promise.all([
      validateStopRelations(goData, transaction),
      validateStopRelations(backData, transaction),
    ]);

    // Remover paradas de outros tipos
    const result = await stopManager.removeStops(
      userId,
      [goTrip.trip_id, backTrip.trip_id],
      date,
      transaction
    );

    // // Processar paradas de ida e volta
    // const [goStop, backStop] = await Promise.all([
    //   stopManager.removeStops(goData, transaction),
    //   stopManager.removeStops(backData, transaction),
    // ]);

    return { result };
  });
};

exports.updateIsReleased = async (userId, date, isReleased, options = {}) => {
  return withTransaction(options.transaction, async (transaction) => {
    const dateOnly = dateFormatter.toDateOnly(date);

    // Verificar se a função retorna um único objeto ou uma lista
    const backTrip = await TripRepository.findTripByDateAndType(
      dateOnly,
      'volta',
      { transaction }
    );

    if (!backTrip) {
      throw new Error('Viagem de volta não encontrada para esta data');
    }

    const tripId = backTrip?.trip_id;

    if (!tripId) {
      throw new Error('ID da viagem não encontrado');
    }

    // Encontrar parada de volta
    const backStop = await stopManager.getExistingStop(
      userId,
      tripId,
      transaction
    );

    if (!backStop) {
      throw new Error('Parada de volta não encontrada');
    }

    // Atualizar is_released
    const released = await stopManager.updateIsReleased(
      backStop.stop_id,
      isReleased,
      transaction
    );

    return { released };
  });
};
