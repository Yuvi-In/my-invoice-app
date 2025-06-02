import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface Customer {
  _id: string;
  Customer_Type: 'Production' | 'In-store' | 'Wedding Invitation Maker';
  Full_Name: string;
  Contact_Person?: string;
  Email?: string;
  Phone_Number?: string;
  Address?: string;
  Tax_ID?: string;
  Job_Type: 'Wedding Invitations' | 'Shoe Laser Cutting' | 'Laser Cutting';
  Status: 'Active' | 'Inactive';
  Created_At: string;
  Updated_At: string;
  Nickname?: string;
  Instore_Phone_Number?: string;
}

interface FormData {
  Customer_Type: 'Production' | 'In-store' | 'Wedding Invitation Maker';
  Full_Name: string;
  Contact_Person: string;
  Email: string;
  Phone_Number: string;
  Address: string;
  Tax_ID: string;
  Job_Type: 'Wedding Invitations' | 'Shoe Laser Cutting' | 'Laser Cutting';
  Status: 'Active' | 'Inactive';
  Nickname: string;
}

const CustomerManagement: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [formData, setFormData] = useState<FormData>({
    Customer_Type: 'In-store',
    Full_Name: '',
    Contact_Person: '',
    Email: '',
    Phone_Number: '',
    Address: '',
    Tax_ID: '',
    Job_Type: 'Wedding Invitations',
    Status: 'Active',
    Nickname: '',
  });
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All'); // New state for category filter

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get<Customer[]>('http://192.168.1.6:5000/api/customers');
      setCustomers(response.data);
    } catch (err) {
      toast.error('Failed to fetch customers');
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.Full_Name.trim()) {
      newErrors.Full_Name = 'Full name is required';
    }
    if (!formData.Job_Type) {
      newErrors.Job_Type = 'Job type is required';
    }
    if (formData.Email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.Email)) {
      newErrors.Email = 'Invalid email address';
    }
    if (formData.Customer_Type === 'In-store' && !formData.Phone_Number) {
      newErrors.Phone_Number = 'Phone number is required for In-store customers';
    } else if (formData.Phone_Number && !/^\d{9,10}$/.test(formData.Phone_Number)) {
      newErrors.Phone_Number = 'Phone number must be 9-10 digits';
    }
    if (formData.Tax_ID && !/^\d{9}$|^\d{9}-7000$/.test(formData.Tax_ID)) {
      newErrors.Tax_ID = 'Tax ID must be 9 digits or 9 digits with -7000';
    }
    if (['Production', 'Wedding Invitation Maker'].includes(formData.Customer_Type) && !formData.Nickname.trim()) {
      newErrors.Nickname = `Nickname is required for ${formData.Customer_Type} customers`;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const filteredCustomers = customers.filter((customer) => {
    const searchLower = searchQuery.toLowerCase();
    const nickname = customer.Nickname?.toLowerCase() || '';
    const phone = customer.Instore_Phone_Number?.toLowerCase() || customer.Phone_Number?.toLowerCase() || '';
    const matchesSearch = nickname.includes(searchLower) || phone.includes(searchLower);
    const matchesCategory = filterCategory === 'All' || customer.Customer_Type === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please check the form for errors');
      return;
    }
    setIsLoading(true);
    const payload = {
      Customer_Type: formData.Customer_Type,
      Full_Name: formData.Full_Name,
      Contact_Person: formData.Contact_Person || undefined,
      Email: formData.Email || undefined,
      Phone_Number: formData.Phone_Number || undefined,
      Address: formData.Address || undefined,
      Tax_ID: formData.Tax_ID || undefined,
      Job_Type: formData.Job_Type,
      Status: formData.Status,
      Nickname: ['Production', 'Wedding Invitation Maker'].includes(formData.Customer_Type) ? formData.Nickname : undefined,
    };
    try {
      if (editingCustomerId) {
        const response = await axios.put<Customer>(`http://192.168.1.6:5000/api/customers/${editingCustomerId}`, payload);
        setCustomers(customers.map((c) => (c._id === editingCustomerId ? response.data : c)));
        toast.success('Customer updated successfully');
      } else {
        const response = await axios.post<Customer>('http://192.168.1.6:5000/api/customers', payload);
        setCustomers([...customers, response.data]);
        toast.success('Customer created successfully');
      }
      resetForm();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Something went wrong, please try again');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async (id: string) => {
    try {
      const response = await axios.get<Customer>(`http://192.168.1.6:5000/api/customers/${id}`);
      setFormData({
        Customer_Type: response.data.Customer_Type,
        Full_Name: response.data.Full_Name,
        Contact_Person: response.data.Contact_Person || '',
        Email: response.data.Email || '',
        Phone_Number: response.data.Phone_Number || '',
        Address: response.data.Address || '',
        Tax_ID: response.data.Tax_ID || '',
        Job_Type: response.data.Job_Type,
        Status: response.data.Status,
        Nickname: response.data.Nickname || '',
      });
      setEditingCustomerId(id);
    } catch (err) {
      toast.error('Failed to fetch customer details');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    setIsLoading(true);
    try {
      await axios.delete(`http://192.168.1.6:5000/api/customers/${id}`);
      setCustomers(customers.filter((c) => c._id !== id));
      toast.success('Customer deleted successfully');
    } catch (err: any) {
      toast.error('Something went wrong, please try again');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      Customer_Type: 'In-store',
      Full_Name: '',
      Contact_Person: '',
      Email: '',
      Phone_Number: '',
      Address: '',
      Tax_ID: '',
      Job_Type: 'Wedding Invitations',
      Status: 'Active',
      Nickname: '',
    });
    setEditingCustomerId(null);
    setErrors({});
  };

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Customer Management</h1>

      {/* Customer Form */}
      <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          {editingCustomerId ? 'Edit Customer' : 'Add Customer'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="Customer_Type" className="block text-sm font-medium text-gray-700">
                Customer Type <span className="text-red-500">*</span>
              </label>
              <select
                id="Customer_Type"
                name="Customer_Type"
                value={formData.Customer_Type}
                onChange={handleChange}
                className="mt-1 w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                aria-label="Customer Type"
              >
                <option value="In-store">In-store</option>
                <option value="Production">Production</option>
                <option value="Wedding Invitation Maker">Wedding Invitation Maker</option>
              </select>
            </div>
            <div>
              <label htmlFor="Full_Name" className="block text-sm font-medium text-gray-700">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="Full_Name"
                name="Full_Name"
                value={formData.Full_Name}
                onChange={handleChange}
                className={`mt-1 w-full p-3 border ${
                  errors.Full_Name ? 'border-red-500' : 'border-gray-300'
                } rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                aria-label="Full Name"
                aria-describedby={errors.Full_Name ? 'Full_Name-error' : undefined}
              />
              {errors.Full_Name && (
                <p id="Full_Name-error" className="mt-1 text-sm text-red-600">
                  {errors.Full_Name}
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="Job_Type" className="block text-sm font-medium text-gray-700">
                Job Type <span className="text-red-500">*</span>
              </label>
              <select
                id="Job_Type"
                name="Job_Type"
                value={formData.Job_Type}
                onChange={handleChange}
                className={`mt-1 w-full p-3 border ${
                  errors.Job_Type ? 'border-red-500' : 'border-gray-300'
                } rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                aria-label="Job Type"
                aria-describedby={errors.Job_Type ? 'Job_Type-error' : undefined}
              >
                <option value="Wedding Invitations">Wedding Invitations</option>
                <option value="Shoe Laser Cutting">Shoe Laser Cutting</option>
                <option value="Laser Cutting">Laser Cutting</option>
              </select>
              {errors.Job_Type && (
                <p id="Job_Type-error" className="mt-1 text-sm text-red-600">
                  {errors.Job_Type}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="Contact_Person" className="block text-sm font-medium text-gray-700">
                Contact Person
              </label>
              <input
                type="text"
                id="Contact_Person"
                name="Contact_Person"
                value={formData.Contact_Person}
                onChange={handleChange}
                className="mt-1 w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                aria-label="Contact Person"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="Email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="Email"
                name="Email"
                value={formData.Email}
                onChange={handleChange}
                className={`mt-1 w-full p-3 border ${
                  errors.Email ? 'border-red-500' : 'border-gray-300'
                } rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                aria-label="Email"
                aria-describedby={errors.Email ? 'Email-error' : undefined}
              />
              {errors.Email && (
                <p id="Email-error" className="mt-1 text-sm text-red-600">
                  {errors.Email}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="Phone_Number" className="block text-sm font-medium text-gray-700">
                Phone Number {formData.Customer_Type === 'In-store' && <span className="text-red-500">*</span>}
              </label>
              <input
                type="text"
                id="Phone_Number"
                name="Phone_Number"
                value={formData.Phone_Number}
                onChange={handleChange}
                className={`mt-1 w-full p-3 border ${
                  errors.Phone_Number ? 'border-red-500' : 'border-gray-300'
                } rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                aria-label="Phone Number"
                aria-describedby={errors.Phone_Number ? 'Phone_Number-error' : undefined}
              />
              {errors.Phone_Number && (
                <p id="Phone_Number-error" className="mt-1 text-sm text-red-600">
                  {errors.Phone_Number}
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="Address" className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <input
                type="text"
                id="Address"
                name="Address"
                value={formData.Address}
                onChange={handleChange}
                className="mt-1 w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                aria-label="Address"
              />
            </div>
            <div>
              <label htmlFor="Tax_ID" className="block text-sm font-medium text-gray-700">
                Tax ID
              </label>
              <input
                type="text"
                id="Tax_ID"
                name="Tax_ID"
                value={formData.Tax_ID}
                onChange={handleChange}
                placeholder="e.g., 123456789 or 123456789-7000"
                className={`mt-1 w-full p-3 border ${
                  errors.Tax_ID ? 'border-red-500' : 'border-gray-300'
                } rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                aria-label="Tax ID"
                aria-describedby={errors.Tax_ID ? 'Tax_ID-error' : undefined}
              />
              {errors.Tax_ID && (
                <p id="Tax_ID-error" className="mt-1 text-sm text-red-600">
                  {errors.Tax_ID}
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="Status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="Status"
                name="Status"
                value={formData.Status}
                onChange={handleChange}
                className="mt-1 w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                aria-label="Status"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            {['Production', 'Wedding Invitation Maker'].includes(formData.Customer_Type) && (
              <div>
                <label htmlFor="Nickname" className="block text-sm font-medium text-gray-700">
                  Nickname <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="Nickname"
                  name="Nickname"
                  value={formData.Nickname}
                  onChange={handleChange}
                  className={`mt-1 w-full p-3 border ${
                    errors.Nickname ? 'border-red-500' : 'border-gray-300'
                  } rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                  aria-label="Nickname"
                  aria-describedby={errors.Nickname ? 'Nickname-error' : undefined}
                />
                {errors.Nickname && (
                  <p id="Nickname-error" className="mt-1 text-sm text-red-600">
                    {errors.Nickname}
                  </p>
                )}
              </div>
            )}
          </div>
          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300 disabled:cursor-not-allowed"
              aria-label={editingCustomerId ? 'Update Customer' : 'Create Customer'}
            >
              {isLoading ? 'Saving...' : editingCustomerId ? 'Update Customer' : 'Create Customer'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              aria-label="Cancel"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      {/* Customer List */}
      <div className="bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Customer List</h2>
        <div className="mb-4 flex items-center space-x-4">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search by nickname or phone number"
            className="w-full max-w-md p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            aria-label="Search customers"
          />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            aria-label="Filter by customer category"
          >
            <option value="All">All Categories</option>
            <option value="In-store">In-store</option>
            <option value="Production">Production</option>
            <option value="Wedding Invitation Maker">Wedding Invitation Maker</option>
          </select>
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              aria-label="Clear search"
            >
              Clear Search
            </button>
          )}
        </div>
        {isLoading ? (
          <p>Loading customers...</p>
        ) : filteredCustomers.length === 0 ? (
          <p>No customers found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Full Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Job Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact Person
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tax ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nickname
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomers.map((customer) => (
                  <tr key={customer._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{customer.Full_Name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{customer.Customer_Type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{customer.Job_Type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{customer.Contact_Person || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{customer.Email || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {customer.Instore_Phone_Number || customer.Phone_Number || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{customer.Address || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{customer.Tax_ID || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{customer.Nickname || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{customer.Status}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(customer._id)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                        aria-label={`Edit ${customer.Full_Name}`}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(customer._id)}
                        className="text-red-600 hover:text-red-900"
                        aria-label={`Delete ${customer.Full_Name}`}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerManagement;