const express = require('express')
// const bcrypt=require('bcryptjs')
// const User=require('../models/User')
const Product = require('../models/Product')
const Category = require('../models/Category')
const db=require('../config/db')


// respAPI //
const router = express.Router()

router.get('/', (req, res) => {
    const categoryid = req.query.category
        Category.getAll((err, Categories) => {
            if (err) {
                console.error(err)
                return res.status(500).send('Error in loading Products')
            }
            //    if category is selected  
            if (categoryid) {
                Product.getByCategory(categoryid, (productErr, products) => {
                    if (productErr) {
                        return res.status(500).send('Error in loading products')
                    }
                    res.render('home', {
                        products: products,
                        Categories: Categories,
                        selectedCategory: categoryid

                    })
                })
            } else {
                // display all product 
                Product.getAll((productErr, products) => {
                    if (productErr) {
                        return res.status(500).send('Error in loading products')
                    }

                    res.render('home', {
                        products: products,
                        Categories: Categories,
                        selectedCategory: ''
                    })
                })
            }
        })
    })


router.get('/products', (req, res) => {
    const categoryId = req.query.category;

    Category.getAll((categoryErr, Categories) => {
        if (categoryErr) {
            return res.status(500).send('Error loading categories');
        }

        if (categoryId && !/^\d+$/.test(categoryId)) {
            return res.status(400).send('Invalid category ID');
        }

        const sql = categoryId
            ? `SELECT * FROM products
               WHERE category_id = ?
               ORDER BY id DESC`
            : `SELECT * FROM products
               ORDER BY id DESC`;

        const values = categoryId ? [categoryId] : [];

        db.query(sql, values, (err, products) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Error loading products');
            }

            res.render('home', {
                products,
                Categories,
                selectedCategoryId: categoryId || null
            });
        });
    });
});


router.get('/cart/:id', (req, res) => {

    const id = req.params.id;

    Product.getByID(id, (err, product) => {

        if (err) {
            console.error(err);
            return res.status(500).send('Database error');
        }

        if (!product) {
            return res.status(404).send('Product not found');
        }

        res.render('cart', {
            title: 'Shopping Cart',
            product,
            layout: false
        });

    });

});

router.post('/cart/add/:id', (req, res) => {

    const productId = req.params.id;
    const quantity = Math.max(1, parseInt(req.body.quantity, 10) || 1);

    Product.getByID(productId, (err, product) => {

        if (err) {
            console.error(err);
            return res.status(500).send('Database error');
        }

        if (!product) {
            return res.status(404).send('Product not found');
        }

        console.log('PRODUCT:', product);

        // Check possible database price column names
        const rawPrice = product.price;

        const price = Number(
            String(rawPrice).replace(/,/g, '').trim()
        );

        if (rawPrice === null ||
            rawPrice === undefined ||
            rawPrice === '' ||
            !Number.isFinite(price) ||
            price <= 0) {

            console.log('INVALID PRICE:', rawPrice);

            return res.status(400).send('Product has an invalid price');
        }

        if (!req.session.cart) {
            req.session.cart = {};
        }

        const cart = req.session.cart;

        if (cart[productId]) {

            // cart[productId].quantity += quantity;  
            cart[productId].quantity=cart[productId].quantity + quantity

            cart[productId].price = price;
            cart[productId].product_name = product.product_name;
            cart[productId].image = product.image;

        } else {

            cart[productId] = {
                id: product.id,
                product_name: product.product_name,
                price: price,
                image: product.image,
                quantity: quantity
            };

        }

        req.session.save(err => {

            if (err) {
                console.error(err);
                return res.status(500).send('Unable to save cart');
            }

            res.redirect('/checkout');

        });

    });

});

    module.exports = router