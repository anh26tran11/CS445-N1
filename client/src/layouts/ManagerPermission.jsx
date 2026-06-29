import React from 'react';
import { useSelector } from 'react-redux';

const ManagerPermission = ({ children }) => {
    const user = useSelector((state) => state.user);

    // Allow ADMIN and MANAGER
    const hasPermission = ['ADMIN', 'MANAGER'].includes(user?.role);

    return (
        <>
            {hasPermission ? (
                children
            ) : (
                <p className="text-red-600 bg-red-100 p-4 rounded">
                    Bạn không có quyền truy cập. Chỉ Admin và Manager mới có thể
                    truy cập trang này.
                </p>
            )}
        </>
    );
};

export default ManagerPermission;
