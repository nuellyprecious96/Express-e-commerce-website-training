const db = require('../config/db');

const Order = {

    // Create order and save order items in one transaction
    create: (orderData, items, callback) => {

        if (!items || items.length === 0) {
            return callback(new Error('Order must contain products'));
        }

        db.getConnection((err, connection) => {

            if (err) return callback(err);

            connection.beginTransaction(err => {

                if (err) {
                    connection.release();
                    return callback(err);
                }

                const orderSql = `
                    INSERT INTO orders (
                        customer_name,
                        email,
                        phone,
                        address,
                        subtotal,
                        shipping_fee,
                        total,
                        payment_method,
                        status
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;

                const orderValues = [
                    orderData.customer_name,
                    orderData.email,
                    orderData.phone,
                    orderData.address,
                    orderData.subtotal,
                    orderData.shipping_fee,
                    orderData.total,
                    orderData.payment_method,
                    orderData.status || 'Pending'
                ];

                connection.query(orderSql, orderValues, (err, result) => {

                    if (err) return rollback(err);

                    const orderId = result.insertId;

                    const itemSql = `
                        INSERT INTO order_items (
                            order_id,
                            product_id,
                            product_name,
                            price,
                            quantity,
                            subtotal
                        )
                        VALUES ?
                    `;

                    const itemValues = items.map(item => [
                        orderId,
                        item.product_id,
                        item.product_name,
                        item.price,
                        item.quantity,
                        item.subtotal
                    ]);

                    connection.query(itemSql, [itemValues], err => {

                        if (err) return rollback(err);

                        connection.commit(err => {

                            if (err) return rollback(err);

                            connection.release();
                            callback(null, orderId);

                        });

                    });

                });

                function rollback(error) {
                    connection.rollback(() => {
                        connection.release();
                        callback(error);
                    });
                }

            });

        });

    },


    // Get order by ID
    getByID: (id, callback) => {

        const sql = `
            SELECT *
            FROM orders
            WHERE id = ?
            LIMIT 1
        `;

        db.query(sql, [id], (err, results) => {
            if (err) return callback(err, null);
            callback(null, results[0] || null);
        });

    },


    // Get all orders
    getAll: callback => {

        const sql = `
            SELECT *
            FROM orders
            ORDER BY created_at DESC
        `;

        db.query(sql, (err, results) => {
            if (err) return callback(err, null);
            callback(null, results);
        });

    },


    // Get products belonging to an order
    getOrderItems: (orderId, callback) => {

        const sql = `
            SELECT *
            FROM order_items
            WHERE order_id = ?
        `;

        db.query(sql, [orderId], (err, results) => {
            if (err) return callback(err, null);
            callback(null, results);
        });

    },


    // Update order status
    updateStatus: (orderId, status, callback) => {

        const allowedStatuses = [
            'Pending',
            'Processing',
            'Shipped',
            'Delivered',
            'Cancelled'
        ];

        if (!allowedStatuses.includes(status)) {
            return callback(new Error('Invalid order status'));
        }

        const sql = `
            UPDATE orders
            SET status = ?
            WHERE id = ?
        `;

        db.query(sql, [status, orderId], (err, result) => {
            if (err) return callback(err, null);
            callback(null, result);
        });

    }

};

module.exports = Order;


module.exports = Order;