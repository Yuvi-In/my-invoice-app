import { useState, useEffect } from 'react';
import axios from 'axios';

const BASE_URL = "http://192.168.1.6:5000/api";

type Invoice = {
  Document_ID: string;
  Payment_Status: string;
  Advance_Payment: number;
};

type InvoiceUpdateProps = {
  invoiceId: string;
  onUpdated?: () => void;
};

const InvoiceUpdate = ({ invoiceId, onUpdated }: InvoiceUpdateProps) => {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [updateData, setUpdateData] = useState<{ Payment_Status: string; Advance_Payment: number }>({ Payment_Status: 'Unpaid', Advance_Payment: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/invoices/${invoiceId}`);
        setInvoice(response.data);
        setUpdateData({
          Payment_Status: response.data.Payment_Status || 'Unpaid',
          Advance_Payment: Number(response.data.Advance_Payment) || 0,
        });
      } catch (err: any) {
        setError("Failed to load invoice.");
      }
    };
    fetchInvoice();
  }, [invoiceId]);

  const handleUpdate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await axios.put(`${BASE_URL}/invoices/${invoiceId}`, updateData);
      alert('Invoice updated successfully!');
      if (onUpdated) onUpdated();
    } catch (err: any) {
      setError("Failed to update invoice.");
    } finally {
      setIsLoading(false);
    }
  };

  if (error) return <div className="text-red-500">{error}</div>;
  if (!invoice) return <div>Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md mt-6">
      <h2 className="text-2xl font-bold mb-4">Update Invoice {invoice.Document_ID}</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Payment Status</label>
          <select
            value={updateData.Payment_Status}
            onChange={(e) => setUpdateData((prev) => ({ ...prev, Payment_Status: e.target.value }))}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="Unpaid">Unpaid</option>
            <option value="Paid">Paid</option>
            <option value="Partially Paid">Partially Paid</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Advance Payment (LKR)</label>
          <input
            type="number"
            value={updateData.Advance_Payment}
            onChange={(e) => setUpdateData((prev) => ({ ...prev, Advance_Payment: Number(e.target.value) }))}
            min="0"
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
        <button
          onClick={handleUpdate}
          className="px-4 py-2 bg-green-500 text-white rounded-md"
          disabled={isLoading}
        >
          {isLoading ? "Updating..." : "Update"}
        </button>
      </div>
    </div>
  );
};

export default InvoiceUpdate;