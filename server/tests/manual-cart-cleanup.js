import mongoose from 'mongoose';
import dotenv from 'dotenv';
import UserModel from '../models/user.model.js';
import CartProductModel from '../models/cartProduct.model.js';

dotenv.config();

const manualCartCleanup = async (userId) => {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log('Connected to MongoDB');

        if (!userId) {
            console.log('Usage: node manual-cart-cleanup.js <userId>');
            console.log('Example: node manual-cart-cleanup.js 68a6464e7175f5008e1c389c');
            process.exit(1);
        }

        console.log(`\n=== MANUAL CART CLEANUP FOR USER: ${userId} ===`);

        // Lấy tất cả cart items của user
        const cartItems = await CartProductModel.find({ userId: new mongoose.Types.ObjectId(userId) });
        console.log(`Found ${cartItems.length} cart items to clean up`);

        if (cartItems.length === 0) {
            console.log('No cart items to clean up');
            process.exit(0);
        }

        // Xóa tất cả cart items
        const cartDeleteResult = await CartProductModel.deleteMany({ userId: new mongoose.Types.ObjectId(userId) });
        console.log('✅ Cart delete result:', cartDeleteResult);

        // Xóa references từ User.shopping_cart
        const userUpdateResult = await UserModel.updateOne(
            { _id: new mongoose.Types.ObjectId(userId) },
            { $set: { shopping_cart: [] } }
        );
        console.log('✅ User update result:', userUpdateResult);

        console.log('🎉 Manual cart cleanup completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Manual cleanup error:', error);
        process.exit(1);
    }
};

// Lấy userId từ command line arguments
const userId = process.argv[2];
manualCartCleanup(userId);
