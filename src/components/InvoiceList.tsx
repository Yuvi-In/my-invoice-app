import { useState, useEffect } from 'react';
import axios from 'axios';
import InvoiceUpdate from './InvoiceUpdate';

type Invoice = {
  _id: string;
  Document_ID: string;
  Customer_ID: {
    Full_Name: string;
  };
  Total_Amount: number;
};

const InvoiceList = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoices = async () => {
      const response = await axios.get('http://192.168.1.3:5000/api/invoices');
      setInvoices(response.data);
    };
    fetchInvoices();
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md mt-6">
      <h2 className="text-2xl font-bold mb-4">Invoice List</h2>
      <ul className="space-y-2">
        {invoices.map((invoice) => (
          <li key={invoice._id} className="p-2 border border-gray-200 rounded-md">
            {invoice.Document_ID} - {invoice.Customer_ID.Full_Name} (Total: {invoice.Total_Amount} LKR)
            <button
              onClick={() => setSelectedInvoice(invoice._id)}
              className="ml-4 px-2 py-1 bg-blue-500 text-white rounded-md"
            >
              Update
            </button>
          </li>
        ))}
      </ul>
      {selectedInvoice && <InvoiceUpdate invoiceId={selectedInvoice} />}
    </div>
  );
};

export default InvoiceList;