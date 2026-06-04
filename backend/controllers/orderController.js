const Order = require('../models/Order');
const Product = require('../models/Product');
const Reservation = require('../models/Reservation');
const Startup = require('../models/Startup');
const { createNotification } = require('../utils/socialHelpers');

// Helper: Release expired reservations
const cleanupExpiredReservations = async () => {
    const now = new Date();
    // Find active reservations that have expired
    const expiredReservations = await Reservation.find({
        status: 'active',
        expiresAt: { $lt: now }
    });

    for (const reservation of expiredReservations) {
        // Decrement reservedStock on product
        await Product.findByIdAndUpdate(reservation.productId, {
            $inc: { reservedStock: -reservation.quantity }
        });
        
        // Mark reservation as expired (or delete)
        reservation.status = 'cancelled'; // or 'expired'
        await reservation.save();
    }
};

// @desc    Lock stock for checkout
// @route   POST /api/orders/lock
// @access  Private (Buyer)
exports.lockStock = async (req, res) => {
    try {
        await cleanupExpiredReservations(); // Lazy cleanup

        const { productId, quantity } = req.body;
        const qty = parseInt(quantity);

        if (qty <= 0) {
            return res.status(400).json({ success: false, error: 'Invalid quantity' });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }

        if (!product.isActive) {
            return res.status(400).json({ success: false, error: 'Product is not available' });
        }

        // Check availability
        // available = stock - reservedStock
        const availableStock = product.stock - product.reservedStock;

        if (availableStock < qty) {
            return res.status(400).json({ success: false, error: 'Insufficient stock available' });
        }

        // Atomically increment reservedStock
        // Use findOneAndUpdate with condition to prevent race conditions
        const updatedProduct = await Product.findOneAndUpdate(
            { 
                _id: productId, 
                // Ensure we still have enough stock at the moment of update
                $expr: { $gte: [ { $subtract: ["$stock", "$reservedStock"] }, qty ] }
            },
            { $inc: { reservedStock: qty } },
            { new: true }
        );

        if (!updatedProduct) {
            return res.status(400).json({ success: false, error: 'Stock update failed - Try again' });
        }

        // Create Reservation record
        const reservation = await Reservation.create({
            userId: req.user.id,
            productId,
            quantity: qty,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
            status: 'active'
        });

        // Notify via Socket
        const io = req.app.get('io');
        if (io) {
            io.emit('stock_update', {
                productId: product._id,
                availableStock: updatedProduct.stock - updatedProduct.reservedStock
            });
        }

        res.status(200).json({
            success: true,
            data: {
                reservationId: reservation._id,
                expiresAt: reservation.expiresAt
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Create Order (Finalize Checkout)
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res) => {
    try {
        const { reservationId, reservationIds, shippingAddress } = req.body;

        // Handle Batch Orders
        if (reservationIds && Array.isArray(reservationIds) && reservationIds.length > 0) {
            const orders = [];
            const io = req.app.get('io');

            for (const resId of reservationIds) {
                const reservation = await Reservation.findById(resId);
                if (!reservation || reservation.status !== 'active') continue; // Skip invalid/expired
                if (reservation.userId.toString() !== req.user.id) continue;

                const product = await Product.findById(reservation.productId);
                if (!product) continue;

                const totalAmount = product.price * reservation.quantity;

                const order = await Order.create({
                    userId: req.user.id,
                    productId: reservation.productId,
                    founderId: product.founderId,
                    quantity: reservation.quantity,
                    unitPrice: product.price,
                    totalAmount,
                    status: 'pending',
                    shippingAddress
                });

                orders.push(order);

                const finalProduct = await Product.findByIdAndUpdate(reservation.productId, {
                    $inc: { 
                        stock: -reservation.quantity,
                        reservedStock: -reservation.quantity 
                    }
                }, { new: true });

                reservation.status = 'completed';
                await reservation.save();

                if (io) {
                    io.to(product.founderId.toString()).emit('new_order', {
                        orderId: order._id,
                        productName: product.name,
                        quantity: order.quantity
                    });
                    io.emit('stock_update', {
                        productId: product._id,
                        availableStock: finalProduct.stock - finalProduct.reservedStock
                    });
                }

                await createNotification(
                    {
                        recipient: product.founderId,
                        sender: req.user.id,
                        type: 'order',
                        entityId: order._id,
                        entityType: 'Order',
                        content: `${order.quantity} x ${product.name} for $${totalAmount}`
                    },
                    io
                );
            }
            return res.status(201).json({ success: true, data: orders });
        }

        // Handle Single Order (Legacy/Single Buy)
        const reservation = await Reservation.findById(reservationId);
        if (!reservation || reservation.status !== 'active') {
            return res.status(400).json({ success: false, error: 'Reservation expired or invalid' });
        }

        if (reservation.userId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, error: 'Unauthorized' });
        }

        // Verify expiry again
        if (new Date() > reservation.expiresAt) {
            // It expired. Trigger cleanup if not already done.
            // But we can just fail here and let cleanup happen later.
            // Or force cleanup now.
            await Product.findByIdAndUpdate(reservation.productId, {
                $inc: { reservedStock: -reservation.quantity }
            });
            reservation.status = 'cancelled';
            await reservation.save();
            return res.status(400).json({ success: false, error: 'Reservation expired' });
        }

        const product = await Product.findById(reservation.productId);
        if (!product) {
             return res.status(404).json({ success: false, error: 'Product not found' });
        }

        // Calculate Total
        const totalAmount = product.price * reservation.quantity;

        // Create Order
        const order = await Order.create({
            userId: req.user.id,
            productId: reservation.productId,
            founderId: product.founderId,
            quantity: reservation.quantity,
            unitPrice: product.price,
            totalAmount,
            status: 'pending', // Paid
            shippingAddress
        });

        // Update Product Stock (Finalize)
        // Decrease stock AND reservedStock
        const finalProduct = await Product.findByIdAndUpdate(reservation.productId, {
            $inc: { 
                stock: -reservation.quantity,
                reservedStock: -reservation.quantity 
            }
        }, { new: true });

        // Update Reservation Status
        reservation.status = 'completed';
        await reservation.save();

        // Notify Founder
        const io = req.app.get('io');
        if (io) {
            io.to(product.founderId.toString()).emit('new_order', {
                orderId: order._id,
                productName: product.name,
                quantity: order.quantity
            });

            io.emit('stock_update', {
                productId: product._id,
                availableStock: finalProduct.stock - finalProduct.reservedStock
            });
        }

        await createNotification(
            {
                recipient: product.founderId,
                sender: req.user.id,
                type: 'order',
                entityId: order._id,
                entityType: 'Order',
                content: `${order.quantity} x ${product.name} for $${totalAmount}`
            },
            io
        );

        res.status(201).json({
            success: true,
            data: order
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Lock multiple items for cart checkout
// @route   POST /api/orders/lock-batch
// @access  Private
exports.lockStockBatch = async (req, res) => {
    const { items } = req.body; // [{ productId, quantity }]
    const lockedReservations = [];
    
    try {
        await cleanupExpiredReservations();
        
        for (const item of items) {
            const qty = parseInt(item.quantity);
            if (qty <= 0) throw new Error(`Invalid quantity for product ${item.productId}`);
            
            const product = await Product.findById(item.productId);
            if (!product || !product.isActive) throw new Error(`Product ${item.productId} unavailable`);
            
            const availableStock = product.stock - product.reservedStock;
            if (availableStock < qty) throw new Error(`Insufficient stock for ${product.name}`);
            
            const updatedProduct = await Product.findOneAndUpdate(
                { 
                    _id: item.productId, 
                    $expr: { $gte: [ { $subtract: ["$stock", "$reservedStock"] }, qty ] }
                },
                { $inc: { reservedStock: qty } },
                { new: true }
            );
            
            if (!updatedProduct) throw new Error(`Failed to lock stock for ${product.name}`);
            
            const reservation = await Reservation.create({
                userId: req.user.id,
                productId: item.productId,
                quantity: qty,
                expiresAt: new Date(Date.now() + 10 * 60 * 1000),
                status: 'active'
            });
            
            lockedReservations.push(reservation);
            
            // Notify via Socket
            const io = req.app.get('io');
            if (io) {
                io.emit('stock_update', {
                    productId: product._id,
                    availableStock: updatedProduct.stock - updatedProduct.reservedStock
                });
            }
        }
        
        res.status(200).json({
            success: true,
            data: {
                reservations: lockedReservations, // Array of reservation objects
                expiresAt: lockedReservations[0].expiresAt // Same expiry for batch roughly
            }
        });
        
    } catch (error) {
        // Rollback
        console.error("Batch lock failed, rolling back:", error.message);
        for (const reservation of lockedReservations) {
             await Product.findByIdAndUpdate(reservation.productId, { $inc: { reservedStock: -reservation.quantity } });
             await Reservation.findByIdAndUpdate(reservation._id, { status: 'cancelled' });
             
             // Notify rollback
             const updatedProduct = await Product.findById(reservation.productId);
             const io = req.app.get('io');
             if (io && updatedProduct) {
                io.emit('stock_update', {
                    productId: updatedProduct._id,
                    availableStock: updatedProduct.stock - updatedProduct.reservedStock
                });
             }
        }
        res.status(400).json({ success: false, error: error.message || 'One or more items are out of stock' });
    }
};

// @desc    Release reserved stock (Cancel Checkout)
// @route   POST /api/orders/release
// @access  Private
exports.releaseStock = async (req, res) => {
    try {
        const { reservationId } = req.body;

        const reservation = await Reservation.findById(reservationId);
        if (!reservation || reservation.status !== 'active') {
            return res.status(400).json({ success: false, error: 'Reservation invalid' });
        }

        if (reservation.userId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, error: 'Unauthorized' });
        }

        // Restore reservedStock
        const updatedProduct = await Product.findByIdAndUpdate(reservation.productId, {
            $inc: { reservedStock: -reservation.quantity }
        }, { new: true });

        reservation.status = 'cancelled';
        await reservation.save();

        // Notify via Socket
        const io = req.app.get('io');
        if (io) {
            io.emit('stock_update', {
                productId: updatedProduct._id,
                availableStock: updatedProduct.stock - updatedProduct.reservedStock
            });
        }

        res.status(200).json({ success: true, message: 'Stock released' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Get My Orders
// @route   GET /api/orders/myorders
// @access  Private
exports.getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.user.id })
            .populate('productId', 'name price images')
            .sort({ createdAt: -1 });
            
        res.status(200).json({ success: true, data: orders });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};
