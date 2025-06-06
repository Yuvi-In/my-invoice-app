import React, { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

interface Customer {
  _id: string;
  Customer_Type: string;
  Full_Name?: string;
  Address?: string;
  Phone_Number?: string;
  Nickname?: string;
  Instore_Phone_Number?: string;
}

interface LineItem {
  Item_Description: string;
  Quantity: number;
  Rate: number;
  Line_Total: number;
}

const InvoiceManagement: React.FC = () => {
  // State for customer selection
  const [customerType, setCustomerType] = useState<string>("");
  const [identifier, setIdentifier] = useState<string>("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );

  // State for document type
  const [documentType, setDocumentType] = useState<string>("");

  // State for invoice date
  const [invoiceDate, setInvoiceDate] = useState<string>("");

  // State for items and total
  const [items, setItems] = useState<LineItem[]>([]);
  const [barcode, setBarcode] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);

  // Handle customer search
  const handleSearchCustomer = async () => {
    if (!customerType || !identifier) {
      Swal.fire(
        "Error",
        "Please select a customer type and provide an identifier.",
        "error"
      );
      return;
    }

    try {
      const response = await axios.post(
        "http://192.168.1.6:5000/api/customers/search",
        {
          Customer_Type: customerType,
          Identifier: identifier,
        }
      );
      setSelectedCustomer(response.data);
      Swal.fire(
        "Success",
        `Customer ${response.data.Full_Name} selected!`,
        "success"
      );
    } catch (error: any) {
      Swal.fire(
        "Error",
        error.response?.data?.error || "Failed to search customer.",
        "error"
      );
    }
  };

  // Handle barcode scan
  const handleScanBarcode = async () => {
    if (!barcode) {
      Swal.fire("Error", "Please enter a barcode.", "error");
      return;
    }
    if (quantity < 0) {
      Swal.fire("Error", "Quantity must be at least 1.", "error");
      return;
    }

    try {
      let body: any = { Barcode_ID: barcode, Quantity: quantity };
      if (barcode === "LC") {
        const { value: duration } = await Swal.fire({
          title: "Enter Duration",
          input: "number",
          inputLabel: "Duration in minutes",
          inputPlaceholder: "30",
          showCancelButton: true,
        });
        if (!duration || parseInt(duration) <= 0) {
          Swal.fire("Error", "Duration must be greater than 0.", "error");
          return;
        }

        const { value: materialCost } = await Swal.fire({
          title: "Enter Material Cost (Optional)",
          input: "number",
          inputLabel: "Material Cost in LKR",
          inputPlaceholder: "0",
          showCancelButton: true,
        });

        body.Duration = parseInt(duration);
        body.Material_Cost = materialCost ? parseFloat(materialCost) : 0;
      }

      const response = await axios.post(
        "http://192.168.1.6:5000/api/invoices/scan",
        body
      );
      const newItem: LineItem = {
        Item_Description: response.data.Item_Description,
        Quantity: Number(response.data.Quantity),
        Rate: Number(response.data.Rate),
        Line_Total: Number(response.data.Line_Total),
      };
      setItems([...items, newItem]);
      setBarcode("");
      setQuantity(1);
      Swal.fire("Success", "Item added to invoice!", "success");
    } catch (error: any) {
      Swal.fire(
        "Error",
        error.response?.data?.error || "Failed to process barcode.",
        "error"
      );
    }
  };

  // Handle delete item
  const handleDeleteItem = (index: number) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This item will be removed from the invoice.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        setItems(items.filter((_, i) => i !== index));
        Swal.fire(
          "Deleted",
          "Item has been removed from the invoice.",
          "success"
        );
      }
    });
  };

  // Calculate final total
  const finalTotal = items.reduce((sum, item) => sum + item.Line_Total, 0);

  // Handle save invoice
  const handleSaveInvoice = async () => {
    if (!documentType) {
      Swal.fire(
        "Error",
        "Please select a document type (Invoice or Quotation).",
        "error"
      );
      return;
    }
    if (!selectedCustomer) {
      Swal.fire("Error", "Please select a customer.", "error");
      return;
    }
    if (items.length === 0) {
      Swal.fire(
        "Error",
        "Please add at least one item to the invoice.",
        "error"
      );
      return;
    }

    try {
      const formattedItems = items.map((item) => ({
        Item_Description: item.Item_Description,
        Quantity: Number(item.Quantity),
        Rate: Number(item.Rate),
        Line_Total: Number(item.Line_Total),
      }));

      const response = await axios.post(
        "http://192.168.1.6:5000/api/invoices",
        {
          Document_Type: documentType,
          Customer_ID: selectedCustomer._id,
          Items: formattedItems,
          invoiceDateInput: invoiceDate || undefined,
        }
      );
      Swal.fire(
        "Success",
        `${documentType} saved with ID: ${response.data.Document_ID}!`,
        "success"
      );
      // Reset form
      setCustomerType("");
      setIdentifier("");
      setSelectedCustomer(null);
      setDocumentType("");
      setInvoiceDate("");
      setItems([]);
      setBarcode("");
      setQuantity(1);
    } catch (error: any) {
      Swal.fire(
        "Error",
        error.response?.data?.error || "Failed to save invoice.",
        "error"
      );
    }
  };

  // Handle print invoice
  const handlePrintInvoice = async () => {
  if (!selectedCustomer) {
    Swal.fire('Error', 'Please select a customer before printing.', 'error');
    return;
  }
  if (items.length === 0) {
    Swal.fire('Error', 'Please add at least one item to print the invoice.', 'error');
    return;
  }

  try {
    const formattedItems = items.map(item => ({
      Item_Description: item.Item_Description,
      Quantity: Number(item.Quantity),
      Rate: Number(item.Rate),
      Line_Total: Number(item.Line_Total),
    }));

    const currentDate = new Date('2025-06-02T17:04:00+0530'); // Current date and time
    const effectiveInvoiceDate = invoiceDate || currentDate.toISOString().split('T')[0];

    const invoiceData = {
      Document_Type: documentType || 'Invoice',
      Customer_Name: selectedCustomer.Full_Name,
      Address: selectedCustomer.Address || 'N/A',
      Items: formattedItems,
      Total_Amount: finalTotal,
      InvoiceDate: effectiveInvoiceDate,
      Customer_Mobile: selectedCustomer.Instore_Phone_Number || selectedCustomer.Phone_Number || 'N/A',
    };

    console.log('Sending invoiceData:', invoiceData);

    const response = await axios.post('http://192.168.1.6:5000/api/invoices/print', invoiceData, {
      responseType: 'blob',
    });

    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `invoice_${invoiceData.InvoiceDate}.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    Swal.fire('Success', 'Invoice PDF downloaded!', 'success');
  } catch (error: any) {
    Swal.fire('Error', error.response?.data?.error || 'Failed to print invoice.', 'error');
    console.error('Print error:', error);
  }
};


  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Invoice Management</h1>

      {/* Customer Selection */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Select Customer</h2>
        <div className="flex space-x-4 mb-4">
          <select
            value={customerType}
            onChange={(e) => setCustomerType(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="">Select Customer Type</option>
            <option value="In-store">In-store</option>
            <option value="Production">Production</option>
            <option value="Wedding Invitation Maker">
              Wedding Invitation Maker
            </option>
          </select>

          <input
            type="text"
            placeholder={
              customerType === "In-store"
                ? "Enter Phone Number"
                : "Enter Nickname"
            }
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="border p-2 rounded flex-1"
          />
          <button
            onClick={handleSearchCustomer}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Search
          </button>
        </div>
        {selectedCustomer && (
          <div className="border p-4 rounded bg-gray-100">
            <p>
              <strong>Customer:</strong> {selectedCustomer.Full_Name}
            </p>
            <p>
              <strong>Type:</strong> {selectedCustomer.Customer_Type}
            </p>
            {selectedCustomer.Phone_Number && (
              <p>
                <strong>Phone:</strong> {selectedCustomer.Phone_Number}
              </p>
            )}
            {selectedCustomer.Nickname && (
              <p>
                <strong>Nickname:</strong> {selectedCustomer.Nickname}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Document Type Selection */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Select Document Type</h2>
        <select
          value={documentType}
          onChange={(e) => setDocumentType(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">Select Document Type</option>
          <option value="Invoice">Invoice</option>
          <option value="Quotation">Quotation</option>
        </select>
      </div>

      {/* Invoice Date */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Invoice Date</h2>
        <input
          type="date"
          value={invoiceDate}
          onChange={(e) => setInvoiceDate(e.target.value)}
          className="border p-2 rounded"
        />
      </div>

      {/* Barcode Scanning */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Add Item via Barcode</h2>
        <div className="flex space-x-4 mb-4">
          <input
            type="text"
            placeholder="Scan Barcode"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            className="border p-2 rounded flex-1"
          />
          <input
            type="number"
            placeholder="Quantity"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            className="border p-2 rounded w-24"
            min="1"
          />
          <button
            onClick={handleScanBarcode}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Add Item
          </button>
        </div>
      </div>

      {/* Invoice Display Table */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Invoice Items</h2>
        {items.length === 0 ? (
          <p>No items added yet.</p>
        ) : (
          <table className="w-full border-collapse border">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-2 text-left">Item Description</th>
                <th className="border p-2 text-left">Quantity</th>
                <th className="border p-2 text-left">Rate (LKR)</th>
                <th className="border p-2 text-left">Line Total (LKR)</th>
                <th className="border p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index}>
                  <td className="border p-2">{item.Item_Description}</td>
                  <td className="border p-2">{item.Quantity}</td>
                  <td className="border p-2">{item.Rate}</td>
                  <td className="border p-2">{item.Line_Total}</td>
                  <td className="border p-2">
                    <button
                      onClick={() => handleDeleteItem(index)}
                      className="text-red-600 hover:text-red-900"
                      aria-label={`Delete item ${item.Item_Description}`}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              <tr className="font-bold">
                <td colSpan={4} className="border p-2 text-right">
                  Final Total:
                </td>
                <td className="border p-2">LKR {finalTotal}</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>

      {/* Save and Print Buttons */}
      <div className="flex space-x-4">
        <button
          onClick={handleSaveInvoice}
          className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600"
        >
          Save {documentType || "Document"}
        </button>
        <button
          onClick={handlePrintInvoice}
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
        >
          Print {documentType || "Document"}
        </button>
      </div>
    </div>
  );
};

export default InvoiceManagement;
