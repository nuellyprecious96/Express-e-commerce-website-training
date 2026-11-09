const express = require("express")
const router = express.Router()
const Category = require('../models/Category')
const Product = require('../models/Product')
const multer = require('multer')
const fs = require('fs')
const path = require('path')

// image storage 
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/products')
    },
    filename: (req, file, cb) => {

        const uniquename = Date.now() + "-" + Math.round(Math.random() * 1E9) + path.extname(file.originalname)

        cb(null, uniquename)
    }
})

const upload = multer({
    storage: storage
})

// create product
router.post('/create', upload.single('image'), (req, res) => {
    const {
        category_id,
        product_name,
        description,
        price,
        quantity,
    } = req.body

    // validation 
    if (!category_id || !product_name || !price || !quantity) {
        return res.status(400).json({
            success: false,
            message: "category,product name , quantity and price are require"
        })
    }
    const image = req.file ? req.file.filename : null

    const product = {
        category_id,
        product_name,
        description,
        price,
        quantity: quantity || 0,
        image
    }

    Product.create(product, (err, result) => {
        if (err) {
            console.error(err)
            return res.status(500).json({
                success: false,
                message: "Failed to create product"
            })
        }
        res.redirect('/admin')
    })
})

router.get('/createproduct', (req, res) => {
    Category.getAll((err, categories) => {
        if (err) {
            console.error(err)
            return res.status(500).send('failed to load categories')
        }
        res.render('product/createproduct', {
            title: "Create Products",
            layout: false,
            categories: categories
        })
    })
})

router.get('/createcategory', (req, res) => {
    res.render('product/createcategory', {
        title: "Create Category",
        layout: false
    })
})

router.post('/createcategory', (req, res) => {
    const { category } = req.body;

    // Validation
    if (!category || category.trim() === '') {
        return res.status(400).json({
            success: false,
            message: "Category field is required"
        });
    }

    Category.create(category.trim(), (err, result) => {

        if (err) {
            console.error("Category creation error:", err);

            return res.status(500).json({
                success: false,
                message: "Failed to create category"
            });
        }

        // Success
        res.redirect('/admin');
    });
});


//  show products 
router.get('/show/products', (req, res) => {
    Product.getAll((err, products) => {
        if (err) {
            console.error(err)
            return res.status(500).send("database error")
        }

        res.render('product/products', {
            title: "All  Products",
            layout: false,
            products

        })
    })
})


// Edit product - display the edit form

router.get('/product/:id/edit', (req, res) => {
    const id = req.params.id;

    Product.getByID(id, (err, product) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Database error');
        }

        if (!product) {
            return res.status(404).send('Product not found');
        }

        Category.getAll((err, categories) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Category database error');
            }

            const updatedCategories = categories.map(category => ({
                ...category,
                selected: String(category.id) === String(product.category_id)
            }));

            res.render('product/editproduct', {
                title: 'Edit Product',
                layout: false,
                product,
                categories: updatedCategories
            });
        });
    });
});


// update product

router.post('/product/:id/edit', upload.single('image'), (req, res) => {
    const id = req.params.id;
    const { category_id, product_name, description, price, quantity } = req.body;
    const image = req.file ? req.file.filename : null;

    Product.update(id, { category_id, product_name, description, price, quantity, image }, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Database error');
        }
        res.redirect('/show/products');
    });
});

// delete route 
router.post('/delete/:id', (req, res) => {
    const id = req.params.id;

    if (!/^\d+$/.test(id)) {
        return res.status(400).send('Invalid product ID');
    }

    Product.getByID(id, (err, product) => {
        if (err) {
            console.error('Fetch error:', err);
            return res.status(500).send('Database error');
        }

        // getByID returns one product object
        if (!product) {
            return res.status(404).send('Product not found');
        }

        Product.delete(id, (deleteErr) => {
            if (deleteErr) {
                console.error('Delete error:', deleteErr);
                return res.status(500).send('Failed to delete product');
            }

            // No image to delete
            if (!product.image) {
                return res.redirect('/show/products');
            }

            const imagePath = path.join(
                __dirname,
                '../public/uploads/products',
                path.basename(product.image)
            );

            fs.unlink(imagePath, (fileErr) => {
                if (fileErr && fileErr.code !== 'ENOENT') {
                    console.error('Image deletion failed:', fileErr);
                }

                return res.redirect('/show/products');
            });
        });
    });
});




module.exports = router