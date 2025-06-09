import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface Customer {
  _id: string;
  customerType: 'Production' | 'In-store' | 'Wedding Invitation Maker';
  fullName: string;
  contactPerson: string;
  email?: string;
  phoneNumber?: string;
  address: string;
  paymentTerms: string;
  taxId?: string;
  status: 'Active' | 'Inactive';
  productionCustomer?: { nickname: string };
  weddingCustomer?: { nickname: string };
  instoreCustomer?: { phoneNumber: string };
}

interface CustomerListProps {
  onEdit: (customer: Customer) => void;
}

const CustomerList: React.FC<CustomerListProps> = ({ onEdit }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filterType, setFilterType] = useState<'All' | 'Production' | 'In-store' | 'Wedding Invitation Maker'>('All');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchCustomers = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get<Customer[]>('http://192.168.1.8:5000/api/customers');
        setCustomers(response.data);
      } catch (err) {
        toast.error('Failed to fetch customers');
      } finally {
        setIsLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    setIsLoading(true);
    try {
      await axios.delete(`http://192.168.1.8:5000/api/customers/${id}`);
      setCustomers(customers.filter((customer) => customer._id !== id));
      toast.success('Customer deleted successfully');
    } catch (err: any) {
      toast.error(`Failed to delete customer: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCustomers = filterType === 'All'
    ? customers
    : customers.filter((customer) => customer.customerType === filterType);

  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Customer List</h2>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Filter by Type</label>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as 'All' | 'Production' | 'In-store' | 'Wedding Invitation Maker')}
          className="mt-1 w-full md:w-1/4 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          aria-label="Filter by Customer Type"
        >
          <option value="All">All</option>
          <option value="Production">Production</option>
          <option value="In-store">In-store</option>
          <option value="Wedding Invitation Maker">Wedding Invitation Maker</option>
        </select>
      </div>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Person</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone Numer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TAX ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nickname</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <tr key={customer._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{customer.customerType}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{customer.fullName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{customer.contactPerson}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {customer.productionCustomer?.nickname ||
                     customer.weddingCustomer?.nickname ||
                     customer.instoreCustomer?.phoneNumber ||
                     'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{customer.email || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{customer.taxId || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{customer.status}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => onEdit(customer)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                      aria-label="Edit Customer"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(customer._id)}
                      className="text-red-600 hover:text-red-900"
                      aria-label="Delete Customer"
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
  );
};

export default CustomerList;