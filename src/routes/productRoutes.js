const express = require("express");
const Product = require("../models/Product");

const router = express.Router();

// Get all products
router.get("/", (req, res) => {
  Product.getAll((err, results) => {
    if (err) res.status(500).json({ error: err.message });
    else res.json(results);
  });
});

// Get product by ID
router.get("/:id", (req, res) => {
  Product.getById(req.params.id, (err, results) => {
    if (err) res.status(500).json({ error: err.message });
    else res.json(results[0]);
  });
});

// Create a product
router.post("/", (req, res) => {
  Product.create(req.body, (err, results) => {
    if (err) res.status(500).json({ error: err.message });
    else res.json({ id: results.insertId, ...req.body });
  });
});

// Update a product
router.put("/:id", (req, res) => {
  Product.update(req.params.id, req.body, (err) => {
    if (err) res.status(500).json({ error: err.message });
    else res.json({ message: "Product updated" });
  });
});

// Delete a product
router.delete("/:id", (req, res) => {
  Product.delete(req.params.id, (err) => {
    if (err) res.status(500).json({ error: err.message });
    else res.json({ message: "Product deleted" });
  });
});

module.exports = router;
