const express = require("express");
const Product = require("../models/Product");

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     ProductFeature:
 *       type: string
 *       example: "Japanese quartz movement"
 *
 *     ProductImage:
 *       type: string
 *       format: uri
 *       example: "https://images.unsplash.com/photo-1523275335684-37898b6baf30"
 *
 *     Product:
 *       type: object
 *       required:
 *         - name
 *         - price
 *       properties:
 *         id:
 *           type: integer
 *           description: The unique ID of the product
 *         name:
 *           type: string
 *           description: Name of the product
 *         price:
 *           type: number
 *           description: Price of the product
 *         description:
 *           type: string
 *           description: Full description of the product
 *         shortDescription:
 *           type: string
 *           description: Brief summary of the product
 *         category:
 *           type: string
 *           description: Product category
 *         images:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ProductImage'
 *           description: List of product image URLs
 *         features:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ProductFeature'
 *           description: Product features and specifications
 *         inStock:
 *           type: boolean
 *           description: Product availability status
 *       example:
 *         id: 1
 *         name: "Minimalist Watch"
 *         price: 249.99
 *         description: "Crafted with precision and designed with simplicity in mind..."
 *         shortDescription: "Elegant timepiece with premium materials and minimalist design."
 *         category: "Accessories"
 *         images: ["https://images.unsplash.com/photo-1523275335684-37898b6baf30", "https://images.unsplash.com/photo-1508057198894-247b23fe5ade"]
 *         features: ["Japanese quartz movement", "Italian leather strap", "Sapphire crystal glass", "Water-resistant (30m)"]
 *         inStock: true
 *
 *     PaginatedProducts:
 *       type: object
 *       properties:
 *         products:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Product'
 *         pagination:
 *           type: object
 *           properties:
 *             total:
 *               type: integer
 *               description: Total number of products
 *             totalPages:
 *               type: integer
 *               description: Total number of pages
 *             currentPage:
 *               type: integer
 *               description: Current page number
 *             limit:
 *               type: integer
 *               description: Number of items per page
 */

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: API for managing products
 */

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get paginated products
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of products per page
 *     responses:
 *       200:
 *         description: Paginated list of products
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedProducts'
 */
router.get("/", (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  Product.getAll(page, limit, (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(result);
    }
  });
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get a product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The product ID
 *     responses:
 *       200:
 *         description: Product data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 */
router.get("/:id", (req, res) => {
  Product.getById(req.params.id, (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else if (!result) {
      res.status(404).json({ error: "Product not found" });
    } else {
      res.json(result);
    }
  });
});

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 */
router.post("/", (req, res) => {
  Product.create(req.body, (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(201).json(result);
    }
  });
});

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Update a product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       200:
 *         description: Product updated successfully
 */
router.put("/:id", (req, res) => {
  Product.update(req.params.id, req.body, (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      // Fetch the updated product to return in the response
      Product.getById(req.params.id, (getErr, product) => {
        if (getErr) {
          res.status(500).json({ error: getErr.message });
        } else if (!product) {
          res.status(404).json({ error: "Product not found" });
        } else {
          res.json(product);
        }
      });
    }
  });
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Delete a product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The product ID
 *     responses:
 *       200:
 *         description: Product deleted successfully
 */
router.delete("/:id", (req, res) => {
  Product.delete(req.params.id, (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ message: "Product deleted successfully" });
    }
  });
});

module.exports = router;
