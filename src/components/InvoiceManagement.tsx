import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";


const BASE_URL = "http://192.168.1.6:5000/api";
interface Customer {
  _id: string;
  Customer_Type: string;
  Full_Name?: string;
  Address?: string;
  Phone_Number?: string;
  Nickname?: string;
  Instore_Phone_Number?: string;
  Tax_ID?: string; // FIX: Use correct casing and string type
}

interface LineItem {
  Item_Description: string;
  Quantity: number;
  Rate: number;
  Line_Total: number;
}

interface Invoice {
  _id: string;
  Document_ID: string;
  Customer_ID: Customer;
  Total_Amount: number;
  Payment_Status?: string;
  Advance_Payment?: number;
}

const InvoiceManagement: React.FC = () => {
  // State for customer selection
  const [customerType, setCustomerType] = useState<string>("");
  const [identifier, setIdentifier] = useState<string>("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // State for invoice details
  const [documentType, setDocumentType] = useState<string>("");
  const [invoiceDate, setInvoiceDate] = useState<string>("");
  const [purchasingOrder, setPurchasingOrder] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("Cash");
  const [discountPrice, setDiscountPrice] = useState<number>(0);
  const [advancePayment, setAdvancePayment] = useState<number>(0);

  // State for items and total
  const [items, setItems] = useState<LineItem[]>([]);
  const [barcode, setBarcode] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);

  // State for search and update
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

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
        `${BASE_URL}/customers/search`,
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
    if (quantity < 1) {
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
        `${BASE_URL}/invoices/scan`,
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

      // Calculate final total with discount
      const finalTotal = items.reduce((sum, item) => sum + item.Line_Total, 0);
      const netTotal = finalTotal - (finalTotal * (discountPrice / 100)) - advancePayment;

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
        // FIX: Prevent negative discount/advance
        if (discountPrice < 0) {
          Swal.fire("Error", "Discount cannot be negative.", "error");
          return;
        }
        if (advancePayment < 0) {
          Swal.fire("Error", "Advance payment cannot be negative.", "error");
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
        `${BASE_URL}/invoices`,
        {
          Document_Type: documentType,
          Customer_ID: selectedCustomer._id,
          Items: formattedItems,
          invoiceDateInput: invoiceDate || undefined,
          Purchasing_Order: purchasingOrder || undefined,
          Payment_Method: paymentMethod,
          Discount_Price: discountPrice,
          Advance_Payment: advancePayment,
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
      setPurchasingOrder("");
      setPaymentMethod("Cash");
      setDiscountPrice(0);
      setAdvancePayment(0);
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
      Swal.fire("Error", "Please select a customer before printing.", "error");
      return;
        }
        if (items.length === 0) {
      Swal.fire("Error", "Please add at least one item to print the invoice.", "error");
      return;
        }
        // FIX: Prevent negative discount/advance
        if (discountPrice < 0) {
          Swal.fire("Error", "Discount cannot be negative.", "error");
          return;
        }
        if (advancePayment < 0) {
          Swal.fire("Error", "Advance payment cannot be negative.", "error");
          return;
        }

        try {
      const formattedItems = items.map((item) => ({
        Item_Description: item.Item_Description,
        Quantity: Number(item.Quantity),
        Rate: Number(item.Rate),
        Line_Total: Number(item.Line_Total),
      }));

      const currentDate = new Date(); // FIX: Use current date/time
      const effectiveInvoiceDate = invoiceDate || currentDate.toISOString().split("T")[0];

      const invoiceData = {
        Document_Type: documentType || "Invoice",
        Customer_Name: selectedCustomer.Full_Name,
        Address: selectedCustomer.Address || "N/A",
        TAX_ID: selectedCustomer.Tax_ID || "N/A",
        Items: formattedItems,
        Total_Amount: finalTotal,
        InvoiceDate: effectiveInvoiceDate,
        Customer_Mobile: selectedCustomer.Instore_Phone_Number || selectedCustomer.Phone_Number || "N/A",
        Customer_Type: selectedCustomer.Customer_Type,
        Purchasing_Order: purchasingOrder || undefined,
        Payment_Method: paymentMethod,
        Discount_Price: discountPrice,
        Advance_Payment: advancePayment,
      };

      console.log("Sending invoiceData:", invoiceData);

      const response = await axios.post(`${BASE_URL}/invoices/print`, invoiceData, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `invoice_${effectiveInvoiceDate}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      Swal.fire("Success", "Invoice PDF downloaded!", "success");
        } catch (error: any) {
      Swal.fire("Error", error.response?.data?.error || "Failed to print invoice.", "error");
      console.error("Print error:", error);
        }
      };

      // Handle invoice search
      const handleSearchInvoice = async () => {
        try {
      const response = await axios.get(`${BASE_URL}/invoices/search`, {
        params: { nickname: searchTerm, phone: searchTerm },
      });
      setInvoices(response.data);
      Swal.fire("Success", "Invoices found!", "success");
        } catch (error: any) {
      Swal.fire("Error", error.response?.data?.error || "Failed to search invoices.", "error");
        }
      };

      // Handle update invoice
      const handleUpdateInvoice = async () => {
        if (!selectedInvoice) {
      Swal.fire("Error", "Please select an invoice to update.", "error");
      return;
        }

        try {
      await axios.put(`${BASE_URL}/invoices/${selectedInvoice._id}`, {
        Payment_Status: selectedInvoice.Payment_Status || "Unpaid",
        Advance_Payment: selectedInvoice.Advance_Payment || 0,
      });
      Swal.fire("Success", "Invoice updated successfully!", "success");
      // Refresh invoices
      const response = await axios.get(`${BASE_URL}/invoices`);
      setInvoices(response.data);
      setSelectedInvoice(null);
        } catch (error: any) {
      Swal.fire("Error", error.response?.data?.error || "Failed to update invoice.", "error");
        }
      };

      // Fetch invoices on mount
      useEffect(() => {
        const fetchInvoices = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/invoices`);
        setInvoices(response.data);
      } catch (error: any) {
        Swal.fire("Error", "Failed to load invoices.", "error");
      }
        };
        fetchInvoices();
      }, []);

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
            <option value="Wedding Invitation Maker">Wedding Invitation Maker</option>
          </select>
          <input
            type="text"
            placeholder={
              customerType === "In-store" ? "Enter Phone Number" : "Enter Nickname"
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
            {selectedCustomer.Address && (
              <p>
                <strong>Address:</strong> {selectedCustomer.Address}
              </p>
            )}
            {selectedCustomer.Tax_ID && (
              <p>
                <strong>TAX ID:</strong> {selectedCustomer.Tax_ID}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Invoice Details */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Invoice Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="">Select Document Type</option>
            <option value="Invoice">Invoice</option>
            <option value="Quotation">Quotation</option>
          </select>
          <input
            type="date"
            value={invoiceDate}
            onChange={(e) => setInvoiceDate(e.target.value)}
            className="border p-2 rounded"
          />
          <input
            type="text"
            placeholder="Purchasing Order (Optional)"
            value={purchasingOrder}
            onChange={(e) => setPurchasingOrder(e.target.value)}
            className="border p-2 rounded"
          />
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="Cash">Cash</option>
            <option value="Cheque">Cheque</option>
            <option value="Online Transfer">Online Transfer</option>
            <option value="Credit Card">Credit Card</option>
          </select>
          <h2 className="text-xl font-semibold mb-2">Discount Price (%)</h2>
          <input
            type="number"
            placeholder="Discount Price (%)"
            value={discountPrice}
            onChange={(e) => setDiscountPrice(Number(e.target.value) || 0)}
            min="0"
            className="border p-2 rounded"
          />
          <h2 className="text-xl font-semibold mb-2">Advance Payment</h2>
          <input
            type="number"
            placeholder="Advance Payment (LKR)"
            value={advancePayment}
            onChange={(e) => setAdvancePayment(Number(e.target.value) || 0)}
            min="0"
            className="border p-2 rounded"
          />
        </div>
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
                <td colSpan={3} className="border p-2 text-right">
                  Final Total:
                </td>
                <td className="border p-2">LKR {finalTotal.toFixed(2)}</td>
                <td></td>
              </tr>
              <tr className="font-bold">
                <td colSpan={3} className="border p-2 text-right">
                  Discount ({discountPrice}%):
                </td>
                <td className="border p-2">LKR {(finalTotal * (discountPrice / 100)).toFixed(2)}</td>
                <td></td>
              </tr>
              <tr className="font-bold">
                <td colSpan={3} className="border p-2 text-right">
                  Advance Payment:
                </td>
                <td className="border p-2">LKR {advancePayment.toFixed(2)}</td>
                <td></td>
              </tr>
              <tr className="font-bold">
                <td colSpan={3} className="border p-2 text-right">
                  Net Total:
                </td>
                <td className="border p-2">LKR {netTotal.toFixed(2)}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        )}
      </div>

      {/* Save and Print Buttons */}
      <div className="flex space-x-4 mb-6">
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

      {/* Invoice Search */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Search Invoices</h2>
        <div className="flex space-x-4 mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Enter Nickname or Phone"
            className="border p-2 rounded flex-1"
          />
          <button
            onClick={handleSearchInvoice}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Search
          </button>
        </div>
        {invoices.length > 0 && (
          <ul className="space-y-2">
            {invoices.map((invoice) => (
              <li
                key={invoice._id}
                className="p-2 border border-gray-200 rounded-md cursor-pointer"
                onClick={() => setSelectedInvoice(invoice)}
                style={{ backgroundColor: selectedInvoice?._id === invoice._id ? "#e0f7fa" : "white" }}
              >
                {invoice.Document_ID} - {invoice.Customer_ID.Full_Name} (Total: {invoice.Total_Amount} LKR)
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Invoice Update */}
      {selectedInvoice && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Update Invoice</h2>
          <div className="grid grid-cols-2 gap-4">
            <select
              value={selectedInvoice.Payment_Status || "Unpaid"}
              onChange={(e) =>
                setSelectedInvoice((prev) => (prev ? { ...prev, Payment_Status: e.target.value } : prev))
              }
              className="border p-2 rounded"
            >
              <option value="Unpaid">Unpaid</option>
              <option value="Paid">Paid</option>
              <option value="Partially Paid">Partially Paid</option>
            </select>
            <input
              type="number"
              placeholder="Advance Payment (LKR)"
              value={selectedInvoice.Advance_Payment || 0}
              onChange={(e) =>
                setSelectedInvoice((prev) => (prev ? { ...prev, Advance_Payment: Number(e.target.value) || 0 } : prev))
              }
              min="0"
              className="border p-2 rounded"
            />
          </div>
          <button
            onClick={handleUpdateInvoice}
            className="mt-4 bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600"
          >
            Update Invoice
          </button>
          <button
            onClick={() => setSelectedInvoice(null)}
            className="ml-4 mt-4 bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default InvoiceManagement;