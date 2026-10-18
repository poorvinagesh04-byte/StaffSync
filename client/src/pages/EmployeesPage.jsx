import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Users,
  Search,
  PlusCircle,
  Download,
  Filter,
  Edit2,
  Trash2,
  Eye,
  Grid,
  List,
  Mail,
  Phone,
  Briefcase,
  CheckCircle,
  XCircle,
  UserCheck,
} from 'lucide-react';
import { employeeAPI, reportAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import ConfirmationModal from '../components/ConfirmationModal';

const DEPARTMENTS = [
  'Human Resources',
  'Engineering',
  'Marketing',
  'Sales',
  'Finance',
  'Operations',
  'Design',
];

const EmployeesPage = () => {
  const { user } = useSelector((state) => state.auth);
  const isHR = user?.role === 'HR';

  const [employees, setEmployees] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'

  // Filters
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Form inputs for Add/Edit
  const [formData, setFormData] = useState({
    employeeId: '',
    firstName: '',
    lastName: '',
    email: '',
    password: 'StaffSync@2025',
    role: 'EMPLOYEE',
    department: 'Engineering',
    designation: '',
    phone: '',
    manager: '',
    joiningDate: new Date().toISOString().split('T')[0],
  });

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        search,
        department,
        status,
        role: roleFilter,
      };

      const res = await employeeAPI.getEmployees(params);
      setEmployees(res.data.employees);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error('Failed to fetch employees:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchManagersList = async () => {
    try {
      const res = await employeeAPI.getManagers();
      setManagers(res.data.managers);
    } catch (err) {
      console.error('Failed to fetch managers list:', err);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [page, department, status, roleFilter]);

  useEffect(() => {
    if (isHR) {
      fetchManagersList();
    }
  }, [isHR]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchEmployees();
  };

  const handleExportCSV = async () => {
    try {
      const res = await reportAPI.exportEmployeesCSV();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'staffsync_employees.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to export CSV');
    }
  };

  const handleOpenAddModal = () => {
    setFormData({
      employeeId: `EMP${Math.floor(100 + Math.random() * 900)}`,
      firstName: '',
      lastName: '',
      email: '',
      password: 'StaffSync@2025',
      role: 'EMPLOYEE',
      department: 'Engineering',
      designation: '',
      phone: '',
      manager: '',
      joiningDate: new Date().toISOString().split('T')[0],
    });
    setFormError('');
    setShowAddModal(true);
  };

  const handleOpenEditModal = (emp) => {
    setSelectedEmployee(emp);
    setFormData({
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email,
      role: emp.role,
      department: emp.department,
      designation: emp.designation,
      phone: emp.phone || '',
      manager: emp.manager?._id || emp.manager || '',
      joiningDate: emp.joiningDate ? new Date(emp.joiningDate).toISOString().split('T')[0] : '',
      status: emp.status,
    });
    setFormError('');
    setShowEditModal(true);
  };

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    try {
      setModalLoading(true);
      setFormError('');
      await employeeAPI.createEmployee(formData);
      setShowAddModal(false);
      fetchEmployees();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create employee');
    } finally {
      setModalLoading(false);
    }
  };

  const handleUpdateEmployee = async (e) => {
    e.preventDefault();
    try {
      setModalLoading(true);
      setFormError('');
      await employeeAPI.updateEmployee(selectedEmployee._id, formData);
      setShowEditModal(false);
      fetchEmployees();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to update employee');
    } finally {
      setModalLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    try {
      setModalLoading(true);
      const newStatus = selectedEmployee.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await employeeAPI.updateEmployeeStatus(selectedEmployee._id, newStatus);
      setShowStatusModal(false);
      fetchEmployees();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="container-fluid px-0">
      {/* Header and Actions */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h3 className="fw-bold text-navy mb-1">Employee Directory</h3>
          <p className="text-muted small mb-0">
            {total} employees registered in the company directory
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          {isHR && (
            <>
              <button
                className="btn btn-primary px-3 py-2 rounded-3 fw-medium d-flex align-items-center gap-2 shadow-sm"
                onClick={handleOpenAddModal}
              >
                <PlusCircle size={18} /> Add Employee
              </button>
              <button
                className="btn btn-outline-secondary px-3 py-2 rounded-3 d-flex align-items-center gap-2"
                onClick={handleExportCSV}
                title="Download CSV report"
              >
                <Download size={18} /> Export
              </button>
            </>
          )}

          <div className="btn-group border rounded-3 p-1 bg-white">
            <button
              className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-light'} border-0 rounded-2`}
              onClick={() => setViewMode('table')}
              title="Table View"
            >
              <List size={16} />
            </button>
            <button
              className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-light'} border-0 rounded-2`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <Grid size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card custom-card p-3 mb-4">
        <form onSubmit={handleSearchSubmit} className="row g-2 align-items-center">
          <div className="col-12 col-md-4">
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0 text-muted">
                <Search size={16} />
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-0 shadow-none"
                placeholder="Search by name, ID, email, title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="col-6 col-md-3">
            <select
              className="form-select shadow-none"
              value={department}
              onChange={(e) => {
                setDepartment(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Departments</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="col-6 col-md-2">
            <select
              className="form-select shadow-none"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>

          <div className="col-6 col-md-2">
            <select
              className="form-select shadow-none"
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Roles</option>
              <option value="HR">HR</option>
              <option value="MANAGER">Manager</option>
              <option value="EMPLOYEE">Employee</option>
            </select>
          </div>

          <div className="col-6 col-md-1">
            <button type="submit" className="btn btn-outline-primary w-100 py-2">
              Filter
            </button>
          </div>
        </form>
      </div>

      {/* Main Content Area: Table View or Grid View */}
      {loading ? (
        <LoadingSpinner message="Loading employee directory..." />
      ) : employees.length === 0 ? (
        <div className="card custom-card p-5 text-center text-muted">
          <Users size={48} className="mx-auto mb-3 text-secondary opacity-50" />
          <h5>No employees match your search criteria</h5>
          <p className="small mb-0">Try adjusting your filters or search keyword</p>
        </div>
      ) : viewMode === 'table' ? (
        <div className="card custom-card overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>ID</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Manager</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp._id}>
                    <td>
                      <div className="d-flex align-items-center gap-3">
                        {emp.avatarUrl ? (
                          <img
                            src={emp.avatarUrl}
                            alt="Avatar"
                            className="rounded-circle"
                            style={{ width: '38px', height: '38px', objectFit: 'cover' }}
                          />
                        ) : (
                          <div
                            className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold"
                            style={{ width: '38px', height: '38px', fontSize: '0.85rem' }}
                          >
                            {emp.firstName?.[0]}
                          </div>
                        )}
                        <div>
                          <div className="fw-semibold text-navy">
                            {emp.firstName} {emp.lastName}
                          </div>
                          <span className="text-muted small">{emp.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge bg-light text-navy border small fw-mono">
                        {emp.employeeId}
                      </span>
                    </td>
                    <td>{emp.department}</td>
                    <td>{emp.designation}</td>
                    <td>
                      {emp.manager ? (
                        <span className="small text-muted">
                          {emp.manager.firstName} {emp.manager.lastName}
                        </span>
                      ) : (
                        <span className="text-muted small">None</span>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={emp.status} />
                    </td>
                    <td className="text-end">
                      <div className="d-flex align-items-center justify-content-end gap-1">
                        <button
                          className="btn btn-sm btn-light border p-1 rounded-2"
                          onClick={() => {
                            setSelectedEmployee(emp);
                            setShowViewModal(true);
                          }}
                          title="View Profile Details"
                        >
                          <Eye size={15} />
                        </button>
                        {isHR && (
                          <>
                            <button
                              className="btn btn-sm btn-light border p-1 rounded-2 text-primary"
                              onClick={() => handleOpenEditModal(emp)}
                              title="Edit Employee"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              className={`btn btn-sm btn-light border p-1 rounded-2 ${
                                emp.status === 'ACTIVE' ? 'text-danger' : 'text-success'
                              }`}
                              onClick={() => {
                                setSelectedEmployee(emp);
                                setShowStatusModal(true);
                              }}
                              title={emp.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                            >
                              {emp.status === 'ACTIVE' ? <XCircle size={15} /> : <CheckCircle size={15} />}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid Cards View */
        <div className="row g-3 g-xl-4">
          {employees.map((emp) => (
            <div key={emp._id} className="col-12 col-sm-6 col-lg-4 col-xl-3">
              <div className="card custom-card h-100 p-4 text-center position-relative">
                <div className="position-absolute top-0 end-0 p-3">
                  <StatusBadge status={emp.status} />
                </div>

                <div className="mx-auto mb-3">
                  {emp.avatarUrl ? (
                    <img
                      src={emp.avatarUrl}
                      alt="Avatar"
                      className="rounded-circle shadow-sm"
                      style={{ width: '70px', height: '70px', objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold mx-auto fs-4 shadow-sm"
                      style={{ width: '70px', height: '70px' }}
                    >
                      {emp.firstName?.[0]}
                    </div>
                  )}
                </div>

                <h6 className="fw-bold text-navy mb-1">
                  {emp.firstName} {emp.lastName}
                </h6>
                <div className="text-primary small fw-medium mb-1">{emp.designation}</div>
                <div className="text-muted small mb-3">{emp.department}</div>

                <div className="p-2 rounded-3 bg-light border small text-start mb-3">
                  <div className="d-flex align-items-center gap-2 text-muted mb-1 text-truncate">
                    <Mail size={14} /> <span className="text-truncate">{emp.email}</span>
                  </div>
                  {emp.phone && (
                    <div className="d-flex align-items-center gap-2 text-muted">
                      <Phone size={14} /> <span>{emp.phone}</span>
                    </div>
                  )}
                </div>

                <div className="d-flex gap-2 justify-content-center mt-auto">
                  <button
                    className="btn btn-sm btn-outline-primary px-3 rounded-pill"
                    onClick={() => {
                      setSelectedEmployee(emp);
                      setShowViewModal(true);
                    }}
                  >
                    View Info
                  </button>
                  {isHR && (
                    <button
                      className="btn btn-sm btn-light border px-3 rounded-pill"
                      onClick={() => handleOpenEditModal(emp)}
                    >
                      Edit
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-between align-items-center mt-4">
          <span className="small text-muted">
            Showing Page {page} of {totalPages}
          </span>
          <div className="btn-group">
            <button
              className="btn btn-sm btn-outline-secondary"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </button>
            <button
              className="btn btn-sm btn-outline-secondary"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ADD EMPLOYEE MODAL (HR Only)                                   */}
      {/* ============================================================== */}
      {showAddModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content shadow-lg border-0 rounded-4">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-navy">Add New Employee</h5>
                <button type="button" className="btn-close" onClick={() => setShowAddModal(false)} />
              </div>
              <form onSubmit={handleCreateEmployee}>
                <div className="modal-body py-3">
                  {formError && <div className="alert alert-danger py-2 small">{formError}</div>}
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Employee ID *</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={formData.employeeId}
                        onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">First Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Last Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Email Address *</label>
                      <input
                        type="email"
                        className="form-control"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Initial Password *</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Role *</label>
                      <select
                        className="form-select"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      >
                        <option value="EMPLOYEE">Employee</option>
                        <option value="MANAGER">Manager</option>
                        <option value="HR">HR Admin</option>
                      </select>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Department *</label>
                      <select
                        className="form-select"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      >
                        {DEPARTMENTS.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Designation *</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        placeholder="e.g. Senior Frontend Dev"
                        value={formData.designation}
                        onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Assigned Manager</label>
                      <select
                        className="form-select"
                        value={formData.manager}
                        onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                      >
                        <option value="">No Manager (Direct Executive)</option>
                        {managers.map((m) => (
                          <option key={m._id} value={m._id}>
                            {m.firstName} {m.lastName} ({m.designation})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Joining Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.joiningDate}
                        onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0 pt-0">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary px-4" disabled={modalLoading}>
                    {modalLoading ? 'Creating...' : 'Create Employee'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* EDIT EMPLOYEE MODAL (HR Only)                                  */}
      {/* ============================================================== */}
      {showEditModal && selectedEmployee && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content shadow-lg border-0 rounded-4">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-navy">
                  Edit Employee: {selectedEmployee.employeeId}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowEditModal(false)} />
              </div>
              <form onSubmit={handleUpdateEmployee}>
                <div className="modal-body py-3">
                  {formError && <div className="alert alert-danger py-2 small">{formError}</div>}
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">First Name</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Last Name</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Email Address</label>
                      <input
                        type="email"
                        className="form-control"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Phone</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Department</label>
                      <select
                        className="form-select"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      >
                        {DEPARTMENTS.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Designation</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={formData.designation}
                        onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Role</label>
                      <select
                        className="form-select"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      >
                        <option value="EMPLOYEE">Employee</option>
                        <option value="MANAGER">Manager</option>
                        <option value="HR">HR Admin</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Assigned Manager</label>
                      <select
                        className="form-select"
                        value={formData.manager}
                        onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                      >
                        <option value="">No Manager</option>
                        {managers.map((m) => (
                          <option key={m._id} value={m._id}>
                            {m.firstName} {m.lastName} ({m.designation})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Employment Status</label>
                      <select
                        className="form-select"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                        <option value="SUSPENDED">Suspended</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0 pt-0">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowEditModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary px-4" disabled={modalLoading}>
                    {modalLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW PROFILE MODAL                                             */}
      {/* ============================================================== */}
      {showViewModal && selectedEmployee && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg border-0 rounded-4">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-navy">Employee Information</h5>
                <button type="button" className="btn-close" onClick={() => setShowViewModal(false)} />
              </div>
              <div className="modal-body py-4 text-center">
                <div className="mb-3">
                  {selectedEmployee.avatarUrl ? (
                    <img
                      src={selectedEmployee.avatarUrl}
                      alt="Avatar"
                      className="rounded-circle shadow-sm"
                      style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold mx-auto fs-3 shadow-sm"
                      style={{ width: '80px', height: '80px' }}
                    >
                      {selectedEmployee.firstName?.[0]}
                    </div>
                  )}
                </div>
                <h5 className="fw-bold text-navy mb-1">
                  {selectedEmployee.firstName} {selectedEmployee.lastName}
                </h5>
                <p className="text-muted small mb-2">{selectedEmployee.designation} &bull; {selectedEmployee.department}</p>
                <StatusBadge status={selectedEmployee.status} />

                <div className="text-start mt-4 p-3 bg-light rounded-3 small">
                  <div className="row g-2">
                    <div className="col-4 text-muted">Employee ID:</div>
                    <div className="col-8 fw-semibold">{selectedEmployee.employeeId}</div>

                    <div className="col-4 text-muted">Email:</div>
                    <div className="col-8">{selectedEmployee.email}</div>

                    <div className="col-4 text-muted">Phone:</div>
                    <div className="col-8">{selectedEmployee.phone || 'Not provided'}</div>

                    <div className="col-4 text-muted">Role:</div>
                    <div className="col-8">{selectedEmployee.role}</div>

                    <div className="col-4 text-muted">Manager:</div>
                    <div className="col-8">
                      {selectedEmployee.manager
                        ? `${selectedEmployee.manager.firstName} ${selectedEmployee.manager.lastName}`
                        : 'None'}
                    </div>

                    <div className="col-4 text-muted">Joined:</div>
                    <div className="col-8">
                      {selectedEmployee.joiningDate
                        ? new Date(selectedEmployee.joiningDate).toLocaleDateString()
                        : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer border-0 pt-0">
                <button type="button" className="btn btn-secondary w-100 rounded-3" onClick={() => setShowViewModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Activation/Deactivation */}
      <ConfirmationModal
        isOpen={showStatusModal}
        title={`${selectedEmployee?.status === 'ACTIVE' ? 'Deactivate' : 'Activate'} Employee`}
        message={`Are you sure you want to ${
          selectedEmployee?.status === 'ACTIVE' ? 'deactivate' : 'activate'
        } ${selectedEmployee?.firstName} ${selectedEmployee?.lastName} (${selectedEmployee?.employeeId})?`}
        confirmText={selectedEmployee?.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
        confirmVariant={selectedEmployee?.status === 'ACTIVE' ? 'danger' : 'success'}
        onConfirm={handleToggleStatus}
        onCancel={() => setShowStatusModal(false)}
        loading={modalLoading}
      />
    </div>
  );
};

export default EmployeesPage;

