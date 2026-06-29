import mongoose from 'mongoose';
import dotenv from 'dotenv';
import UserModel from '../models/user.model.js';
import CartProductModel from '../models/cartProduct.model.js';

dotenv.config();

const testDebugSelective = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log('Connected to MongoDB');

        const user = await UserModel.findOne();
        if (!user) {
            console.log('❌ No user found');
            return;
        }

        // 1. Tạo 5 cart items
        const allProducts = [
            '68a843cbf3e807516f273c16',
            '68a84408f3e807516f273c3d',
            '68ac1fa76886d39c175d3928',
            '68a843cbf3e807516f273c17',
            '68a84408f3e807516f273c3e'
        ];

        console.log('\n=== Creating 5 cart items ===');
        for (const productId of allProducts) {
            const cartItem = new CartProductModel({
                userId: user._id,
                productId: new mongoose.Types.ObjectId(productId),
                quantity: 1
            });
            const saved = await cartItem.save();

            await UserModel.updateOne(
                { _id: user._id },
                { $push: { shopping_cart: saved._id } }
            );
        }

        const beforeCart = await CartProductModel.find({ userId: user._id });
        console.log(`✅ Created ${beforeCart.length} cart items`);
        beforeCart.forEach(item => {
            console.log(`- Product: ${item.productId}, Cart ID: ${item._id}`);
        });

        // 2. Test với selectedProductIds = null (should clear all)
        console.log('\n=== Test 1: selectedProductIds = null ===');
        const selectedProductIds1 = null;
        console.log('clearCartController received:', { userId: user._id, selectedProductIds: selectedProductIds1 });

        if (selectedProductIds1 && selectedProductIds1.length > 0) {
            console.log('❌ Should NOT enter selective mode');
        } else {
            console.log('✅ Entering full clear mode');
        }

        // 3. Test với selectedProductIds = [] (should clear all)
        console.log('\n=== Test 2: selectedProductIds = [] ===');
        const selectedProductIds2 = [];
        console.log('clearCartController received:', { userId: user._id, selectedProductIds: selectedProductIds2 });

        if (selectedProductIds2 && selectedProductIds2.length > 0) {
            console.log('❌ Should NOT enter selective mode');
        } else {
            console.log('✅ Entering full clear mode');
        }

        // 4. Test với selectedProductIds có giá trị
        console.log('\n=== Test 3: selectedProductIds with values ===');
        const selectedProductIds3 = [
            '68a843cbf3e807516f273c16',
            '68a84408f3e807516f273c3d'
        ];
        console.log('clearCartController received:', { userId: user._id, selectedProductIds: selectedProductIds3 });

        if (selectedProductIds3 && selectedProductIds3.length > 0) {
            console.log('✅ Entering selective mode');
            console.log('Clearing selected products:', selectedProductIds3);

            // Test tìm cart items
            const cartItemsToDelete = await CartProductModel.find({
                userId: user._id,
                productId: { $in: selectedProductIds3 }
            });
            console.log(`Found ${cartItemsToDelete.length} cart items to delete:`);
            cartItemsToDelete.forEach(item => {
                console.log(`- Product: ${item.productId}, Cart ID: ${item._id}`);
            });
        } else {
            console.log('❌ Should enter selective mode');
        }

        // 5. Test thực tế xóa selective
        console.log('\n=== Test 4: Actually delete selective items ===');
        const cartItemsToDelete = await CartProductModel.find({
            userId: user._id,
            productId: { $in: selectedProductIds3 }
        });
        const cartItemIds = cartItemsToDelete.map(item => item._id);

        const deleteResult = await CartProductModel.deleteMany({
            userId: user._id,
            productId: { $in: selectedProductIds3 }
        });

        const userUpdateResult = await UserModel.updateOne(
            { _id: user._id },
            { $pull: { shopping_cart: { $in: cartItemIds } } }
        );

        console.log('Delete result:', deleteResult);
        console.log('User update result:', userUpdateResult);

        // 6. Kiểm tra kết quả
        const afterCart = await CartProductModel.find({ userId: user._id });
        const afterUser = await UserModel.findById(user._id);

        console.log('\n=== Final Results ===');
        console.log(`Remaining cart items: ${afterCart.length}`);
        console.log(`Remaining user shopping_cart: ${afterUser.shopping_cart.length}`);
        afterCart.forEach(item => {
            console.log(`- Product: ${item.productId}, Cart ID: ${item._id}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Test error:', error);
        process.exit(1);
    }
};

testDebugSelective();
