const swaggerJSDoc = require('swagger-jsdoc');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Backend API',
    version: '1.0.0',
    description: 'Documentação da API do Backend iGO - Van Management',
    contact: {
      name: 'Suporte da API',
      email: 'suporte@exemplo.com',
    },
  },
  servers: [
    {
      url: 'https://backend-igo.onrender.com/api',
      description: 'Servidor de Desenvolvimento',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
};

const options = {
  swaggerDefinition,
  apis: ['./src/routes/*.js', './src/models/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
