const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUI = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Product API",
      version: "1.0.0",
      description: "API Documentation for CRUD Product",
    },
    servers: [
      {
        url: "http://localhost:3000", // Thay đổi nếu deploy lên Render
      },
    ],
  },
  apis: ["./src/routes/*.js"], // Đường dẫn đến các file chứa API docs
};

const swaggerSpec = swaggerJSDoc(options);

const swaggerDocs = (app) => {
  app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerSpec));
};

module.exports = swaggerDocs;
