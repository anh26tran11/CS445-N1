import React, { useState, useEffect } from 'react';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from '@/components/ui/dialog';
import { FaPlus, FaEdit, FaTrash, FaEye } from 'react-icons/fa';
import Loading from '../components/Loading';
import GlareHover from '@/components/GlareHover';
import { IoClose } from 'react-icons/io5';

const EmployeeManagementPage = () => {
    const user = useSelector((state) => state.user);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filterRole, setFilterRole] = useState('ALL');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        mobile: '',
        role: 'WAITER',
        position: '',
        hireDate: new Date().toISOString().split('T')[0],
    });

    const roles = ['ADMIN', 'MANAGER', 'WAITER', 'CHEF', 'CASHIER'];

    // Fetch employees
    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const response = await Axios({
                ...SummaryApi.get_all_employees,
                params: {
                    role: filterRole === 'ALL' ? '' : filterRole,
                    employeeStatus: filterStatus === 'ALL' ? '' : filterStatus,
                    search: searchTerm,
                },
            });

            if (response.data.success) {
                setEmployees(response.data.data);
            }
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, [filterRole, filterStatus, searchTerm]);

    // Handle form change
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSelectChange = (name, value) => {
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // Create employee
    const handleCreateEmployee = async (e) => {
        e.preventDefault();

        try {
            const response = await Axios({
                ...SummaryApi.create_employee,
                data: formData,
            });

            if (response.data.success) {
                successAlert(response.data.message);
                setIsAddModalOpen(false);
                setFormData({
                    name: '',
                    email: '',
                    password: '',
                    mobile: '',
                    role: 'WAITER',
                    position: '',
                    hireDate: new Date().toISOString().split('T')[0],
                });
                fetchEmployees();
            }
        } catch (error) {
            AxiosToastError(error);
        }
    };

    // Update employee
    const handleUpdateEmployee = async (e) => {
        e.preventDefault();

        try {
            const response = await Axios({
                ...SummaryApi.update_employee,
                url: SummaryApi.update_employee.url.replace(
                    ':id',
                    selectedEmployee._id
                ),
                data: formData,
            });

            if (response.data.success) {
                successAlert(response.data.message);
                setIsEditModalOpen(false);
                setSelectedEmployee(null);
                fetchEmployees();
            }
        } catch (error) {
            AxiosToastError(error);
        }
    };

    // Delete employee
    const handleDeleteEmployee = async (id) => {
        if (
            !window.confirm('Bạn có chắc chắn muốn vô hiệu hóa nhân viên này?')
        ) {
            return;
        }

        try {
            const response = await Axios({
                ...SummaryApi.delete_employee,
                url: SummaryApi.delete_employee.url.replace(':id', id),
            });

            if (response.data.success) {
                successAlert(response.data.message);
                fetchEmployees();
            }
        } catch (error) {
            AxiosToastError(error);
        }
    };

    // Open edit modal
    const openEditModal = (employee) => {
        setSelectedEmployee(employee);
        setFormData({
            name: employee.name,
            email: employee.email,
            mobile: employee.mobile || '',
            role: employee.role,
            position: employee.position || '',
            hireDate: employee.hireDate
                ? new Date(employee.hireDate).toISOString().split('T')[0]
                : new Date().toISOString().split('T')[0],
        });
        setIsEditModalOpen(true);
    };

    // Check if user has permission
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
                        Quản lý Nhân viên
                    </CardTitle>
                    <CardDescription>
                        Quản lý thông tin nhân viên
                    </CardDescription>
                </CardHeader>
                <CardFooter>
                    <Dialog
                        open={isAddModalOpen}
                        onOpenChange={setIsAddModalOpen}
                    >
                        <GlareHover
                            background="transparent"
                            glareOpacity={0.3}
                            glareAngle={-30}
                            glareSize={300}
                            transitionDuration={800}
                            playOnce={false}
                        >
                            <DialogTrigger asChild>
                                <Button className="bg-foreground">
                                    Thêm Nhân viên
                                </Button>
                            </DialogTrigger>
                        </GlareHover>
                        <DialogContent
                            showCloseButton={false}
                            className="w-full max-w-2xl overflow-hidden border-foreground"
                        >
                            <DialogHeader>
                                <DialogTitle className="text-lg text-highlight font-bold uppercase">
                                    Thêm nhân viên mới
                                </DialogTitle>

                                <DialogClose asChild>
                                    <button className="absolute right-4 top-4 p-2 rounded-md hover:bg-muted">
                                        <IoClose className="h-5 w-5" />
                                    </button>
                                </DialogClose>
                            </DialogHeader>
                            <form onSubmit={handleCreateEmployee}>
                                <CardContent className="grid grid-cols-2 gap-4 py-4 px-0 text-sm">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">
                                            Họ và tên{' '}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </Label>
                                        <Input
                                            id="name"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">
                                            Email{' '}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </Label>
                                        <Input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="password">
                                            Mật khẩu{' '}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </Label>
                                        <Input
                                            type="password"
                                            id="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="mobile">
                                            Số điện thoại
                                        </Label>
                                        <Input
                                            type="tel"
                                            id="mobile"
                                            name="mobile"
                                            value={formData.mobile}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="role">
                                            Vai trò{' '}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </Label>
                                        <Select
                                            value={formData.role}
                                            onValueChange={(value) =>
                                                handleSelectChange(
                                                    'role',
                                                    value
                                                )
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {roles.map((role) => (
                                                    <SelectItem
                                                        key={role}
                                                        value={role}
                                                    >
                                                        {role}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="position">Vị trí</Label>
                                        <Input
                                            id="position"
                                            name="position"
                                            value={formData.position}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="hireDate">
                                            Ngày vào làm
                                        </Label>
                                        <Input
                                            type="date"
                                            id="hireDate"
                                            name="hireDate"
                                            value={formData.hireDate}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </CardContent>
                                <div className="flex justify-end gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsAddModalOpen(false)}
                                    >
                                        Hủy
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="bg-foreground"
                                    >
                                        Tạo nhân viên
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </CardFooter>
            </Card>
            {/* Filters */}
            <Card className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm p-6">
                <div className="space-y-2">
                    <Label>Tìm kiếm</Label>
                    <Input
                        placeholder="Tên, email, mã nhân viên..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Vai trò</Label>
                    <Select value={filterRole} onValueChange={setFilterRole}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Tất cả vai trò" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Tất cả</SelectItem>
                            {roles.map((role) => (
                                <SelectItem key={role} value={role}>
                                    {role}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Trạng thái</Label>
                    <Select
                        value={filterStatus}
                        onValueChange={setFilterStatus}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Tất cả trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Tất cả</SelectItem>
                            <SelectItem value="active">
                                Đang làm việc
                            </SelectItem>
                            <SelectItem value="inactive">Nghỉ việc</SelectItem>
                            <SelectItem value="on_leave">Nghỉ phép</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </Card>

            {/* Table */}
            {loading ? (
                <div className="flex justify-center py-8">
                    <Loading />
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Mã NV</TableHead>
                            <TableHead>Tên</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Vai trò</TableHead>
                            <TableHead>Vị trí</TableHead>
                            <TableHead>Trạng thái</TableHead>
                            <TableHead>Thao tác</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {employees.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center">
                                    Không có nhân viên nào
                                </TableCell>
                            </TableRow>
                        ) : (
                            employees.map((employee) => (
                                <TableRow key={employee._id}>
                                    <TableCell>
                                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                                            {employee.employeeId || '-'}
                                        </span>
                                    </TableCell>
                                    <TableCell>{employee.name}</TableCell>
                                    <TableCell>{employee.email}</TableCell>
                                    <TableCell>
                                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                            {employee.role}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        {employee.position || '-'}
                                    </TableCell>
                                    <TableCell>
                                        <span
                                            className={`px-2 py-1 rounded text-xs ${
                                                employee.employeeStatus ===
                                                'active'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                            }`}
                                        >
                                            {employee.employeeStatus ===
                                            'active'
                                                ? 'Đang làm'
                                                : 'Nghỉ việc'}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    openEditModal(employee)
                                                }
                                            >
                                                <FaEdit />
                                            </Button>
                                            {user?.role === 'ADMIN' && (
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() =>
                                                        handleDeleteEmployee(
                                                            employee._id
                                                        )
                                                    }
                                                >
                                                    <FaTrash />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            )}

            {/* Edit Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Chỉnh sửa nhân viên</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleUpdateEmployee} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="edit-name">Họ và tên *</Label>
                                <Input
                                    id="edit-name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="edit-mobile">
                                    Số điện thoại
                                </Label>
                                <Input
                                    type="tel"
                                    id="edit-mobile"
                                    name="mobile"
                                    value={formData.mobile}
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <Label htmlFor="edit-role">Vai trò *</Label>
                                <Select
                                    value={formData.role}
                                    onValueChange={(value) =>
                                        handleSelectChange('role', value)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roles.map((role) => (
                                            <SelectItem key={role} value={role}>
                                                {role}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="edit-position">Vị trí</Label>
                                <Input
                                    id="edit-position"
                                    name="position"
                                    value={formData.position}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsEditModalOpen(false)}
                            >
                                Hủy
                            </Button>
                            <Button type="submit" className="bg-foreground">
                                Cập nhật
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </section>
    );
};

export default EmployeeManagementPage;
