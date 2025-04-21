const TripService = require('../services/tripService');

//tranformar essa função para buscar paradas
exports.getTrip = async (req, res) => {
  try {
    const trip = await TripService.getTripByDateAndType(req.params.tripId);
    if (!trip)
      return res
        .status(404)
        .json({ status: 'fail', message: 'Viagem não encontrada' });

    res.status(200).json({
      status: 'success',
      data: trip,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Erro ao buscar viagem',
    });
  }
};

exports.getDailyTrips = async (req, res) => {
  try {
    const { date } = req.query;

    const trips = await TripService.getDailyTrips(date);

    res.status(200).json({
      status: 'success',
      results: trips.length,
      data: trips.map((trip) => ({
        ...trip.get({ plain: true }),
        stops: trip.stops.map((stop) => ({
          id: stop.stop_id,
          date: stop.stop_date,
          address: stop.address,
        })),
      })),
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

exports.getTripAddresesByDateAndType = async (req, res) => {
  try {
    const date = req.query.date;
    const tripType = req.query.tripType;

    const resume = await TripService.getTripAddressesByDateAndType(
      date,
      tripType
    );
    // Processa os dados para incluir total_stops e formatar stops
    const formattedResume = resume.map((trip) => {
      const plainTrip = trip.get({ plain: true }); // Converte para objeto simples
      return {
        ...plainTrip,
        total_stops: trip.stops ? trip.stops.length : 0, // Adiciona contagem
        stops: trip.stops
          ? trip.stops.map((stop) => ({
              id: stop.stop_id,
              date: stop.stop_date,
              address: stop.address
                ? `${stop.address.street} - ${stop.address.number}, ${stop.address.neighbourhood}, ${stop.address.city}, ${stop.address.state}`
                : null,
            }))
          : [],
      };
    });

    res.status(200).json({
      status: 'success',
      resume: formattedResume, // Envia os dados formatados
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

exports.getTripResumeByDateAndType = async (req, res) => {
  try {
    const { date } = req.body;
    const resume = await TripService.getTripResumeByDateAndType(date);

    res.status(200).json({
      status: 'success',
      resume: resume,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};
