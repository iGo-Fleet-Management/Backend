// tripRoutes.js
const express = require('express');
const controller = require('../controllers/tripController');
const { validate } = require('../middlewares/validationMiddleware');
const { authenticate } = require('../middlewares/authMiddleware');
const {
  tripParamsSchema,
  dailyTripsSchema,
} = require('../validators/tripValidation');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Trips
 *   description: Endpoints para gerenciamento de vaigens diárias
 */

router.use(authenticate);

/**
 * @swagger
 * /trips/daily:
 *   get:
 *     tags:
 *       - Trips
 *     summary: Lista viagens diárias
 *     description: Retorna todas as viagens agendadas para uma data específica
 *     parameters:
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         example: "2023-10-05"
 *       - in: query
 *         name: routeId
 *         schema:
 *           type: string
 *         example: "RT001"
 *     responses:
 *       200:
 *         description: Lista de viagens do dia
 *         content:
 *           application/json:
 *             example:
 *               - tripId: "TRP123"
 *                 route: "Linha 01"
 *                 departure: "08:00"
 *               - tripId: "TRP456"
 *                 route: "Linha 02"
 *                 departure: "09:30"
 *       400:
 *         description: Parâmetros inválidos ou faltantes
 *       500:
 *         description: Erro ao buscar viagens
 */
router.get('/daily', validate(dailyTripsSchema), controller.getDailyTrips);

/**
 * @swagger
 * /trips/{tripId}:
 *   get:
 *     tags:
 *       - Trips
 *     summary: Obtém detalhes de uma viagem específica
 *     description: Retorna informações completas de uma viagem pelo seu ID
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema:
 *           type: string
 *         example: "65a8b5d9f1a0f83260f4e7d8"
 *     responses:
 *       200:
 *         description: Detalhes da viagem
 *         content:
 *           application/json:
 *             example:
 *               tripId: "TRP123"
 *               route: "Linha Principal"
 *               stops:
 *                 - name: "Terminal Centro"
 *                   time: "07:30"
 *                 - name: "Parque Industrial"
 *                   time: "08:15"
 *       404:
 *         description: Viagem não encontrada
 *       500:
 *         description: Erro ao recuperar dados
 */
router.get('/get-trip-data', controller.getTripData);

router.get('/get-trip-resume', controller.getTripResumeByDateAndType);

router.get('/get-trip-released-users', controller.getTripReleasedUsers);

module.exports = router;
