import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

interface CustomerFormProps {
  customerId?: string;
  onSave?: (data: any) => void;
}

const CustomerForm: React.FC<CustomerFormProps> = ({ customerId, onSave }) => {
  const [formData, setFormData] = useState({
    Customer_Type: '',
    Full_Name: '',
    Contact_Person: '',
    Email: '',
    Phone_Number: '',
    Address: '',
    Tax_ID: '',
    Job_Type: '',
    Status: 'Active',
    Nickname: '',
  });

  useEffect(() => {
    if (customerId) {
      // Fetch customer data for editing
      fetch(`http://192.168.1.3:5000/api/customers/${customerId}`)
        .then((response) => response.json())
        .then((data) => {
          if (data.error) {
            Swal.fire('Error', data.error, 'error');
          } else {
            setFormData(data);
          }
        })
        .catch((error) => {
          console.error('Error fetching customer:', error);
          Swal.fire('Error', 'Failed to load customer data. Please try again.', 'error');
        });
    }
  }, [customerId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
    const url = customerId ? `http://192.168.1.3:5000/api/customers/${customerId}` : 'http://192.168.1.3:5000/api/customers';
    const method = customerId ? 'PUT' : 'POST';

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          Swal.fire('Error', data.error, 'error');
        } else {
          Swal.fire('Success', customerId ? 'Customer updated successfully!' : 'Customer created successfully!', 'success');
          if (onSave) onSave(data);
        }
      })
      .catch((error) => {
        console.error('Error submitting customer:', error);
        Swal.fire('Error', 'An error occurred while saving the customer. Please try again.', 'error');
      });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block">Customer Type</label>
        <select name="Customer_Type" value={formData.Customer_Type} onChange={handleChange} className="border p-2 w-full">
          <option value="">Select Type</option>
          <option value="Production">Production</option>
          <option value="In-store">In-store</option>
          <option value="Wedding Invitation Maker">Wedding Invitation Maker</option>
        </select>
      </div>
      <div>
        <label className="block">Full Name</label>
        <input
          type="text"
          name="Full_Name"
          value={formData.Full_Name}
          onChange={handleChange}
          className="border p-2 w-full"
        />
      </div>
      <div>
        <label className="block">Contact Person</label>
        <input
          type="text"
          name="Contact_Person"
          value={formData.Contact_Person}
          onChange={handleChange}
          className="border p-2 w-full"
        />
      </div>
      <div>
        <label className="block">Email</label>
        <input
          type="email"
          name="Email"
          value={formData.Email}
          onChange={handleChange}
          className="border p-2 w-full"
        />
      </div>
      <div>
        <label className="block">Phone Number</label>
        <input
          type="text"
          name="Phone_Number"
          value={formData.Phone_Number}
          onChange={handleChange}
          className="border p-2 w-full"
        />
      </div>
      <div>
        <label className="block">Address</label>
        <input
          type="text"
          name="Address"
          value={formData.Address}
          onChange={handleChange}
          className="border p-2 w-full"
        />
      </div>
      <div>
        <label className="block">Tax ID</label>
        <input
          type="text"
          name="Tax_ID"
          value={formData.Tax_ID}
          onChange={handleChange}
          className="border p-2 w-full"
        />
      </div>
      <div>
        <label className="block">Job Type</label>
        <select name="Job_Type" value={formData.Job_Type} onChange={handleChange} className="border p-2 w-full">
          <option value="">Select Job Type</option>
          <option value="Wedding Invitations">Wedding Invitations</option>
          <option value="Shoe Laser Cutting">Shoe Laser Cutting</option>
          <option value="Laser Cutting">Laser Cutting</option>
        </select>
      </div>
      <div>
        <label className="block">Nickname</label>
        <input
          type="text"
          name="Nickname"
          value={formData.Nickname}
          onChange={handleChange}
          className="border p-2 w-full"
        />
      </div>
      <div>
        <label className="block">Status</label>
        <select name="Status" value={formData.Status} onChange={handleChange} className="border p-2 w-full">
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>
      <button type="submit" className="bg-blue-500 text-white p-2 rounded">
        {customerId ? 'Update Customer' : 'Create Customer'}
      </button>
    </form>
  );
};

export default CustomerForm;