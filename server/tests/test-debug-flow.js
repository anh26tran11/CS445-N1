import mongoose from 'mongoose';
import dotenv from 'dotenv';
import UserModel from '../models/user.model.js';
import CartProductModel from '../models/cartProduct.model.js';

dotenv.config();

const testDebugFlow = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log('Connected to MongoDB');

        const user = await UserModel.findOne();
        if (!user) {
            console.log('❌ No user found');
            return;
        }

        // 1. Tạo cart items giống như trong thực tế
        const products = [
            { id: '68a843cbf3e807516f273c16', name: 'Sản phẩm A' },
            { id: '68a84408f3e807516f273c3d', name: 'Sản phẩm B' },
            { id: '68ac1fa76886d39c175d3928', name: 'Sản phẩm C' },
            { id: '68a843cbf3e807516f273c17', name: 'Sản phẩm D' },
            { id: '68a84408f3e807516f273c3e', name: 'Sản phẩm E' }
        ];

        console.log('\n=== BƯỚC 1: Tạo 5 sản phẩm trong giỏ hàng ===');
        const cartItems = [];
        for (const product of products) {
            const cartItem = new CartProductModel({
                userId: user._id,
                productId: new mongoose.Types.ObjectId(product.id),
                quantity: 1
            });
            const saved = await cartItem.save();
            cartItems.push({
                _id: saved._id,
                productId: { _id: product.id },
                name: product.name
            });

            await UserModel.updateOne(
                { _id: user._id },
                { $push: { shopping_cart: saved._id } }
            );
        }

        console.log('Giỏ hàng hiện tại:');
        cartItems.forEach((item, index) => {
            console.log(`${index + 1}. ${item.name} (Cart ID: ${item._id}, Product ID: ${item.productId._id})`);
        });

        // 2. Giả lập user chọn 3 sản phẩm đầu để thanh toán (A, B, C)
        console.log('\n=== BƯỚC 2: User chọn 3 sản phẩm để thanh toán ===');
        const selectedItems = cartItems.slice(0, 3); // Chọn 3 sản phẩm đầu
        console.log('Sản phẩm được chọn:');
        selectedItems.forEach((item, index) => {
            console.log(`${index + 1}. ${item.name}`);
        });

        // 3. Giả lập logic từ CheckoutPage.jsx
        console.log('\n=== BƯỚC 3: Logic từ CheckoutPage.jsx ===');
        const filteredItems = cartItems.filter(item =>
            selectedItems.some(selected => selected._id.toString() === item._id.toString())
        );

        console.log(`filteredItems.length: ${filteredItems.length}`);
        console.log(`cartItemsList.length: ${cartItems.length}`);

        const isPartialCheckout = selectedItems.length < cartItems.length;
        console.log(`isPartialCheckout: ${isPartialCheckout}`);

        if (isPartialCheckout) {
            const selectedProductIds = filteredItems.map(item => item.productId._id);
            console.log('selectedProductIds sẽ được gửi:', selectedProductIds);

            // 4. Test clearCartController logic
            console.log('\n=== BƯỚC 4: Test clearCartController logic ===');
            console.log('Request data sẽ gửi:', { selectedProductIds });

            // Giả lập clearCartController
            if (selectedProductIds && selectedProductIds.length > 0) {
                console.log('✅ Vào selective mode');

                // Tìm cart items cần xóa
                const cartItemsToDelete = await CartProductModel.find({
                    userId: user._id,
                    productId: { $in: selectedProductIds.map(id => new mongoose.Types.ObjectId(id)) }
                });

                console.log(`Tìm thấy ${cartItemsToDelete.length} cart items cần xóa:`);
                cartItemsToDelete.forEach(item => {
                    const product = products.find(p => p.id === item.productId.toString());
                    console.log(`- ${product?.name}: Cart ID ${item._id}`);
                });

                const cartItemIds = cartItemsToDelete.map(item => item._id);

                // Xóa cart items
                const deleteResult = await CartProductModel.deleteMany({
                    userId: user._id,
                    productId: { $in: selectedProductIds.map(id => new mongoose.Types.ObjectId(id)) }
                });

                // Cập nhật user shopping_cart
                const userUpdateResult = await UserModel.updateOne(
                    { _id: user._id },
                    { $pull: { shopping_cart: { $in: cartItemIds } } }
                );

                console.log(`Đã xóa ${deleteResult.deletedCount} cart items`);
                console.log(`User update: matched ${userUpdateResult.matchedCount}, modified ${userUpdateResult.modifiedCount}`);

            } else {
                console.log('❌ Không vào selective mode - sẽ xóa toàn bộ');
            }
        } else {
            console.log('Full checkout - sẽ xóa toàn bộ giỏ hàng');
        }

        // 5. Kiểm tra kết quả
        console.log('\n=== BƯỚC 5: Kiểm tra kết quả ===');
        const remainingCart = await CartProductModel.find({ userId: user._id });
        const updatedUser = await UserModel.findById(user._id);

        console.log(`Còn lại ${remainingCart.length} sản phẩm trong giỏ hàng (mong đợi: 2)`);
        console.log(`User shopping_cart có ${updatedUser.shopping_cart.length} items (mong đợi: 2)`);

        if (remainingCart.length > 0) {
            console.log('Sản phẩm còn lại:');
            remainingCart.forEach(item => {
                const product = products.find(p => p.id === item.productId.toString());
                console.log(`- ${product?.name}`);
            });
        }

        // Kiểm tra chính xác
        const expectedRemaining = ['68a843cbf3e807516f273c17', '68a84408f3e807516f273c3e']; // D, E
        const actualRemaining = remainingCart.map(item => item.productId.toString());

        const isCorrect = expectedRemaining.every(id => actualRemaining.includes(id)) &&
            actualRemaining.length === expectedRemaining.length &&
            updatedUser.shopping_cart.length === 2;

        if (isCorrect) {
            console.log('\n🎉 THÀNH CÔNG: Selective deletion hoạt động chính xác!');
            console.log('✅ Chỉ xóa các sản phẩm được chọn (A, B, C)');
            console.log('✅ Giữ lại các sản phẩm không được chọn (D, E)');
            console.log('✅ User shopping_cart được cập nhật đúng');
        } else {
            console.log('\n❌ LỖI: Selective deletion không hoạt động đúng');
            console.log(`Mong đợi còn lại: ${expectedRemaining}`);
            console.log(`Thực tế còn lại: ${actualRemaining}`);
        }

        process.exit(0);
    } catch (error) {
        console.error('Lỗi test:', error);
        process.exit(1);
    }
};

testDebugFlow();
