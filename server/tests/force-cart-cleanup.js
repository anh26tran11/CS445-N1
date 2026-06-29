import mongoose from 'mongoose';
import dotenv from 'dotenv';
import UserModel from '../models/user.model.js';
import CartProductModel from '../models/cartProduct.model.js';

dotenv.config();

const forceCartCleanup = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log('Connected to MongoDB');

        // Thêm sản phẩm vào cart trước
        const user = await UserModel.findOne();
        if (!user) {
            console.log('No user found');
            return;
        }

        console.log(`Adding test cart items for user: ${user.name}`);

        // Tạo 3 cart items test
        const testProducts = [
            '68a843cbf3e807516f273c16',
            '68a84408f3e807516f273c3d',
            '68ac1fa76886d39c175d3928'
        ];

        const cartItems = [];
        for (const productId of testProducts) {
            const cartItem = new CartProductModel({
                userId: user._id,
                productId: new mongoose.Types.ObjectId(productId),
                quantity: 1
            });
            const saved = await cartItem.save();
            cartItems.push(saved);

            // Thêm vào user shopping_cart
            await UserModel.updateOne(
                { _id: user._id },
                { $push: { shopping_cart: saved._id } }
            );
        }

        console.log(`✅ Added ${cartItems.length} cart items`);

        // Hiển thị trạng thái hiện tại
        const currentCartItems = await CartProductModel.find({ userId: user._id });
        const currentUser = await UserModel.findById(user._id);

        console.log('\n=== CURRENT STATE ===');
        console.log(`Cart items: ${currentCartItems.length}`);
        console.log(`User shopping_cart: ${currentUser.shopping_cart.length}`);

        // Bây giờ test xóa cart (giống webhook)
        console.log('\n=== TESTING CART CLEANUP ===');

        const cartItemsToDelete = await CartProductModel.find({ userId: user._id });
        const cartItemIds = cartItemsToDelete.map(item => item._id);

        // Xóa cart items
        const deleteResult = await CartProductModel.deleteMany({ userId: user._id });
        console.log('Cart delete result:', deleteResult);

        // Xóa references
        const updateResult = await UserModel.updateOne(
            { _id: user._id },
            { $set: { shopping_cart: [] } }
        );
        console.log('User update result:', updateResult);

        // Kiểm tra kết quả
        const finalCartItems = await CartProductModel.find({ userId: user._id });
        const finalUser = await UserModel.findById(user._id);

        console.log('\n=== FINAL STATE ===');
        console.log(`Cart items: ${finalCartItems.length}`);
        console.log(`User shopping_cart: ${finalUser.shopping_cart.length}`);

        if (finalCartItems.length === 0 && finalUser.shopping_cart.length === 0) {
            console.log('🎉 SUCCESS: Force cleanup worked!');
        } else {
            console.log('❌ FAILED: Cleanup did not work');
        }

        process.exit(0);
    } catch (error) {
        console.error('Force cleanup error:', error);
        process.exit(1);
    }
};

forceCartCleanup();
