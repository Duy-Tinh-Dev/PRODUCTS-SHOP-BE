const mysql = require("mysql2");
require("dotenv").config();

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err);
  } else {
    console.log("Connected to MySQL");

    // Create categories table
    const createCategoriesTableQuery = `
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        image VARCHAR(255),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    db.query(createCategoriesTableQuery, (err, result) => {
      if (err) {
        console.error("Error creating categories table:", err);
      } else {
        console.log("Table 'categories' checked/created successfully.");
      }
    });

    // Create products table with category_id as foreign key
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        description TEXT,
        shortDescription VARCHAR(255),
        category_id INT,
        inStock BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
      )
    `;

    db.query(createTableQuery, (err, result) => {
      if (err) {
        console.error("Error creating products table:", err);
      } else {
        console.log("Table 'products' checked/created successfully.");
      }
    });

    // Create product images table
    const createImagesTableQuery = `
      CREATE TABLE IF NOT EXISTS product_images (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        image_url VARCHAR(255) NOT NULL,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `;

    db.query(createImagesTableQuery, (err, result) => {
      if (err) {
        console.error("Error creating product_images table:", err);
      } else {
        console.log("Table 'product_images' checked/created successfully.");
      }
    });

    // Create product features table
    const createFeaturesTableQuery = `
      CREATE TABLE IF NOT EXISTS product_features (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        feature VARCHAR(255) NOT NULL,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `;

    db.query(createFeaturesTableQuery, (err, result) => {
      if (err) {
        console.error("Error creating product_features table:", err);
      } else {
        console.log("Table 'product_features' checked/created successfully.");
      }
    });
  }
});

module.exports = db;
