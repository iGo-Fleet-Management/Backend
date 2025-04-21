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

exports.getTripData = async (req, res) => {
  try {
    const date = req.query.date;
    const tripType = req.query.tripType;

    const resume = await TripService.getTripData(date, tripType);

    function formatAddress(address) {
      if (!address) return null;

      const { street, number, neighbourhood, city, state, user } = address;

      return {
        street,
        number,
        neighbourhood,
        city,
        state,
        user_id: user?.user_id || null,
      };
    }

    const formattedResume = resume.map((trip) => {
      const plainTrip = trip.get({ plain: true });

      return {
        ...plainTrip,
        total_stops: trip.stops?.length || 0,
        stops:
          trip.stops?.map((stop) => ({
            id: stop.stop_id,
            date: stop.stop_date,
            user_id: stop.address.user.user_id || null,
            name: stop.address.user.name,
            last_name: stop.address.user.last_name,
            address: formatAddress(stop.address),
          })) || [],
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
    const { date } = req.query;
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

exports.getTripReleasedUsers = async (req, res) => {
  try {
    const { date } = req.query;
    // Validação de parâmetro obrigatório
    if (!date) {
      return res.status(400).json({
        status: 'error',
        message: 'Parâmetro "date" é obrigatório',
      });
    }

    // Chama o service
    const users = await TripService.getTripReleasedUsers(date);

    // Retorna a lista de usuários
    return res.status(200).json({
      status: 'success',
      data: users,
    });
  } catch (error) {
    // Em caso de erro interno
    return res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};
