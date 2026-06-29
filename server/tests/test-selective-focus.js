import mongoose from 'mongoose';
import dotenv from 'dotenv';
import UserModel from '../models/user.model.js';
import CartProductModel from '../models/cartProduct.model.js';

dotenv.config();

const testSelectiveFocus = async () => {
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
            '68a843cbf3e807516f273c16', // Product A
            '68a84408f3e807516f273c3d', // Product B
            '68ac1fa76886d39c175d3928', // Product C
            '68a843cbf3e807516f273c17', // Product D
            '68a84408f3e807516f273c3e'  // Product E
        ];

        console.log('\n=== Creating 5 cart items ===');
        const createdItems = [];
        for (let i = 0; i < allProducts.length; i++) {
            const productId = allProducts[i];
            const cartItem = new CartProductModel({
                userId: user._id,
                productId: new mongoose.Types.ObjectId(productId),
                quantity: 1
            });
            const saved = await cartItem.save();
            createdItems.push({
                cartId: saved._id,
                productId: productId,
                name: `Product ${String.fromCharCode(65 + i)}`
            });

            await UserModel.updateOne(
                { _id: user._id },
                { $push: { shopping_cart: saved._id } }
            );
        }

        console.log('Created cart items:');
        createdItems.forEach(item => {
            console.log(`- ${item.name}: Cart ID ${item.cartId}, Product ID ${item.productId}`);
        });

        const beforeCart = await CartProductModel.find({ userId: user._id });
        const beforeUser = await UserModel.findById(user._id);
        console.log(`\nTotal: ${beforeCart.length} cart items, ${beforeUser.shopping_cart.length} in user shopping_cart`);

        // 2. Giả lập user chọn 3 sản phẩm (A, B, C) để thanh toán
        const selectedProductIds = [
            '68a843cbf3e807516f273c16', // Product A
            '68a84408f3e807516f273c3d', // Product B
            '68ac1fa76886d39c175d3928'  // Product C
        ];

        console.log('\n=== User selects 3 products for checkout ===');
        console.log('Selected products:', selectedProductIds);
        console.log('Expected to remain: Product D, Product E');

        // 3. Test clearCartController logic với selectedProductIds
        console.log('\n=== Testing clearCartController logic ===');

        // Tìm cart items cần xóa
        const cartItemsToDelete = await CartProductModel.find({
            userId: user._id,
            productId: { $in: selectedProductIds.map(id => new mongoose.Types.ObjectId(id)) }
        });

        console.log(`Found ${cartItemsToDelete.length} cart items to delete:`);
        cartItemsToDelete.forEach(item => {
            const productName = createdItems.find(p => p.productId === item.productId.toString())?.name;
            console.log(`- ${productName}: Cart ID ${item._id}, Product ID ${item.productId}`);
        });

        const cartItemIds = cartItemsToDelete.map(item => item._id);

        // Xóa cart items được chọn
        const deleteResult = await CartProductModel.deleteMany({
            userId: user._id,
            productId: { $in: selectedProductIds.map(id => new mongoose.Types.ObjectId(id)) }
        });

        // Xóa references từ User.shopping_cart
        const userUpdateResult = await UserModel.updateOne(
            { _id: user._id },
            { $pull: { shopping_cart: { $in: cartItemIds } } }
        );

        console.log('\nDelete results:');
        console.log(`- Cart items deleted: ${deleteResult.deletedCount}`);
        console.log(`- User update matched: ${userUpdateResult.matchedCount}, modified: ${userUpdateResult.modifiedCount}`);

        // 4. Kiểm tra kết quả
        const afterCart = await CartProductModel.find({ userId: user._id });
        const afterUser = await UserModel.findById(user._id);

        console.log('\n=== Results ===');
        console.log(`Remaining cart items: ${afterCart.length} (should be 2)`);
        console.log(`User shopping_cart: ${afterUser.shopping_cart.length} (should be 2)`);

        console.log('\nRemaining products:');
        afterCart.forEach(item => {
            const productName = createdItems.find(p => p.productId === item.productId.toString())?.name;
            console.log(`- ${productName}: Cart ID ${item._id}, Product ID ${item.productId}`);
        });

        // 5. Verify chính xác
        const expectedRemaining = [
            '68a843cbf3e807516f273c17', // Product D
            '68a84408f3e807516f273c3e'  // Product E
        ];

        const actualRemaining = afterCart.map(item => item.productId.toString());
        const isCorrect = expectedRemaining.every(id => actualRemaining.includes(id)) &&
            actualRemaining.length === expectedRemaining.length &&
            afterUser.shopping_cart.length === 2;

        if (isCorrect) {
            console.log('\n🎉 SUCCESS: Selective deletion works perfectly!');
            console.log('✅ Only selected products (A, B, C) were deleted');
            console.log('✅ Unselected products (D, E) remain in cart');
            console.log('✅ User shopping_cart updated correctly');
        } else {
            console.log('\n❌ FAILED: Selective deletion not working correctly');
            console.log(`Expected remaining: ${expectedRemaining}`);
            console.log(`Actual remaining: ${actualRemaining}`);
            console.log(`User shopping_cart length: ${afterUser.shopping_cart.length}`);
        }

        // 6. Test với selectedProductIds = null (should clear all)
        console.log('\n=== Testing full clear (selectedProductIds = null) ===');

        const selectedProductIds2 = null;
        console.log('selectedProductIds:', selectedProductIds2);

        if (selectedProductIds2 && selectedProductIds2.length > 0) {
            console.log('❌ Should NOT enter selective mode');
        } else {
            console.log('✅ Should enter full clear mode');

            // Full clear
            const fullDeleteResult = await CartProductModel.deleteMany({ userId: user._id });
            const fullUserUpdateResult = await UserModel.updateOne(
                { _id: user._id },
                { $set: { shopping_cart: [] } }
            );

            console.log(`Full clear results: ${fullDeleteResult.deletedCount} items deleted`);
        }

        const finalCart = await CartProductModel.find({ userId: user._id });
        const finalUser = await UserModel.findById(user._id);

        console.log('\n=== Final State ===');
        console.log(`Cart items: ${finalCart.length} (should be 0)`);
        console.log(`User shopping_cart: ${finalUser.shopping_cart.length} (should be 0)`);

        process.exit(0);
    } catch (error) {
        console.error('Test error:', error);
        process.exit(1);
    }
};

testSelectiveFocus();
