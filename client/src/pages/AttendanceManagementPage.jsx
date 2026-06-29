import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import AxiosToastError from '../utils/AxiosToastError';
import successAlert from '../utils/successAlert';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import Loading from '../components/Loading';
import DynamicTable from '@/components/table/dynamic-table';
import NoData from '@/components/NoData';

const AttendanceManagementPage = () => {
    const user = useSelector((state) => state.user);
    const [attendances, setAttendances] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState(
        new Date().toISOString().split('T')[0]
    );

    const [showMyShifts, setShowMyShifts] = useState(false);

    const [shifts, setShifts] = useState([]);

    // Fetch attendance by date
    const fetchAttendance = useCallback(async () => {
        try {
            setLoading(true);
            const response = await Axios({
                ...SummaryApi.get_attendance_by_date,
                url: SummaryApi.get_attendance_by_date.url.replace(
                    ':date',
                    selectedDate
                ),
            });

            if (response.data.success) {
                setAttendances(response.data.data);
            }
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setLoading(false);
        }
    }, [selectedDate]);

    // Fetch shifts by date
    const fetchShifts = useCallback(async () => {
        try {
            const response = await Axios({
                ...SummaryApi.get_shifts_by_date,
                params: {
                    startDate: selectedDate,
                    endDate: selectedDate,
                },
            });

            if (response.data.success) {
                setShifts(response.data.data);
            }
        } catch (error) {
            AxiosToastError(error);
        }
    }, [selectedDate]);

    useEffect(() => {
        if (selectedDate) {
            Promise.all([fetchAttendance(), fetchShifts()]);
        }
    }, [selectedDate, fetchAttendance, fetchShifts]);

    const formatTime = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Handle Check In
    const handleCheckIn = useCallback(
        async (row) => {
            try {
                const response = await Axios({
                    ...SummaryApi.check_in,
                    data: {
                        userId: row.userId._id,
                        shiftId: row.shiftId,
                    },
                });

                if (response.data.success) {
                    successAlert(response.data.message);
                    fetchAttendance();
                }
            } catch (error) {
                AxiosToastError(error);
            }
        },
        [fetchAttendance]
    );

    // Handle Check Out
    const handleCheckOut = useCallback(
        async (row) => {
            try {
                const response = await Axios({
                    ...SummaryApi.check_out,
                    data: {
                        userId: row.userId._id,
                        shiftId: row.shiftId,
                    },
                });

                if (response.data.success) {
                    successAlert(response.data.message);
                    fetchAttendance();
                }
            } catch (error) {
                AxiosToastError(error);
            }
        },
        [fetchAttendance]
    );

    // Column configuration for DynamicTable
    const columns = useMemo(
        () => [
            {
                key: 'employeeName',
                label: 'Nhân viên',
                type: 'string',
                sortable: true,
                format: (value) => value || '-',
            },
            {
                key: 'role',
                label: 'Vai trò',
                type: 'string',
                sortable: true,
                format: (value) => (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {value || '-'}
                    </span>
                ),
            },
            {
                key: 'shiftType',
                label: 'Ca làm',
                type: 'string',
                sortable: true,
                format: (value) => (
                    <span className="capitalize">{value || '-'}</span>
                ),
            },
            {
                key: 'checkInTime',
                label: 'Giờ vào',
                type: 'string',
                sortable: true,
                format: (value) => formatTime(value),
            },
            {
                key: 'checkOutTime',
                label: 'Giờ ra',
                type: 'string',
                sortable: true,
                format: (value) => formatTime(value),
            },
            {
                key: 'workingHours',
                label: 'Số giờ',
                type: 'number',
                sortable: true,
                format: (value) => (value ? `${value.toFixed(2)}h` : '-'),
            },
            {
                key: 'actions',
                label: 'Hành động',
                type: 'component',
                sortable: false,
                format: (_, row) => {
                    if (!row.checkInTime) {
                        return (
                            <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white h-8"
                                onClick={() => handleCheckIn(row.rawData)}
                            >
                                Check In
                            </Button>
                        );
                    } else if (!row.checkOutTime) {
                        return (
                            <Button
                                size="sm"
                                className="bg-orange-600 hover:bg-orange-700 text-white h-8"
                                onClick={() => handleCheckOut(row.rawData)}
                            >
                                Check Out
                            </Button>
                        );
                    }
                    return (
                        <span className="text-green-600 font-medium text-sm">
                            Hoàn thành
                        </span>
                    );
                },
            },
        ],
        [handleCheckIn, handleCheckOut]
    );

    // Transform data for DynamicTable
    const tableData = useMemo(() => {
        const data = [];

        shifts.forEach((shift) => {
            if (shift.assignedStaff && shift.assignedStaff.length > 0) {
                shift.assignedStaff.forEach((staff) => {
                    if (!staff.userId) return;

                    // Filter by My Shifts if enabled
                    if (showMyShifts && staff.userId._id !== user?._id) {
                        return;
                    }

                    // Find attendance record
                    const attendance = attendances.find(
                        (att) =>
                            att.userId?._id === staff.userId._id &&
                            att.shiftId?._id === shift._id
                    );

                    data.push({
                        id: `${shift._id}-${staff.userId._id}`,
                        employeeName: staff.userId.name,
                        role: staff.role,
                        shiftType: shift.shiftType,
                        checkInTime: attendance?.checkInTime,
                        checkOutTime: attendance?.checkOutTime,
                        workingHours: attendance?.workingHours,
                        rawData: {
                            userId: staff.userId,
                            shiftId: shift._id,
                            checkInTime: attendance?.checkInTime,
                            checkOutTime: attendance?.checkOutTime,
                        },
                    });
                });
            }
        });

        return data;
    }, [shifts, attendances, showMyShifts, user?._id]);

    // Check permission
    if (!['ADMIN', 'MANAGER'].includes(user?.role)) {
        return (
            <div className="container mx-auto py-8 px-4">
                <Card>
                    <CardContent className="py-8 text-center">
                        <p className="text-red-500">
                            Bạn không có quyền truy cập trang này
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <section className="container mx-auto grid gap-2 z-10">
            <Card className="py-6 flex-row justify-between gap-6 border-card-foreground">
                <CardHeader>
                    <CardTitle className="text-lg text-highlight font-bold uppercase">
                        Quản lý Chấm công
                    </CardTitle>
                    <CardDescription>
                        Quản lý thông tin chấm công
                    </CardDescription>
                </CardHeader>

                <CardFooter className="flex gap-4 items-end">
                    {/* Date Filter */}
                    <div className="space-y-2">
                        <Label>Chọn ngày</Label>
                        <Input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                    </div>

                    {/* My Shifts Toggle */}
                    <Button
                        variant={showMyShifts ? 'default' : 'outline'}
                        onClick={() => setShowMyShifts(!showMyShifts)}
                        className="mb-0.5"
                    >
                        Ca làm của tôi
                    </Button>
                </CardFooter>
            </Card>

            {/* Attendance Table */}
            {loading ? (
                <div className="flex justify-center py-8">
                    <Loading />
                </div>
            ) : (
                <>
                    <Card className="mb-4 p-4">
                        <p className="text-sm text-foreground">
                            Tổng số: {attendances.length} bản ghi
                        </p>
                    </Card>
                    <DynamicTable
                        data={tableData}
                        columns={columns}
                        pageSize={10}
                        sortable={true}
                        searchable={false}
                        filterable={false}
                        groupable={false}
                    />
                    {tableData.length === 0 && (
                        // <p className="text-sm text-center text-foreground">
                        //     Không có dữ liệu
                        // </p>
                        <NoData message="Không có dữ liệu" />
                    )}
                </>
            )}
        </section>
    );
};

export default AttendanceManagementPage;
