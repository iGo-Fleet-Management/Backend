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

exports.getTripByDateAndType = async (req, res) => {
  try {
    console.log(req.body);
    const date = req.body.date;
    const tripType = req.body.tripType;
    console.log(date, tripType);

    const resume = await TripService.getTripByDateAndType(date, tripType);
    console.log(resume);
    res.status(200).json({
      status: 'success',
      resume,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};
