import mongoose from 'mongoose';
import dotenv from 'dotenv';
import UserModel from '../models/user.model.js';
import CartProductModel from '../models/cartProduct.model.js';
import OrderModel from '../models/order.model.js';

dotenv.config();

const resetTestData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log('Connected to MongoDB');

        // 1. Xóa tất cả orders
        const orderDeleteResult = await OrderModel.deleteMany({});
        console.log(`✅ Deleted ${orderDeleteResult.deletedCount} orders`);

        // 2. Xóa tất cả cart items
        const cartDeleteResult = await CartProductModel.deleteMany({});
        console.log(`✅ Deleted ${cartDeleteResult.deletedCount} cart items`);

        // 3. Reset shopping_cart trong User model
        const userUpdateResult = await UserModel.updateMany(
            {},
            { $set: { shopping_cart: [] } }
        );
        console.log(`✅ Reset shopping_cart for ${userUpdateResult.modifiedCount} users`);

        // 4. Hiển thị trạng thái hiện tại
        const remainingOrders = await OrderModel.countDocuments();
        const remainingCartItems = await CartProductModel.countDocuments();
        const usersWithCart = await UserModel.countDocuments({ shopping_cart: { $ne: [] } });

        console.log('\n=== CURRENT STATE ===');
        console.log(`Orders: ${remainingOrders}`);
        console.log(`Cart Items: ${remainingCartItems}`);
        console.log(`Users with cart: ${usersWithCart}`);
        console.log('\n✅ Database reset completed - Ready for testing!');

        process.exit(0);
    } catch (error) {
        console.error('Reset error:', error);
        process.exit(1);
    }
};

resetTestData();
