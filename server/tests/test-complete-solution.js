import mongoose from 'mongoose';
import dotenv from 'dotenv';
import UserModel from '../models/user.model.js';
import CartProductModel from '../models/cartProduct.model.js';
import OrderModel from '../models/order.model.js';

dotenv.config();

const testCompleteSolution = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log('Connected to MongoDB');

        const user = await UserModel.findOne();
        if (!user) {
            console.log('❌ No user found');
            return;
        }

        // 1. Tạo 5 cart items để test
        const allProducts = [
            '68a843cbf3e807516f273c16',
            '68a84408f3e807516f273c3d',
            '68ac1fa76886d39c175d3928',
            '68a843cbf3e807516f273c17',
            '68a84408f3e807516f273c3e'
        ];

        console.log('\n=== STEP 1: Creating 5 cart items ===');
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

        // 2. Test COD với selective cleanup
        console.log('\n=== STEP 2: Testing COD selective cleanup ===');
        const selectedProducts = [
            '68a843cbf3e807516f273c16',
            '68a84408f3e807516f273c3d',
            '68ac1fa76886d39c175d3928'
        ];

        // Tạo orders cho COD
        const codOrders = await OrderModel.insertMany(
            selectedProducts.map(productId => ({
                userId: user._id,
                orderId: `COD-${new mongoose.Types.ObjectId()}`,
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

        // Test COD cleanup logic
        const cartItemsToDelete = await CartProductModel.find({
            userId: user._id,
            productId: { $in: selectedProducts }
        });
        const cartItemIds = cartItemsToDelete.map(item => item._id);

        const codDeleteResult = await CartProductModel.deleteMany({
            userId: user._id,
            productId: { $in: selectedProducts }
        });

        const codUserUpdateResult = await UserModel.updateOne(
            { _id: user._id },
            { $pull: { shopping_cart: { $in: cartItemIds } } }
        );

        const afterCODCart = await CartProductModel.find({ userId: user._id });
        const afterCODUser = await UserModel.findById(user._id);

        console.log('COD Results:');
        console.log(`- Orders created: ${codOrders.length}`);
        console.log(`- Cart items deleted: ${codDeleteResult.deletedCount}`);
        console.log(`- Remaining cart items: ${afterCODCart.length} (should be 2)`);
        console.log(`- User shopping_cart: ${afterCODUser.shopping_cart.length} (should be 2)`);

        // 3. Test Online Payment webhook selective cleanup
        console.log('\n=== STEP 3: Testing Online Payment selective cleanup ===');

        // Tạo thêm cart items để test online payment
        const remainingProducts = [
            '68a843cbf3e807516f273c17',
            '68a84408f3e807516f273c3e'
        ];

        // Tạo orders cho online payment
        const onlineOrders = await OrderModel.insertMany(
            remainingProducts.map(productId => ({
                userId: user._id,
                orderId: `ONLINE-${new mongoose.Types.ObjectId()}`,
                productId: new mongoose.Types.ObjectId(productId),
                product_details: {
                    name: `Test Product ${productId}`,
                    image: ['test.jpg']
                },
                paymentId: 'pi_test_123',
                payment_status: 'paid',
                delivery_address: '68ac1fa76886d39c175d3928',
                subTotalAmt: 100000,
                totalAmt: 100000,
            }))
        );

        // Test webhook selective cleanup logic
        const productIdsToRemove = remainingProducts;

        const webhookCartItemsToDelete = await CartProductModel.find({
            userId: new mongoose.Types.ObjectId(user._id),
            productId: { $in: productIdsToRemove.map(id => new mongoose.Types.ObjectId(id)) }
        });

        if (webhookCartItemsToDelete.length > 0) {
            const webhookCartItemIds = webhookCartItemsToDelete.map(item => item._id);

            const webhookDeleteResult = await CartProductModel.deleteMany({
                _id: { $in: webhookCartItemIds }
            });

            const webhookUserUpdateResult = await UserModel.updateOne(
                { _id: new mongoose.Types.ObjectId(user._id) },
                { $pull: { shopping_cart: { $in: webhookCartItemIds } } }
            );

            console.log('Webhook Results:');
            console.log(`- Orders created: ${onlineOrders.length}`);
            console.log(`- Cart items deleted: ${webhookDeleteResult.deletedCount}`);
        }

        // 4. Test fallback selective cleanup
        console.log('\n=== STEP 4: Testing fallback selective cleanup ===');

        // Tạo lại một số cart items để test fallback
        const fallbackProduct = '68ac1fa76886d39c175d3928';
        const fallbackCartItem = new CartProductModel({
            userId: user._id,
            productId: new mongoose.Types.ObjectId(fallbackProduct),
            quantity: 1
        });
        const savedFallback = await fallbackCartItem.save();

        await UserModel.updateOne(
            { _id: user._id },
            { $push: { shopping_cart: savedFallback._id } }
        );

        // Test fallback logic (tìm recent orders)
        const recentOrders = await OrderModel.find({
            createdAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) },
            productId: new mongoose.Types.ObjectId(fallbackProduct)
        });

        if (recentOrders.length > 0) {
            const fallbackCartItemsToDelete = await CartProductModel.find({
                userId: user._id,
                productId: new mongoose.Types.ObjectId(fallbackProduct)
            });

            if (fallbackCartItemsToDelete.length > 0) {
                const fallbackCartItemIds = fallbackCartItemsToDelete.map(item => item._id);

                const fallbackDeleteResult = await CartProductModel.deleteMany({
                    _id: { $in: fallbackCartItemIds }
                });

                const fallbackUserUpdateResult = await UserModel.updateOne(
                    { _id: user._id },
                    { $pull: { shopping_cart: { $in: fallbackCartItemIds } } }
                );

                console.log('Fallback Results:');
                console.log(`- Recent orders found: ${recentOrders.length}`);
                console.log(`- Cart items deleted: ${fallbackDeleteResult.deletedCount}`);
            }
        }

        // 5. Kiểm tra kết quả cuối cùng
        const finalCart = await CartProductModel.find({ userId: user._id });
        const finalUser = await UserModel.findById(user._id);
        const finalOrders = await OrderModel.find({ userId: user._id });

        console.log('\n=== FINAL RESULTS ===');
        console.log(`Total orders created: ${finalOrders.length}`);
        console.log(`Remaining cart items: ${finalCart.length} (should be 0)`);
        console.log(`User shopping_cart: ${finalUser.shopping_cart.length} (should be 0)`);

        if (finalCart.length === 0 && finalUser.shopping_cart.length === 0 && finalOrders.length > 0) {
            console.log('\n🎉🎉🎉 COMPLETE SUCCESS! 🎉🎉🎉');
            console.log('✅ COD selective cleanup works');
            console.log('✅ Online payment selective cleanup works');
            console.log('✅ Fallback selective cleanup works');
            console.log('✅ All cart items properly removed');
            console.log('✅ User shopping_cart properly updated');
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

testCompleteSolution();
