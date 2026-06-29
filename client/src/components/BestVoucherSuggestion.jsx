import React from 'react';
import { DisplayPriceInVND } from '../utils/DisplayPriceInVND';
import toast from 'react-hot-toast';

const BestVoucherSuggestion = ({
    bestVoucher,
    selectedVouchers,
    setSelectedVouchers,
    onDismiss,
}) => {
    if (
        !bestVoucher?.bestCombination ||
        bestVoucher.bestCombination.totalSavings <= 0
    ) {
        return null;
    }

    const { bestCombination } = bestVoucher;

    const handleApply = () => {
        const newVouchers = { ...selectedVouchers };

        if (bestCombination.regular) {
            const voucher = bestCombination.regular;
            const formattedVoucher = {
                ...voucher,
                discount: Number(
                    voucher.discount !== undefined && voucher.discount !== null
                        ? voucher.discount
                        : (voucher.discountValue || 0)
                ),
                discountValue: Number(
                    voucher.discountValue !== undefined && voucher.discountValue !== null
                        ? voucher.discountValue
                        : (voucher.discount || 0)
                ),
            };
            newVouchers.regular = formattedVoucher;
        }

        setSelectedVouchers(newVouchers);
        onDismiss();
        toast.success('Đã áp dụng mã giảm giá tốt nhất!');
    };

    return (
        <div className="liquid-glass p-4 rounded-lg border-2 border-lime-300/50 mb-4 relative overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-r from-lime-300/5 to-transparent animate-pulse"></div>

            <div className="relative flex items-start gap-3">
                {/* Icon */}
                <div className="flex-shrink-0 w-10 h-10 bg-lime-300/20 rounded-full flex items-center justify-center">
                    <svg
                        className="w-6 h-6 text-lime-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                    </svg>
                </div>

                {/* Content */}
                <div className="flex-1">
                    <h3 className="text-white font-bold text-sm mb-1 flex items-center gap-2">
                        💡 Tiết kiệm tối đa!
                        <span className="text-xs font-normal text-lime-300 bg-lime-300/10 px-2 py-0.5 rounded-full">
                            Gợi ý
                        </span>
                    </h3>

                    <p className="text-xs text-gray-300 mb-3">
                        Dùng mã{' '}
                        <span className="font-bold text-lime-300">
                            {bestCombination.regular.code}
                        </span>{' '}
                        để tiết kiệm{' '}
                        <span className="font-bold text-secondary-200 text-sm">
                            {DisplayPriceInVND(bestCombination.totalSavings)}
                        </span>
                    </p>

                    {/* Savings info */}
                    <div className="text-xs text-gray-400 mb-3">
                        <div className="flex justify-between">
                            <span>• Giảm giá đơn hàng:</span>
                            <span className="text-lime-300 font-semibold">
                                -
                                {DisplayPriceInVND(
                                    bestCombination.regular.calculatedDiscount
                                )}
                            </span>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2">
                        <button
                            onClick={handleApply}
                            className="px-4 py-2 bg-lime-300 text-black rounded-md text-xs font-semibold hover:bg-lime-400 transition-all hover:scale-105 active:scale-95"
                        >
                            ⚡ Áp dụng ngay
                        </button>
                        <button
                            onClick={onDismiss}
                            className="px-3 py-2 bg-gray-600/50 text-white rounded-md text-xs hover:bg-gray-600 transition-colors"
                        >
                            Bỏ qua
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BestVoucherSuggestion;
