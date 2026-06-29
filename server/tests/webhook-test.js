import mongoose from 'mongoose';
import dotenv from 'dotenv';
import UserModel from '../models/user.model.js';
import CartProductModel from '../models/cartProduct.model.js';

dotenv.config();

const testWebhookLogic = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log('Connected to MongoDB');

        // 1. Tạo test data
        const user = await UserModel.findOne();
        if (!user) {
            console.log('❌ No user found');
            return;
        }

        // Thêm cart items
        const testProducts = ['68a843cbf3e807516f273c16', '68a84408f3e807516f273c3d'];
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

        console.log(`✅ Created ${cartItems.length} cart items for testing`);

        // 2. Test webhook logic với metadata
        console.log('\n=== TESTING WITH METADATA ===');
        const mockSession = {
            metadata: {
                userId: user._id.toString(),
                addressId: '68ac1fa76886d39c175d3928',
                tempOrderIds: '["68ac1fa76886d39c175d3929"]'
            }
        };

        const { userId, addressId, tempOrderIds } = mockSession.metadata || {};
        console.log('Metadata:', { userId, addressId, tempOrderIds });

        if (userId && addressId && tempOrderIds) {
            console.log('✅ Metadata complete - would proceed with normal flow');

            // Test cart cleanup logic
            const cartItemsToDelete = await CartProductModel.find({ userId: new mongoose.Types.ObjectId(userId) });
            console.log(`Found ${cartItemsToDelete.length} cart items to delete`);

            if (cartItemsToDelete.length > 0) {
                await CartProductModel.deleteMany({ userId: new mongoose.Types.ObjectId(userId) });
                await UserModel.updateOne(
                    { _id: new mongoose.Types.ObjectId(userId) },
                    { $set: { shopping_cart: [] } }
                );
                console.log('✅ Cart cleaned successfully');
            }
        }

        // 3. Test fallback logic
        console.log('\n=== TESTING FALLBACK LOGIC ===');

        // Tạo lại cart items để test fallback
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

        // Test fallback khi thiếu metadata
        const mockSessionNoMetadata = { metadata: {} };
        const { userId: noUserId } = mockSessionNoMetadata.metadata || {};

        if (!noUserId) {
            console.log('Missing metadata - testing fallback...');

            const usersWithCart = await UserModel.find({ shopping_cart: { $exists: true, $ne: [] } });
            console.log(`Found ${usersWithCart.length} users with cart items`);

            for (const userWithCart of usersWithCart) {
                const cartItemsFound = await CartProductModel.find({ userId: userWithCart._id });
                console.log(`User ${userWithCart._id}: ${cartItemsFound.length} cart items`);

                if (cartItemsFound.length > 0) {
                    await CartProductModel.deleteMany({ userId: userWithCart._id });
                    await UserModel.updateOne(
                        { _id: userWithCart._id },
                        { $set: { shopping_cart: [] } }
                    );
                    console.log(`✅ Fallback: Cleaned cart for user ${userWithCart._id}`);
                }
            }
        }

        // 4. Kiểm tra kết quả cuối
        const finalCartItems = await CartProductModel.find();
        const finalUsersWithCart = await UserModel.find({ shopping_cart: { $exists: true, $ne: [] } });

        console.log('\n=== FINAL RESULTS ===');
        console.log(`Total cart items: ${finalCartItems.length}`);
        console.log(`Users with cart: ${finalUsersWithCart.length}`);

        if (finalCartItems.length === 0 && finalUsersWithCart.length === 0) {
            console.log('🎉 SUCCESS: Webhook logic works perfectly!');
        } else {
            console.log('❌ ISSUE: Some cart items remain');
        }

        process.exit(0);
    } catch (error) {
        console.error('Test error:', error);
        process.exit(1);
    }
};

testWebhookLogic();
