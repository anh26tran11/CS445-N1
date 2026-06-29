import React from 'react';
import { useGlobalContext } from '../provider/GlobalProvider';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaCaretRight } from 'react-icons/fa';
import { DisplayPriceInVND } from '../utils/DisplayPriceInVND';
import { pricewithDiscount } from '../utils/PriceWithDiscount';
import AddToCartButton from './AddToCartButton';
import imageEmpty from '../assets/empty_cart.webp';
import Divider from './Divider';
import { valideURLConvert } from '../utils/valideURLConvert';
import GlareHover from './GlareHover';

const DisplayCartItem = ({ close }) => {
    const { notDiscountTotalPrice, totalPrice, totalQty } = useGlobalContext();
    const cartItem = useSelector((state) => state.cartItem.cart);
    const user = useSelector((state) => state.user);
    const navigate = useNavigate();

    const redirectToCheckoutPage = () => {
        if (user?._id) {
            navigate('/checkout');
            if (close) {
                close();
            }
            return;
        }
        toast('Please Login');
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <section
            onClick={close}
            className="bg-neutral-800 fixed top-0 bottom-0 right-0 left-0 bg-opacity-60 z-50"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="liquid-glass w-full max-w-lg min-h-screen max-h-screen ml-auto p-3 text-foreground"
            >
                <div className="flex items-center py-3 gap-3 justify-between">
                    <h2 className="font-bold text-highlight text-lg">
                        Giỏ hàng
                    </h2>
                    <Link
                        to={'/cart'}
                        onClick={close}
                        className="flex items-center gap-1 text-highlight font-bold"
                    >
                        Xem tất cả
                        <span>
                            <FaCaretRight className="mb-[2px]" />
                        </span>
                    </Link>
                </div>
                <div className={`${cartItem[0] ? 'hidden' : 'block'}`}>
                    <Divider />
                </div>

                <div
                    className={`${
                        cartItem[0]
                            ? 'bg-card max-h-[calc(100vh-150px)]'
                            : 'justify-center flex-1'
                    } min-h-[75vh] lg:min-h-[80vh] h-full pt-4 flex flex-col
                gap-4 rounded-lg`}
                >
                    {/* Display Items */}
                    {cartItem[0] ? (
                        <>
                            <div
                                className="flex items-center justify-between px-4 py-2 bg-primary-4 text-sm font-bold shadow-md
                            rounded-full italic text-rose-400"
                            >
                                <p>Tổng số tiền tiết kiệm được</p>
                                <p>
                                    {DisplayPriceInVND(
                                        notDiscountTotalPrice - totalPrice
                                    )}
                                </p>
                            </div>
                            <Divider />
                            <div
                                className="shadow-md rounded-lg p-4 grid gap-5 overflow-auto
                            "
                            >
                                {cartItem[0] &&
                                    cartItem.map((item, index) => {
                                        return (
                                            <div
                                                key={
                                                    item?._id +
                                                        'cartItemDisplay' ||
                                                    index
                                                }
                                                className="flex w-full gap-4 h-[84px]"
                                            >
                                                <div
                                                    className="w-[85px] h-full min-h-20 min-w-20 border border-secondary-100
                                                rounded"
                                                >
                                                    <img
                                                        src={
                                                            item?.productId
                                                                ?.image[0]
                                                        }
                                                        onClick={() => {
                                                            const product =
                                                                item?.productId;
                                                            const url = `/product/${valideURLConvert(
                                                                product.name
                                                            )}-${product._id}`;
                                                            navigate(url);
                                                            close();
                                                            scrollToTop();
                                                        }}
                                                        className="object-cover w-full h-full cursor-pointer hover:opacity-80 transition-opacity"
                                                    />
                                                </div>
                                                <div className="w-full max-w-sm text-sm flex flex-col gap-1">
                                                    <p className="font-bold text-ellipsis line-clamp-2">
                                                        {item?.productId?.name}
                                                    </p>
                                                    <p className="text-secondary-100">
                                                        {item?.productId?.unit}
                                                    </p>
                                                    <p className="font-semibold text-rose-500">
                                                        {DisplayPriceInVND(
                                                            pricewithDiscount(
                                                                item?.productId
                                                                    ?.price,
                                                                item?.productId
                                                                    ?.discount
                                                            )
                                                        )}
                                                    </p>
                                                </div>
                                                <div>
                                                    <AddToCartButton
                                                        data={item?.productId}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                            <div className="liquid-glass px-5 py-4 rounded-lg shadow-md mb-[6px] mx-4">
                                <h3 className="font-semibold">
                                    Chi tiết hóa đơn
                                </h3>
                                <div className="px-4 py-2 text-[15px] flex flex-col gap-1">
                                    <div className="flex gap-4 justify-between">
                                        <p>Tổng giá trị các mặt hàng</p>
                                        <p className="flex items-center gap-2">
                                            {cartItem.some(
                                                (item) =>
                                                    item.productId?.discount > 0
                                            ) && (
                                                <span className="line-through text-muted-foreground">
                                                    {DisplayPriceInVND(
                                                        notDiscountTotalPrice
                                                    )}
                                                </span>
                                            )}
                                            <span className="text-secondary-200 font-bold">
                                                {DisplayPriceInVND(totalPrice)}
                                            </span>
                                        </p>
                                    </div>
                                    <div className="flex gap-4 justify-between">
                                        <p>Tổng số lượng</p>
                                        <p className="flex items-center gap-2">
                                            {totalQty} sản phẩm
                                        </p>
                                    </div>
                                </div>
                                <div className="font-semibold flex items-center justify-between gap-4">
                                    <p>Tổng cộng</p>
                                    <p className="text-secondary-200 font-bold underline">
                                        {DisplayPriceInVND(totalPrice)}
                                    </p>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex flex-col justify-center items-center gap-6">
                            <img
                                src={imageEmpty}
                                className="w-full h-full object-scale-down p-2 rounded-md opacity-60"
                            />

                            <GlareHover
                                background="#000"
                                glareColor="#ffffff"
                                glareOpacity={0.8}
                                glareAngle={-30}
                                glareSize={300}
                                transitionDuration={800}
                                playOnce={false}
                            >
                                <Link
                                    onClick={close}
                                    to={'/'}
                                    className="bg-primary-3 hover:opacity-80 text-lime-300 px-6 py-4
                                rounded-lg font-bold shadow-md shadow-secondary-100"
                                >
                                    Mua sắm ngay!
                                </Link>
                            </GlareHover>
                        </div>
                    )}
                </div>

                {cartItem[0] && (
                    <div
                        className="liquid-glass text-orange-600 px-6 py-3 mt-4 font-bold text-base
                        rounded flex items-center gap-4 justify-between shadow-md shadow-secondary-100"
                    >
                        <div>{DisplayPriceInVND(totalPrice)}</div>
                        <button
                            onClick={redirectToCheckoutPage}
                            className="flex items-center gap-1 hover:opacity-80"
                        >
                            Thanh toán
                            <span>
                                <FaCaretRight />
                            </span>
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
};

export default DisplayCartItem;
