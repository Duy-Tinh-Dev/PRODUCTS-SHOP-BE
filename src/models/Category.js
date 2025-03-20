const db = require("../config/db");

const Category = {
  // Get all categories
  getAll: (callback) => {
    db.query("SELECT * FROM categories ORDER BY name", callback);
  },

  // Get category by ID
  getById: (id, callback) => {
    db.query("SELECT * FROM categories WHERE id = ?", [id], callback);
  },

  // Create a new category
  create: (data, callback) => {
    db.query("INSERT INTO categories SET ?", data, callback);
  },

  // Update a category
  update: (id, data, callback) => {
    db.query("UPDATE categories SET ? WHERE id = ?", [data, id], callback);
  },

  // Delete a category
  delete: (id, callback) => {
    db.query("DELETE FROM categories WHERE id = ?", [id], callback);
  },

  // Get products by category ID with pagination
  getProducts: (categoryId, page = 1, limit = 10, callback) => {
    const offset = (page - 1) * limit;

    // Get the total count for pagination metadata
    db.query(
      "SELECT COUNT(*) as total FROM products WHERE category_id = ?",
      [categoryId],
      (countErr, countResults) => {
        if (countErr) {
          return callback(countErr, null);
        }

        const total = countResults[0].total;
        const totalPages = Math.ceil(total / limit);

        // Query for paginated products in the category
        db.query(
          "SELECT p.*, c.name as category_name FROM products p " +
            "LEFT JOIN categories c ON p.category_id = c.id " +
            "WHERE p.category_id = ? LIMIT ? OFFSET ?",
          [categoryId, limit, offset],
          (err, products) => {
            if (err) {
              return callback(err, null);
            }

            // Process each product to get its images and features
            const promises = products.map((product) => {
              return new Promise((resolve, reject) => {
                // Get product images
                db.query(
                  "SELECT image_url FROM product_images WHERE product_id = ?",
                  [product.id],
                  (imgErr, imgResults) => {
                    if (imgErr) {
                      return reject(imgErr);
                    }

                    // Get product features
                    db.query(
                      "SELECT feature FROM product_features WHERE product_id = ?",
                      [product.id],
                      (featErr, featResults) => {
                        if (featErr) {
                          return reject(featErr);
                        }

                        // Format the product with images and features
                        const formattedProduct = {
                          ...product,
                          category: product.category_name,
                          images: imgResults.map((img) => img.image_url),
                          features: featResults.map((feat) => feat.feature),
                        };

                        // Remove redundant fields
                        delete formattedProduct.category_id;
                        delete formattedProduct.category_name;

                        resolve(formattedProduct);
                      }
                    );
                  }
                );
              });
            });

            // Wait for all product data to be populated
            Promise.all(promises)
              .then((formattedProducts) => {
                callback(null, {
                  products: formattedProducts,
                  pagination: {
                    total,
                    totalPages,
                    currentPage: page,
                    limit,
                  },
                });
              })
              .catch((error) => {
                callback(error, null);
              });
          }
        );
      }
    );
  },
};

module.exports = Category;
