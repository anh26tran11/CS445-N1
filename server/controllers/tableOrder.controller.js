import TableOrderModel from '../models/tableOrder.model.js';
import ProductModel from '../models/product.model.js';
import OrderModel from '../models/order.model.js';
import CartProductModel from '../models/cartProduct.model.js';
import UserModel from '../models/user.model.js';
import mongoose from 'mongoose';
import { getUniquePaymentCode } from "./order.controller.js";

// Add items to table order
export async function addItemsToTableOrder(request, response) {
    try {
        const userId = request.userId;
        const { items, tableNumber } = request.body;

        if (!items || items.length === 0) {
            return response.status(400).json({
                message: 'Vui lòng chọn món',
                error: true,
                success: false
            });
        }

        // Get user's table info
        const user = await UserModel.findById(userId);
        console.log('User found:', user ? { id: user._id, role: user.role, email: user.email } : 'null');

        if (!user || user.role !== 'TABLE') {
            console.log('Access denied - User role:', user?.role);
            return response.status(403).json({
                message: 'Chỉ tài khoản bàn mới có thể gọi món',
                error: true,
                success: false
            });
        }

        const tableId = user.linkedTableId;
        const actualTableNumber = tableNumber || user.email.split('_')[1]?.split('@')[0]?.toUpperCase();

        // Find or create active table order
        let tableOrder = await TableOrderModel.findOne({
            tableId: tableId,
            status: 'active'
        });

        // Prepare items with product details
        const itemsToAdd = [];
        let subTotal = 0;

        for (const item of items) {
            const product = await ProductModel.findById(item.productId);
            if (!product) {
                return response.status(404).json({
                    message: `Không tìm thấy sản phẩm`,
                    error: true,
                    success: false
                });
            }

            const itemTotal = product.price * item.quantity;
            subTotal += itemTotal;

            itemsToAdd.push({
                productId: product._id,
                name: product.name,
                price: product.price,
                quantity: item.quantity,
                addedAt: new Date()
            });
        }

        if (tableOrder) {
            // Update existing order
            tableOrder.items.push(...itemsToAdd);
            tableOrder.subTotal += subTotal;
            tableOrder.total = tableOrder.subTotal;
            await tableOrder.save();
        } else {
            // Create new order
            tableOrder = await TableOrderModel.create({
                tableId: tableId,
                tableNumber: actualTableNumber,
                items: itemsToAdd,
                subTotal: subTotal,
                total: subTotal,
                status: 'active'
            });
        }

        // Clear cart after adding to order
        await CartProductModel.deleteMany({ userId: userId });

        return response.status(200).json({
            message: 'Đã thêm món vào đơn',
            error: false,
            success: true,
            data: {
                tableOrder: tableOrder,
                itemsAdded: itemsToAdd.length
            }
        });

    } catch (error) {
        console.error('Error adding items to table order:', error);
        return response.status(500).json({
            message: error.message || 'Lỗi khi thêm món',
            error: true,
            success: false
        });
    }
}

// Get current table order
export async function getCurrentTableOrder(request, response) {
    try {
        const userId = request.userId;

        const user = await UserModel.findById(userId);
        if (!user || user.role !== 'TABLE') {
            return response.status(403).json({
                message: 'Chỉ tài khoản bàn mới có thể xem đơn',
                error: true,
                success: false
            });
        }

        const tableOrder = await TableOrderModel.findOne({
            tableId: user.linkedTableId,
            status: 'active'
        }).populate('items.productId', 'name image');

        if (!tableOrder) {
            return response.status(200).json({
                message: 'Chưa có món nào được gọi',
                error: false,
                success: true,
                data: null
            });
        }

        return response.status(200).json({
            message: 'Lấy đơn hàng thành công',
            error: false,
            success: true,
            data: tableOrder
        });

    } catch (error) {
        console.error('Error getting table order:', error);
        return response.status(500).json({
            message: error.message || 'Lỗi khi lấy đơn hàng',
            error: true,
            success: false
        });
    }
}

// Checkout table order
export async function checkoutTableOrder(request, response) {
    try {
        const userId = request.userId;
        const { paymentMethod } = request.body;

        if (!paymentMethod || !['cash', 'online'].includes(paymentMethod)) {
            return response.status(400).json({
                message: 'Vui lòng chọn phương thức thanh toán',
                error: true,
                success: false
            });
        }

        const user = await UserModel.findById(userId);
        if (!user || user.role !== 'TABLE') {
            return response.status(403).json({
                message: 'Chỉ tài khoản bàn mới có thể thanh toán',
                error: true,
                success: false
            });
        }

        const tableOrder = await TableOrderModel.findOne({
            tableId: user.linkedTableId,
            status: 'active'
        }).populate('items.productId', 'name image');

        if (!tableOrder || tableOrder.items.length === 0) {
            return response.status(404).json({
                message: 'Không có đơn hàng nào để thanh toán',
                error: true,
                success: false
            });
        }

        if (paymentMethod === 'cash') {
            // Cash payment - create orders immediately
            const session = await mongoose.startSession();

            try {
                await session.withTransaction(async () => {
                    const orderItems = tableOrder.items.map(item => ({
                        userId: userId,
                        orderId: `ORD-${new mongoose.Types.ObjectId()}`,
                        productId: item.productId._id || item.productId,
                        product_details: {
                            name: item.name,
                            image: item.productId?.image || []
                        },
                        quantity: item.quantity,
                        payment_status: 'Chờ thanh toán',
                        delivery_address: null,
                        customerContact: null,
                        subTotalAmt: item.price * item.quantity,
                        totalAmt: item.price * item.quantity,
                        status: 'pending',
                        tableNumber: tableOrder.tableNumber,
                        orderType: 'dine_in'
                    }));

                    const newOrders = await OrderModel.insertMany(orderItems, { session });

                    // Clear cart
                    await CartProductModel.deleteMany({ userId: userId }, { session });

                    // Mark table order as paid
                    tableOrder.status = 'paid';
                    tableOrder.paymentMethod = 'cash';
                    tableOrder.paidAt = new Date();
                    await tableOrder.save({ session });
                });

                return response.status(200).json({
                    message: 'Thanh toán thành công',
                    error: false,
                    success: true,
                    data: {
                        totalPaid: tableOrder.total,
                        paymentMethod: 'cash'
                    }
                });

            } finally {
                await session.endSession();
            }

        } else {
            // Online payment - SePay bank transfer
            const paymentCode = await getUniquePaymentCode();
            
            // Save paymentCode into the table order
            tableOrder.paymentId = paymentCode;
            await tableOrder.save();

            const checkoutUrl = `/payment/sepay?paymentId=${paymentCode}`;

            return response.status(200).json({
                message: 'Tạo phiên thanh toán thành công',
                error: false,
                success: true,
                data: {
                    checkoutUrl: checkoutUrl,
                    sessionId: paymentCode
                }
            });
        }

    } catch (error) {
        console.error('Error checkout table order:', error);
        return response.status(500).json({
            message: error.message || 'Lỗi khi thanh toán',
            error: true,
            success: false
        });
    }
}

// Cancel table order
export async function cancelTableOrder(request, response) {
    try {
        const userId = request.userId;

        const user = await UserModel.findById(userId);
        if (!user || user.role !== 'TABLE') {
            return response.status(403).json({
                message: 'Không có quyền hủy đơn',
                error: true,
                success: false
            });
        }

        const tableOrder = await TableOrderModel.findOne({
            tableId: user.linkedTableId,
            status: 'active'
        });

        if (!tableOrder) {
            return response.status(404).json({
                message: 'Không tìm thấy đơn hàng',
                error: true,
                success: false
            });
        }

        tableOrder.status = 'cancelled';
        await tableOrder.save();

        return response.status(200).json({
            message: 'Đã hủy đơn hàng',
            error: false,
            success: true
        });

    } catch (error) {
        console.error('Error cancelling table order:', error);
        return response.status(500).json({
            message: error.message || 'Lỗi khi hủy đơn',
            error: true,
            success: false
        });
    }
}

// Get all active table orders (for Manager/Admin)
export async function getAllActiveTableOrders(request, response) {
    try {
        const userId = request.userId;

        const user = await UserModel.findById(userId);
        if (!user || !['ADMIN', 'MANAGER', 'WAITER', 'CHEF'].includes(user.role)) {
            return response.status(403).json({
                message: 'Không có quyền truy cập',
                error: true,
                success: false
            });
        }

        const tableOrders = await TableOrderModel.find({
            status: 'active'
        }).sort({ updatedAt: -1 });

        return response.status(200).json({
            message: 'Lấy danh sách đơn hàng thành công',
            error: false,
            success: true,
            data: tableOrders
        });

    } catch (error) {
        console.error('Error getting all table orders:', error);
        return response.status(500).json({
            message: error.message || 'Lỗi khi lấy danh sách đơn hàng',
            error: true,
            success: false
        });
    }
}
