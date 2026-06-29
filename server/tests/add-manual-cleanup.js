import mongoose from 'mongoose';
import dotenv from 'dotenv';
import UserModel from '../models/user.model.js';
import CartProductModel from '../models/cartProduct.model.js';

dotenv.config();

// Thêm cleanup manual vào CheckoutPage
const addManualCleanup = async () => {
    console.log('=== MANUAL CLEANUP SOLUTION ===');
    console.log('Thêm code này vào CheckoutPage.jsx sau khi thanh toán thành công:');
    console.log(`
// Trong CheckoutPage.jsx, sau khi redirect về success
useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    
    if (sessionId) {
        // Thanh toán thành công - xóa cart ngay lập tức
        const cleanupCart = async () => {
            try {
                const response = await Axios({
                    ...SummaryApi.clearCart,
                    headers: {
                        "content-type": "application/json",
                        Authorization: token
                    }
                });
                
                if (response.data.success) {
                    console.log('✅ Cart cleaned after payment');
                    // Reload data
                    fetchCartItem();
                    dispatch(fetchOrder());
                }
            } catch (error) {
                console.error('Cart cleanup error:', error);
            }
        };
        
        cleanupCart();
    }
}, []);
    `);

    console.log('\n=== HOẶC TẠO API ENDPOINT MỚI ===');
    console.log('Tạo endpoint /api/cleanup-cart-after-payment');
};

addManualCleanup();
