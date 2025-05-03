const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const routes = require('./routes');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

dotenv.config(); // Carrega variáveis de ambiente do arquivo .env

const app = express();

app.use(express.static(path.join(__dirname, 'public')));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Middlewares essenciais para segurança e funcionamento básico
app.use(cors()); // Habilita CORS para todas as rotas
app.use(helmet()); // Adiciona headers de segurança
app.use(morgan('dev')); // Logs de requisições no formato 'dev'
app.use(express.json()); // Habilita parsing de JSON no body

// Agrupa todas as rotas sob o path /api
app.use('/api', routes);

module.exports = app;
