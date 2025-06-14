import { useState, ChangeEvent, FormEvent } from 'react';
import axios from 'axios';

const BASE_URL = "http://192.168.1.6:5000/api";

type Item = {
  Item_Description: string;
  Quantity: number;
  Rate: number;
  Line_Total: number;
};

type FormData = {
  Document_Type: string;
  Customer_Name: string;
  Address: string;
  Customer_Mobile: string;
  Customer_Type: string;
  Items: Item[];
  Total_Amount: number;
  Purchasing_Order: string;
  Payment_Method: string;
  Discount_Price: number;
  Advance_Payment: number;
};

const InvoiceForm = () => {
  const [formData, setFormData] = useState<FormData>({
    Document_Type: 'Invoice',
    Customer_Name: '',
    Address: '',
    Customer_Mobile: '',
    Customer_Type: 'In-store',
    Items: [{ Item_Description: '', Quantity: 1, Rate: 0, Line_Total: 0 }],
    Total_Amount: 0,
    Purchasing_Order: '',
    Payment_Method: 'Cash',
    Discount_Price: 0,
    Advance_Payment: 0,
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index: number, e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newItems = [...formData.Items];
    if (name === 'Quantity' || name === 'Rate') {
      newItems[index][name as 'Quantity' | 'Rate'] = Number(value);
    } else if (name === 'Item_Description') {
      newItems[index].Item_Description = value;
    }
    newItems[index].Line_Total = newItems[index].Quantity * newItems[index].Rate;
    setFormData((prev) => ({
      ...prev,
      Items: newItems,
      Total_Amount: newItems.reduce((sum, item) => sum + item.Line_Total, 0),
    }));
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      Items: [...prev.Items, { Item_Description: '', Quantity: 1, Rate: 0, Line_Total: 0 }],
    }));
  };

  const validateForm = () => {
    if (!formData.Customer_Name.trim()) {
      alert("Customer Name/Nickname is required.");
      return false;
    }
    if (!formData.Customer_Mobile.trim()) {
      alert("Mobile/Phone is required.");
      return false;
    }
    if (formData.Discount_Price < 0) {
      alert("Discount cannot be negative.");
      return false;
    }
    if (formData.Advance_Payment < 0) {
      alert("Advance payment cannot be negative.");
      return false;
    }
    if (formData.Items.length === 0) {
      alert("At least one item is required.");
      return false;
    }
    for (const item of formData.Items) {
      if (!item.Item_Description.trim() || item.Quantity < 1 || item.Rate < 0) {
        alert("Each item must have a description, quantity > 0, and rate ≥ 0.");
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSaving(true);
    try {
      const customer = await axios.post(`${BASE_URL}/customers/search`, {
        Customer_Type: formData.Customer_Type,
        Identifier: formData.Customer_Type === 'In-store' ? formData.Customer_Mobile : formData.Customer_Name,
      });
      const payload = {
        ...formData,
        Customer_ID: customer.data._id,
        invoiceDateInput: new Date().toISOString().split('T')[0],
      };
      const response = await axios.post(`${BASE_URL}/invoices`, payload);
      alert('Invoice created successfully!');
      await printInvoice(response.data._id);
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to create invoice.");
    } finally {
      setIsSaving(false);
    }
  };

  const printInvoice = async (invoiceId: string) => {
    const response = await axios.post(`${BASE_URL}/invoices/${invoiceId}/print`, formData, {
      responseType: 'arraybuffer',
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `invoice_${invoiceId}.pdf`;
    link.click();
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Create Invoice</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Document Type</label>
          <select name="Document_Type" value={formData.Document_Type} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
            <option value="Invoice">Invoice</option>
            <option value="Quotation">Quotation</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Customer Type</label>
          <select name="Customer_Type" value={formData.Customer_Type} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
            <option value="In-store">In-store</option>
            <option value="Production">Production</option>
            <option value="Wedding Invitation Maker">Wedding Invitation Maker</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Customer Name/Nickname</label>
          <input type="text" name="Customer_Name" value={formData.Customer_Name} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Mobile/Phone</label>
          <input type="text" name="Customer_Mobile" value={formData.Customer_Mobile} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Address</label>
          <input type="text" name="Address" value={formData.Address} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Purchasing Order (Optional)</label>
          <input type="text" name="Purchasing_Order" value={formData.Purchasing_Order} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Payment Method</label>
          <select name="Payment_Method" value={formData.Payment_Method} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
            <option value="Cash">Cash</option>
            <option value="Cheque">Cheque</option>
            <option value="Online Transfer">Online Transfer</option>
            <option value="Credit Card">Credit Card</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Discount Price (%)</label>
          <input type="number" name="Discount_Price" value={formData.Discount_Price} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" min="0" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Advance Payment (LKR)</label>
          <input type="number" name="Advance_Payment" value={formData.Advance_Payment} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" min="0" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Items</label>
          {formData.Items.map((item, index) => (
            <div key={index} className="grid grid-cols-4 gap-4 mb-2">
              <input type="text" name="Item_Description" value={item.Item_Description} onChange={(e) => handleItemChange(index, e)} placeholder="Description" className="p-2 border border-gray-300 rounded-md" />
              <input type="number" name="Quantity" value={item.Quantity} onChange={(e) => handleItemChange(index, e)} min="1" className="p-2 border border-gray-300 rounded-md" />
              <input type="number" name="Rate" value={item.Rate} onChange={(e) => handleItemChange(index, e)} min="0" className="p-2 border border-gray-300 rounded-md" />
              <span className="p-2">{item.Line_Total.toFixed(2)} LKR</span>
            </div>
          ))}
          <button type="button" onClick={addItem} className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md">Add Item</button>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Total Amount</label>
          <input type="text" value={formData.Total_Amount.toFixed(2)} readOnly className="mt-1 block w-full p-2 border border-gray-300 rounded-md bg-gray-100" />
        </div>
        <button type="submit" className="w-full px-4 py-2 bg-green-500 text-white rounded-md" disabled={isSaving}>
          {isSaving ? "Saving..." : "Create & Print Invoice"}
        </button>
      </form>
    </div>
  );
};

export default InvoiceForm;