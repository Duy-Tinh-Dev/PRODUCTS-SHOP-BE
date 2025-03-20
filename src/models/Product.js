const db = require("../config/db");

const Product = {
  // Get all products with pagination
  getAll: (page = 1, limit = 10, callback) => {
    const offset = (page - 1) * limit;

    // Get the total count for pagination metadata
    db.query(
      "SELECT COUNT(*) as total FROM products",
      (countErr, countResults) => {
        if (countErr) {
          return callback(countErr, null);
        }

        const total = countResults[0].total;
        const totalPages = Math.ceil(total / limit);

        // Query for paginated products with category name
        db.query(
          "SELECT p.*, c.name as category_name FROM products p " +
            "LEFT JOIN categories c ON p.category_id = c.id " +
            "LIMIT ? OFFSET ?",
          [limit, offset],
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
                          category: product.category_name || null,
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

  // Get product by ID
  getById: (id, callback) => {
    // Get the base product data with category name
    db.query(
      "SELECT p.*, c.name as category_name FROM products p " +
        "LEFT JOIN categories c ON p.category_id = c.id " +
        "WHERE p.id = ?",
      [id],
      (err, results) => {
        if (err) {
          return callback(err, null);
        }

        if (results.length === 0) {
          return callback(null, null); // No product found
        }

        const product = results[0];

        // Get product images
        db.query(
          "SELECT image_url FROM product_images WHERE product_id = ?",
          [id],
          (imgErr, imgResults) => {
            if (imgErr) {
              return callback(imgErr, null);
            }

            // Get product features
            db.query(
              "SELECT feature FROM product_features WHERE product_id = ?",
              [id],
              (featErr, featResults) => {
                if (featErr) {
                  return callback(featErr, null);
                }

                // Format the product with images and features
                const formattedProduct = {
                  ...product,
                  category: product.category_name || null,
                  images: imgResults.map((img) => img.image_url),
                  features: featResults.map((feat) => feat.feature),
                };

                // Remove redundant fields
                delete formattedProduct.category_id;
                delete formattedProduct.category_name;

                callback(null, formattedProduct);
              }
            );
          }
        );
      }
    );
  },

  // Create a new product with images and features
  create: (data, callback) => {
    const { images, features, category, ...productData } = data;

    // If category is provided as a name, find or create the category
    const processCategory = (callback) => {
      if (category) {
        // Check if category exists
        db.query(
          "SELECT id FROM categories WHERE name = ?",
          [category],
          (err, results) => {
            if (err) {
              return callback(err, null);
            }

            if (results.length > 0) {
              // Category exists, use its ID
              callback(null, results[0].id);
            } else {
              // Category doesn't exist, create it
              db.query(
                "INSERT INTO categories SET ?",
                { name: category },
                (err, result) => {
                  if (err) {
                    return callback(err, null);
                  }
                  callback(null, result.insertId);
                }
              );
            }
          }
        );
      } else {
        // No category provided
        callback(null, null);
      }
    };

    // Start a transaction
    db.beginTransaction((err) => {
      if (err) {
        return callback(err, null);
      }

      // Process category first
      processCategory((categoryErr, categoryId) => {
        if (categoryErr) {
          return db.rollback(() => {
            callback(categoryErr, null);
          });
        }

        // Set category_id if we have one
        if (categoryId) {
          productData.category_id = categoryId;
        }

        // Insert the product
        db.query("INSERT INTO products SET ?", productData, (err, result) => {
          if (err) {
            return db.rollback(() => {
              callback(err, null);
            });
          }

          const productId = result.insertId;

          // Insert images if provided
          if (images && images.length > 0) {
            const imageValues = images.map((url) => [productId, url]);
            db.query(
              "INSERT INTO product_images (product_id, image_url) VALUES ?",
              [imageValues],
              (imgErr) => {
                if (imgErr) {
                  return db.rollback(() => {
                    callback(imgErr, null);
                  });
                }

                // Insert features if provided
                if (features && features.length > 0) {
                  const featureValues = features.map((feature) => [
                    productId,
                    feature,
                  ]);
                  db.query(
                    "INSERT INTO product_features (product_id, feature) VALUES ?",
                    [featureValues],
                    (featErr) => {
                      if (featErr) {
                        return db.rollback(() => {
                          callback(featErr, null);
                        });
                      }

                      // Commit the transaction
                      db.commit((commitErr) => {
                        if (commitErr) {
                          return db.rollback(() => {
                            callback(commitErr, null);
                          });
                        }

                        callback(null, { id: productId, ...data });
                      });
                    }
                  );
                } else {
                  // No features to insert, commit the transaction
                  db.commit((commitErr) => {
                    if (commitErr) {
                      return db.rollback(() => {
                        callback(commitErr, null);
                      });
                    }

                    callback(null, { id: productId, ...data });
                  });
                }
              }
            );
          } else if (features && features.length > 0) {
            // No images but have features
            const featureValues = features.map((feature) => [
              productId,
              feature,
            ]);
            db.query(
              "INSERT INTO product_features (product_id, feature) VALUES ?",
              [featureValues],
              (featErr) => {
                if (featErr) {
                  return db.rollback(() => {
                    callback(featErr, null);
                  });
                }

                // Commit the transaction
                db.commit((commitErr) => {
                  if (commitErr) {
                    return db.rollback(() => {
                      callback(commitErr, null);
                    });
                  }

                  callback(null, { id: productId, ...data });
                });
              }
            );
          } else {
            // No images or features to insert, commit the transaction
            db.commit((commitErr) => {
              if (commitErr) {
                return db.rollback(() => {
                  callback(commitErr, null);
                });
              }

              callback(null, { id: productId, ...data });
            });
          }
        });
      });
    });
  },

  // Update a product
  update: (id, data, callback) => {
    const { images, features, category, ...productData } = data;

    // If category is provided as a name, find or create the category
    const processCategory = (callback) => {
      if (category !== undefined) {
        if (category === null) {
          // Remove category association
          callback(null, null);
        } else {
          // Check if category exists
          db.query(
            "SELECT id FROM categories WHERE name = ?",
            [category],
            (err, results) => {
              if (err) {
                return callback(err, null);
              }

              if (results.length > 0) {
                // Category exists, use its ID
                callback(null, results[0].id);
              } else {
                // Category doesn't exist, create it
                db.query(
                  "INSERT INTO categories SET ?",
                  { name: category },
                  (err, result) => {
                    if (err) {
                      return callback(err, null);
                    }
                    callback(null, result.insertId);
                  }
                );
              }
            }
          );
        }
      } else {
        // Category not provided in update
        callback(null, undefined);
      }
    };

    // Start a transaction
    db.beginTransaction((err) => {
      if (err) {
        return callback(err);
      }

      // Process category first
      processCategory((categoryErr, categoryId) => {
        if (categoryErr) {
          return db.rollback(() => {
            callback(categoryErr);
          });
        }

        // Set category_id if we have one and it's not undefined
        if (categoryId !== undefined) {
          productData.category_id = categoryId;
        }

        // Update the product data if there's anything to update
        if (Object.keys(productData).length > 0) {
          db.query(
            "UPDATE products SET ? WHERE id = ?",
            [productData, id],
            (err) => {
              if (err) {
                return db.rollback(() => {
                  callback(err);
                });
              }

              updateRelatedData();
            }
          );
        } else {
          updateRelatedData();
        }

        function updateRelatedData() {
          // Update images if provided
          if (images !== undefined) {
            // Delete existing images
            db.query(
              "DELETE FROM product_images WHERE product_id = ?",
              [id],
              (delImgErr) => {
                if (delImgErr) {
                  return db.rollback(() => {
                    callback(delImgErr);
                  });
                }

                // Insert new images if any
                if (images && images.length > 0) {
                  const imageValues = images.map((url) => [id, url]);
                  db.query(
                    "INSERT INTO product_images (product_id, image_url) VALUES ?",
                    [imageValues],
                    (imgErr) => {
                      if (imgErr) {
                        return db.rollback(() => {
                          callback(imgErr);
                        });
                      }

                      updateFeatures();
                    }
                  );
                } else {
                  updateFeatures();
                }
              }
            );
          } else {
            updateFeatures();
          }
        }

        function updateFeatures() {
          // Update features if provided
          if (features !== undefined) {
            // Delete existing features
            db.query(
              "DELETE FROM product_features WHERE product_id = ?",
              [id],
              (delFeatErr) => {
                if (delFeatErr) {
                  return db.rollback(() => {
                    callback(delFeatErr);
                  });
                }

                // Insert new features if any
                if (features && features.length > 0) {
                  const featureValues = features.map((feature) => [
                    id,
                    feature,
                  ]);
                  db.query(
                    "INSERT INTO product_features (product_id, feature) VALUES ?",
                    [featureValues],
                    (featErr) => {
                      if (featErr) {
                        return db.rollback(() => {
                          callback(featErr);
                        });
                      }

                      commitTransaction();
                    }
                  );
                } else {
                  commitTransaction();
                }
              }
            );
          } else {
            commitTransaction();
          }
        }

        function commitTransaction() {
          // Commit the transaction
          db.commit((commitErr) => {
            if (commitErr) {
              return db.rollback(() => {
                callback(commitErr);
              });
            }

            callback(null);
          });
        }
      });
    });
  },

  // Delete a product and all related data (cascade delete will handle related tables)
  delete: (id, callback) => {
    db.query("DELETE FROM products WHERE id = ?", [id], callback);
  },
};

module.exports = Product;
