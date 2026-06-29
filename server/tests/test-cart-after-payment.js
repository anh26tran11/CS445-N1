import mongoose from 'mongoose';
import dotenv from 'dotenv';
import UserModel from '../models/user.model.js';
import CartProductModel from '../models/cartProduct.model.js';
import OrderModel from '../models/order.model.js';

dotenv.config();

const testCartAfterPayment = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log('Connected to MongoDB');

        // 1. Tạo test data giống thực tế
        const user = await UserModel.findOne();
        if (!user) {
            console.log('❌ No user found');
            return;
        }

        console.log(`Testing with user: ${user.name} (${user._id})`);

        // 2. Thêm cart items
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

            await UserModel.updateOne(
                { _id: user._id },
                { $push: { shopping_cart: saved._id } }
            );
        }

        console.log(`✅ Created ${cartItems.length} cart items`);

        // 3. Tạo orders (giống như trong payment flow)
        const orders = await OrderModel.insertMany(
            testProducts.map(productId => ({
                userId: user._id,
                orderId: `ORD-${new mongoose.Types.ObjectId()}`,
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

        console.log(`✅ Created ${orders.length} orders`);

        // 4. Hiển thị trạng thái trước khi xóa
        const beforeCartItems = await CartProductModel.find({ userId: user._id });
        const beforeUser = await UserModel.findById(user._id);

        console.log('\n=== BEFORE CLEANUP ===');
        console.log(`Cart items: ${beforeCartItems.length}`);
        console.log(`User shopping_cart: ${beforeUser.shopping_cart.length}`);
        console.log('Cart item IDs:', beforeCartItems.map(item => item._id.toString()));
        console.log('User shopping_cart IDs:', beforeUser.shopping_cart.map(id => id.toString()));

        // 5. Test logic xóa cart (giống webhook)
        console.log('\n=== TESTING CART CLEANUP LOGIC ===');

        const productIdsToRemove = testProducts;
        console.log('Product IDs to remove:', productIdsToRemove);

        // Tìm cart items cần xóa
        const cartItemsToDelete = await CartProductModel.find({
            userId: new mongoose.Types.ObjectId(user._id),
            productId: { $in: productIdsToRemove.map(id => new mongoose.Types.ObjectId(id)) }
        });

        console.log(`Found ${cartItemsToDelete.length} cart items to delete`);
        console.log('Cart items to delete:', cartItemsToDelete.map(item => ({
            _id: item._id.toString(),
            productId: item.productId.toString()
        })));

        if (cartItemsToDelete.length > 0) {
            const cartItemIds = cartItemsToDelete.map(item => item._id);

            // Xóa CartProduct documents
            const cartDeleteResult = await CartProductModel.deleteMany({
                _id: { $in: cartItemIds }
            });
            console.log('Cart delete result:', cartDeleteResult);

            // Xóa references từ User.shopping_cart
            const userUpdateResult = await UserModel.updateOne(
                { _id: new mongoose.Types.ObjectId(user._id) },
                { $pull: { shopping_cart: { $in: cartItemIds } } }
            );
            console.log('User update result:', userUpdateResult);
        }

        // 6. Kiểm tra kết quả sau khi xóa
        const afterCartItems = await CartProductModel.find({ userId: user._id });
        const afterUser = await UserModel.findById(user._id);

        console.log('\n=== AFTER CLEANUP ===');
        console.log(`Cart items: ${afterCartItems.length}`);
        console.log(`User shopping_cart: ${afterUser.shopping_cart.length}`);
        console.log(`Orders: ${orders.length}`);

        // 7. Kết luận
        if (afterCartItems.length === 0 && afterUser.shopping_cart.length === 0) {
            console.log('\n🎉 SUCCESS: Cart cleanup worked perfectly!');
            console.log('✅ Orders created successfully');
            console.log('✅ Cart items deleted successfully');
            console.log('✅ User shopping_cart cleared successfully');
        } else {
            console.log('\n❌ ISSUE: Cart cleanup failed');
            console.log(`Remaining cart items: ${afterCartItems.length}`);
            console.log(`Remaining shopping_cart items: ${afterUser.shopping_cart.length}`);
        }

        process.exit(0);
    } catch (error) {
        console.error('Test error:', error);
        process.exit(1);
    }
};

testCartAfterPayment();
