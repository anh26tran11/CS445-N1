import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import AxiosToastError from '../utils/AxiosToastError';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import Loading from '../components/Loading';

const MyShiftsPage = () => {
    const user = useSelector((state) => state.user);
    const [shifts, setShifts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedShift, setSelectedShift] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    // Get first and last day of current month
    const getMonthRange = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        return {
            startDate: firstDay.toISOString().split('T')[0],
            endDate: lastDay.toISOString().split('T')[0],
        };
    };

    // Fetch shifts for current month
    const fetchShifts = async () => {
        try {
            setLoading(true);
            const { startDate, endDate } = getMonthRange(currentDate);

            const response = await Axios({
                ...SummaryApi.get_shifts_by_employee,
                url: SummaryApi.get_shifts_by_employee.url.replace(
                    ':employeeId',
                    user._id
                ),
                params: { startDate, endDate },
            });

            if (response.data.success) {
                setShifts(response.data.data);
            }
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?._id) {
            fetchShifts();
        }
    }, [currentDate, user]);

    // Navigate months
    const goToPreviousMonth = () => {
        setCurrentDate(
            new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
        );
    };

    const goToNextMonth = () => {
        setCurrentDate(
            new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
        );
    };

    // Get calendar days
    const getCalendarDays = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days = [];

        // Add empty cells for days before month starts
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }

        // Add days of month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(day);
        }

        return days;
    };

    // Get shifts for a specific day
    const getShiftsForDay = (day) => {
        if (!day) return [];

        const dateStr = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            day
        )
            .toISOString()
            .split('T')[0];

        return shifts.filter((shift) => shift.date.split('T')[0] === dateStr);
    };

    // Shift type colors
    const getShiftColor = (shiftType) => {
        switch (shiftType) {
            case 'morning':
                return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case 'afternoon':
                return 'bg-blue-100 text-blue-800 border-blue-300';
            case 'evening':
                return 'bg-purple-100 text-purple-800 border-purple-300';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    const getShiftLabel = (shiftType) => {
        switch (shiftType) {
            case 'morning':
                return 'Sáng';
            case 'afternoon':
                return 'Chiều';
            case 'evening':
                return 'Tối';
            default:
                return shiftType;
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    const days = getCalendarDays();
    const weekDays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

    return (
        <section className="container mx-auto grid gap-2 z-10">
            <Card className="py-6 flex-row justify-between gap-6 border-card-foreground">
                <CardHeader>
                    <CardTitle className="text-lg text-highlight font-bold uppercase">
                        Ca làm của tôi
                    </CardTitle>
                    <CardDescription>Quản lý danh sách ca làm</CardDescription>
                </CardHeader>
                <CardFooter className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={goToPreviousMonth}
                    >
                        <FaChevronLeft />
                    </Button>
                    <span className="font-semibold text-lg min-w-28 text-center">
                        Tháng {currentDate.getMonth() + 1}/
                        {currentDate.getFullYear()}
                    </span>
                    <Button variant="outline" size="sm" onClick={goToNextMonth}>
                        <FaChevronRight />
                    </Button>
                </CardFooter>
            </Card>
            <Card className="py-4">
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loading />
                        </div>
                    ) : (
                        <div className="border border-card-foreground rounded-lg overflow-hidden">
                            {/* Week days header */}
                            <div className="grid grid-cols-7 bg-border border-b-2 border-card-foreground">
                                {weekDays.map((day, index) => (
                                    <div
                                        key={index}
                                        className="p-3 text-center font-semibold border-r last:border-r-0"
                                    >
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Calendar grid */}
                            <div className="grid grid-cols-7">
                                {days.map((day, index) => {
                                    const dayShifts = getShiftsForDay(day);
                                    const isToday =
                                        day &&
                                        new Date().getDate() === day &&
                                        new Date().getMonth() ===
                                            currentDate.getMonth() &&
                                        new Date().getFullYear() ===
                                            currentDate.getFullYear();

                                    return (
                                        <div
                                            key={index}
                                            className={`min-h-[100px] p-2 border-r border-b last:border-r-0 ${
                                                !day ? 'bg-input' : ''
                                            } ${
                                                isToday
                                                    ? 'dark:bg-gray-800 bg-amber-100'
                                                    : ''
                                            }`}
                                        >
                                            {day && (
                                                <>
                                                    <div className="font-semibold text-sm mb-1">
                                                        {day}
                                                    </div>
                                                    <div className="space-y-1">
                                                        {dayShifts.map(
                                                            (shift) => (
                                                                <div
                                                                    key={
                                                                        shift._id
                                                                    }
                                                                    onClick={() => {
                                                                        setSelectedShift(
                                                                            shift
                                                                        );
                                                                        setIsDetailModalOpen(
                                                                            true
                                                                        );
                                                                    }}
                                                                    className={`text-xs px-2 py-1 rounded border cursor-pointer hover:opacity-80 ${getShiftColor(
                                                                        shift.shiftType
                                                                    )}`}
                                                                >
                                                                    {getShiftLabel(
                                                                        shift.shiftType
                                                                    )}
                                                                </div>
                                                            )
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Legend */}
                    <div className="mt-4 flex gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
                            <span>Ca Sáng</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
                            <span>Ca Chiều</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-purple-100 border border-purple-300 rounded"></div>
                            <span>Ca Tối</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Shift Detail Modal */}
            <Dialog
                open={isDetailModalOpen}
                onOpenChange={setIsDetailModalOpen}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Chi tiết ca làm</DialogTitle>
                    </DialogHeader>
                    {selectedShift && (
                        <div className="space-y-3">
                            <div>
                                <span className="font-semibold">Ngày:</span>{' '}
                                {formatDate(selectedShift.date)}
                            </div>
                            <div>
                                <span className="font-semibold">Ca:</span>{' '}
                                <span
                                    className={`px-2 py-1 rounded text-sm ${getShiftColor(
                                        selectedShift.shiftType
                                    )}`}
                                >
                                    {getShiftLabel(selectedShift.shiftType)}
                                </span>
                            </div>
                            <div>
                                <span className="font-semibold">Giờ làm:</span>{' '}
                                {selectedShift.startTime} -{' '}
                                {selectedShift.endTime}
                            </div>
                            {selectedShift.notes && (
                                <div>
                                    <span className="font-semibold">
                                        Ghi chú:
                                    </span>{' '}
                                    {selectedShift.notes}
                                </div>
                            )}
                            <div>
                                <span className="font-semibold">
                                    Số nhân viên:
                                </span>{' '}
                                {selectedShift.assignedStaff?.length || 0}/
                                {selectedShift.maxStaff}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </section>
    );
};

export default MyShiftsPage;
