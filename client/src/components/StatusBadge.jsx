import React from 'react';
import PropTypes from 'prop-types';

const StatusBadge = ({ status, className = '' }) => {
    const statusConfig = {
        'Đang chờ thanh toán': {
            text: 'Đang chờ thanh toán',
            bgColor: 'bg-black/50',
            textColor: 'text-amber-300',
            borderColor: 'border-amber-200',
            icon: '⏳',
        },
        'Đã thanh toán': {
            text: 'Đã thanh toán',
            bgColor: 'bg-black/50',
            textColor: 'text-lime-300',
            borderColor: 'border-lime-200',
            icon: '✓',
        },
        'Thanh toán khi giao hàng': {
            text: 'Thanh toán khi giao hàng',
            bgColor: 'bg-black/50',
            textColor: 'text-blue-300',
            borderColor: 'border-blue-200',
            icon: '🚚',
        },
        // Fallback for any unexpected status
        default: {
            text: status || 'Không xác định',
            bgColor: 'bg-black/50',
            textColor: 'text-gray-300',
            borderColor: 'border-gray-200',
            icon: '❓',
        },
    };

    const config = statusConfig[status] || statusConfig.default;

    return (
        <span
            className={`inline-flex items-center p-2 rounded-md text-sm font-medium ${config.bgColor} ${config.textColor} border ${config.borderColor} ${className}`}
        >
            <span className="mr-1.5">{config.icon}</span>
            {config.text}
        </span>
    );
};

StatusBadge.propTypes = {
    status: PropTypes.oneOf([
        'Thanh toán khi giao hàng',
        'Đang chờ thanh toán',
        'Đã thanh toán',
    ]),
    className: PropTypes.string,
};

export default StatusBadge;
