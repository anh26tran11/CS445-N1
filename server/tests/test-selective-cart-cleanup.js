import mongoose from 'mongoose';
import dotenv from 'dotenv';
import UserModel from '../models/user.model.js';
import CartProductModel from '../models/cartProduct.model.js';

dotenv.config();

const testSelectiveCartCleanup = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log('Connected to MongoDB');

        const user = await UserModel.findOne();
        if (!user) {
            console.log('❌ No user found');
            return;
        }

        console.log(`Testing selective cart cleanup with user: ${user.name}`);

        // 1. Tạo 5 cart items để test
        const allProducts = [
            '68a843cbf3e807516f273c16',
            '68a84408f3e807516f273c3d',
            '68ac1fa76886d39c175d3928',
            '68a843cbf3e807516f273c17',
            '68a84408f3e807516f273c3e'
        ];

        console.log('\n=== STEP 1: Creating 5 cart items ===');
        const cartItems = [];
        for (const productId of allProducts) {
            const cartItem = new CartProductModel({
                userId: user._id,
                productId: new mongoose.Types.ObjectId(productId),
                quantity: 1
            });
            const saved = await cartItem.save();
            cartItems.push(saved);

            await UserModel.updateOne(
                { _id: user._id },
                { $push: { shopping_cart: saved._id } }
            );
        }

        const beforeCart = await CartProductModel.find({ userId: user._id });
        const beforeUser = await UserModel.findById(user._id);
        console.log(`✅ Created ${cartItems.length} cart items`);
        console.log(`Total cart items: ${beforeCart.length}, User shopping_cart: ${beforeUser.shopping_cart.length}`);

        // 2. Test xóa chỉ 3 sản phẩm được chọn (giả lập thanh toán một phần)
        const selectedProductIds = [
            '68a843cbf3e807516f273c16',
            '68a84408f3e807516f273c3d',
            '68ac1fa76886d39c175d3928'
        ];

        console.log('\n=== STEP 2: Testing selective cleanup ===');
        console.log('Selected products to remove:', selectedProductIds);

        // Test logic từ clearCartController
        const cartItemsToDelete = await CartProductModel.find({
            userId: user._id,
            productId: { $in: selectedProductIds }
        });
        const cartItemIds = cartItemsToDelete.map(item => item._id);

        console.log(`Found ${cartItemsToDelete.length} cart items to delete`);
        console.log('Cart item IDs to delete:', cartItemIds.map(id => id.toString()));

        // Xóa cart items được chọn
        const deleteResult = await CartProductModel.deleteMany({
            userId: user._id,
            productId: { $in: selectedProductIds }
        });

        // Xóa references từ User.shopping_cart
        const userUpdateResult = await UserModel.updateOne(
            { _id: user._id },
            { $pull: { shopping_cart: { $in: cartItemIds } } }
        );

        console.log('Delete result:', deleteResult);
        console.log('User update result:', userUpdateResult);

        // 3. Kiểm tra kết quả
        const afterCart = await CartProductModel.find({ userId: user._id });
        const afterUser = await UserModel.findById(user._id);

        console.log('\n=== RESULTS ===');
        console.log(`Remaining cart items: ${afterCart.length} (should be 2)`);
        console.log(`Remaining user shopping_cart: ${afterUser.shopping_cart.length} (should be 2)`);

        console.log('\nRemaining products:');
        afterCart.forEach(item => {
            console.log(`- Product ID: ${item.productId}, Cart Item ID: ${item._id}`);
        });

        // 4. Kiểm tra xem các sản phẩm còn lại có đúng không
        const remainingProductIds = afterCart.map(item => item.productId.toString());
        const expectedRemaining = [
            '68a843cbf3e807516f273c17',
            '68a84408f3e807516f273c3e'
        ];

        const isCorrect = expectedRemaining.every(id => remainingProductIds.includes(id)) &&
            remainingProductIds.length === expectedRemaining.length;

        if (isCorrect && afterUser.shopping_cart.length === 2) {
            console.log('\n🎉 SUCCESS: Selective cart cleanup works perfectly!');
            console.log('✅ Only selected items were removed');
            console.log('✅ Unselected items remain in cart');
            console.log('✅ User shopping_cart updated correctly');
        } else {
            console.log('\n❌ ISSUE: Selective cleanup failed');
            console.log(`Expected remaining: ${expectedRemaining}`);
            console.log(`Actual remaining: ${remainingProductIds}`);
        }

        process.exit(0);
    } catch (error) {
        console.error('Test error:', error);
        process.exit(1);
    }
};

testSelectiveCartCleanup();
