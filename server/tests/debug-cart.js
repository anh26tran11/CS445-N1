import mongoose from 'mongoose';
import dotenv from 'dotenv';
import UserModel from '../models/user.model.js';
import CartProductModel from '../models/cartProduct.model.js';

dotenv.config();

const debugCart = async () => {
    try {
        // Kết nối database
        await mongoose.connect(process.env.MONGODB_URL);
        console.log('Connected to MongoDB');

        // Lấy tất cả users có cart items
        const users = await UserModel.find({ shopping_cart: { $exists: true, $ne: [] } });
        console.log(`Found ${users.length} users with cart items`);

        for (const user of users) {
            console.log(`\n=== USER: ${user.name} (${user._id}) ===`);
            console.log('Shopping cart references:', user.shopping_cart);

            // Lấy cart items thực tế
            const cartItems = await CartProductModel.find({ userId: user._id });
            console.log('Actual cart items:', cartItems.map(item => ({
                _id: item._id,
                productId: item.productId,
                quantity: item.quantity
            })));

            // Kiểm tra consistency
            const cartItemIds = cartItems.map(item => item._id.toString());
            const shoppingCartIds = user.shopping_cart.map(id => id.toString());

            console.log('Cart item IDs:', cartItemIds);
            console.log('Shopping cart IDs:', shoppingCartIds);

            const mismatches = shoppingCartIds.filter(id => !cartItemIds.includes(id));
            if (mismatches.length > 0) {
                console.log('❌ MISMATCH FOUND! Invalid references:', mismatches);

                // Tự động sửa - xóa references không hợp lệ
                await UserModel.updateOne(
                    { _id: user._id },
                    { $pull: { shopping_cart: { $in: mismatches } } }
                );
                console.log('✅ Fixed invalid references');
            } else {
                console.log('✅ Data is consistent');
            }
        }

        // Tìm cart items không có reference trong user
        const allCartItems = await CartProductModel.find({});
        console.log(`\n=== CHECKING ${allCartItems.length} CART ITEMS ===`);

        for (const cartItem of allCartItems) {
            const user = await UserModel.findOne({
                _id: cartItem.userId,
                shopping_cart: cartItem._id
            });

            if (!user) {
                console.log(`❌ ORPHANED CART ITEM: ${cartItem._id} (productId: ${cartItem.productId})`);
                // Tự động thêm reference
                await UserModel.updateOne(
                    { _id: cartItem.userId },
                    { $addToSet: { shopping_cart: cartItem._id } }
                );
                console.log('✅ Added missing reference');
            }
        }

        console.log('\n=== DEBUG COMPLETED ===');
        process.exit(0);
    } catch (error) {
        console.error('Debug error:', error);
        process.exit(1);
    }
};

debugCart();
