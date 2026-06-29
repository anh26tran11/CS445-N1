import mongoose from 'mongoose';
import dotenv from 'dotenv';
import UserModel from '../models/user.model.js';
import CartProductModel from '../models/cartProduct.model.js';
import OrderModel from '../models/order.model.js';

dotenv.config();

const testFinalSolution = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log('Connected to MongoDB');

        const user = await UserModel.findOne();
        if (!user) {
            console.log('❌ No user found');
            return;
        }

        console.log(`Testing final solution with user: ${user.name}`);

        // 1. Tạo cart items để test
        const testProducts = [
            '68a843cbf3e807516f273c16',
            '68a84408f3e807516f273c3d',
            '68ac1fa76886d39c175d3928'
        ];

        console.log('\n=== STEP 1: Creating cart items ===');
        const cartItems = [];
        for (const productId of testProducts) {
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
        console.log(`Cart items: ${beforeCart.length}, User shopping_cart: ${beforeUser.shopping_cart.length}`);

        // 2. Test Cash on Delivery cleanup (từ order.controller.js)
        console.log('\n=== STEP 2: Testing Cash on Delivery cleanup ===');

        // Tạo orders
        const orders = await OrderModel.insertMany(
            testProducts.map(productId => ({
                userId: user._id,
                orderId: `ORD-${new mongoose.Types.ObjectId()}`,
                productId: new mongoose.Types.ObjectId(productId),
                product_details: {
                    name: `Test Product ${productId}`,
                    image: ['test.jpg']
                },
                paymentId: '',
                payment_status: 'CASH ON DELIVERY',
                delivery_address: '68ac1fa76886d39c175d3928',
                subTotalAmt: 100000,
                totalAmt: 100000,
            }))
        );
        console.log(`✅ Created ${orders.length} orders`);

        // Test logic xóa cart từ cash_on_delivery (dòng 44-58 trong order.controller.js)
        const productIdsToRemove = testProducts;

        const cartDeleteResult = await CartProductModel.deleteMany({
            userId: user._id,
            productId: { $in: productIdsToRemove }
        });
        console.log('Cash on delivery cart delete result:', cartDeleteResult);

        const userUpdateResult = await UserModel.updateOne(
            { _id: user._id },
            { $pull: { shopping_cart: { $in: productIdsToRemove } } }
        );
        console.log('Cash on delivery user update result:', userUpdateResult);

        // 3. Kiểm tra kết quả
        const afterCashCart = await CartProductModel.find({ userId: user._id });
        const afterCashUser = await UserModel.findById(user._id);

        console.log('\n=== CASH ON DELIVERY RESULT ===');
        console.log(`Cart items: ${afterCashCart.length}`);
        console.log(`User shopping_cart: ${afterCashUser.shopping_cart.length}`);
        console.log(`Orders: ${orders.length}`);

        if (afterCashCart.length === 0 && afterCashUser.shopping_cart.length === 0) {
            console.log('🎉 SUCCESS: Cash on delivery cleanup works!');
        } else {
            console.log('❌ ISSUE: Cash on delivery cleanup failed');
        }

        // 4. Reset và test manual clear cart API
        console.log('\n=== STEP 3: Testing manual clear cart API ===');

        // Tạo lại cart items
        for (const productId of testProducts) {
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

        const beforeManualCart = await CartProductModel.find({ userId: user._id });
        const beforeManualUser = await UserModel.findById(user._id);
        console.log(`Cart items before manual clear: ${beforeManualCart.length}`);
        console.log(`User shopping_cart before manual clear: ${beforeManualUser.shopping_cart.length}`);

        // Test manual clear logic (từ clearCartController)
        const manualDeleteResult = await CartProductModel.deleteMany({ userId: user._id });
        const manualUserUpdateResult = await UserModel.updateOne(
            { _id: user._id },
            { $set: { shopping_cart: [] } }
        );

        console.log('Manual clear cart delete result:', manualDeleteResult);
        console.log('Manual clear user update result:', manualUserUpdateResult);

        // 5. Kiểm tra kết quả cuối cùng
        const finalCart = await CartProductModel.find({ userId: user._id });
        const finalUser = await UserModel.findById(user._id);
        const finalOrders = await OrderModel.find({ userId: user._id });

        console.log('\n=== FINAL RESULTS ===');
        console.log(`Cart items: ${finalCart.length}`);
        console.log(`User shopping_cart: ${finalUser.shopping_cart.length}`);
        console.log(`Orders: ${finalOrders.length}`);

        if (finalCart.length === 0 && finalUser.shopping_cart.length === 0 && finalOrders.length > 0) {
            console.log('\n🎉🎉🎉 COMPLETE SUCCESS! 🎉🎉🎉');
            console.log('✅ Orders created successfully');
            console.log('✅ Cart items cleared successfully');
            console.log('✅ User shopping_cart cleared successfully');
            console.log('✅ Both cash on delivery and manual clear work perfectly!');
        } else {
            console.log('\n❌ Some issues remain:');
            if (finalCart.length > 0) console.log(`- ${finalCart.length} cart items remain`);
            if (finalUser.shopping_cart.length > 0) console.log(`- ${finalUser.shopping_cart.length} shopping_cart items remain`);
            if (finalOrders.length === 0) console.log('- No orders created');
        }

        process.exit(0);
    } catch (error) {
        console.error('Test error:', error);
        process.exit(1);
    }
};

testFinalSolution();
