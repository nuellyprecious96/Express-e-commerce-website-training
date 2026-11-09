const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Your MySQL connection

// Display checkout page
router.get('/checkout', (req, res) => {

    const cart = req.session.cart || {};

    if (Object.keys(cart).length === 0) {
        return res.redirect('/cart');
    }

    let subtotal = 0;

    const products = Object.values(cart).map(item => {
        const lineTotal = Number(item.price) * Number(item.quantity);

        subtotal += lineTotal;

        return {
            ...item,
            lineTotal
        };
    });

    const shippingFee = 0;
    const total = subtotal + shippingFee;

    res.render('checkout', {
        title: 'Checkout',
        products,
        subtotal,
        shippingFee,
        total
    });

});


// Process checkout
router.post('/checkout', async (req, res) => {

    const {
        customer_name,
        customer_email,
        customer_phone,
        delivery_address,
        city,
        state,
        payment_method
    } = req.body;

    const cart = req.session.cart || {};

    if (Object.keys(cart).length === 0) {
        return res.redirect('/cart');
    }

    if (
        !customer_name ||
        !customer_email ||
        !customer_phone ||
        !delivery_address ||
        !city ||
        !state ||
        !payment_method
    ) {
        return res.redirect('/checkout');
    }

    let connection;

    try {

        // Start database transaction
        connection = await db.promise().getConnection();

        await connection.beginTransaction();

        const productIds = Object.keys(cart);

        const placeholders = productIds.map(() => '?').join(',');

        // Get actual product prices and stock from database
        const [products] = await connection.query(
            `SELECT id, product_name, price, quantity
             FROM products
             WHERE id IN (${placeholders})
             AND is_active = 1
             FOR UPDATE`,
            productIds
        );

        if (products.length !== productIds.length) {
            throw new Error('Some products are unavailable.');
        }

        let subtotal = 0;

        for (const product of products) {

            const quantity = Number(cart[product.id].quantity);

            if (!Number.isInteger(quantity) || quantity < 1) {
                throw new Error('Invalid product quantity.');
            }

            if (product.quantity < quantity) {
                throw new Error(
                    `${product.product_name} is out of stock or has insufficient quantity.`
                );
            }

            subtotal += Number(product.price) * quantity;
        }

        const shippingFee = 0;
        const total = subtotal + shippingFee;

        const orderNumber = 'MINAZ-' +
            Date.now() + '-' +
            Math.floor(Math.random() * 1000);

        // Insert order
        const [orderResult] = await connection.query(
            `INSERT INTO orders
            (
                order_number,
                customer_name,
                customer_email,
                customer_phone,
                delivery_address,
                city,
                state,
                subtotal,
                shipping_fee,
                total_amount,
                payment_method,
                payment_status,
                status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                orderNumber,
                customer_name,
                customer_email,
                customer_phone,
                delivery_address,
                city,
                state,
                subtotal,
                shippingFee,
                total,
                payment_method,
                'pending',
                'pending'
            ]
        );

        const orderId = orderResult.insertId;

        // Insert order items and update stock
        for (const product of products) {

            const quantity = Number(cart[product.id].quantity);

            const price = Number(product.price);

            const itemSubtotal = price * quantity;

            await connection.query(
                `INSERT INTO order_items
                (order_id, product_id, product_name, price, quantity, subtotal)
                VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    orderId,
                    product.id,
                    product.product_name,
                    price,
                    quantity,
                    itemSubtotal
                ]
            );

            await connection.query(
                `UPDATE products
                 SET quantity = quantity - ?
                 WHERE id = ?`,
                [quantity, product.id]
            );
        }

        // Commit transaction
        await connection.commit();

        // Clear cart after successful order
        req.session.cart = {};

        res.redirect(`/order-success/${orderId}`);

    } catch (error) {

        if (connection) {
            await connection.rollback();
        }

        console.error(error);

        res.status(400).render('checkout', {
            title: 'Checkout',
            error: error.message,
            products: Object.values(cart),
            subtotal: Object.values(cart).reduce(
                (sum, item) => sum + Number(item.price) * Number(item.quantity),
                0
            ),
            shippingFee: 0,
            total: Object.values(cart).reduce(
                (sum, item) => sum + Number(item.price) * Number(item.quantity),
                0
            )
        });

    } finally {

        if (connection) {
            connection.release();
        }

    }

});


// Order success page
router.get('/order-success/:id', async (req, res) => {

    try {

        const [orders] = await db.promise().query(
            'SELECT * FROM orders WHERE id = ?',
            [req.params.id]
        );

        if (orders.length === 0) {
            return res.status(404).send('Order not found');
        }

        const [items] = await db.promise().query(
            'SELECT * FROM order_items WHERE order_id = ?',
            [req.params.id]
        );

        res.render('order-success', {
            title: 'Order Successful',
            order: orders[0],
            items
        });

    } catch (error) {
        console.error(error);
        res.status(500).send('Unable to retrieve order.');
    }

});

module.exports = router;



CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(100) UNIQUE,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(30) NOT NULL,
    delivery_address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    shipping_fee DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(50),
    payment_status VARCHAR(50) DEFAULT 'pending',
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    product_name VARCHAR(255),
    price DECIMAL(12,2),
    quantity INT NOT NULL,
    subtotal DECIMAL(12,2),
    FOREIGN KEY (order_id) REFERENCES orders(id)
        ON DELETE CASCADE
);