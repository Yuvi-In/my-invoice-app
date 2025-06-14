import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import CustomerManagement from './components/CustomerManagement';
import ProductManagement from './components/ProductManagement';
import InvoiceManagement from './components/InvoiceManagement';
import ErrorBoundary from './components/ErrorBoundary';

const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-blue-600 p-4 shadow-lg">
          <div className="max-w-7xl mx-auto flex space-x-8">
            <Link
              to="/"
              className="text-white hover:text-blue-200 px-3 py-2 rounded-md text-lg font-medium transition-colors duration-200"
              aria-label="Navigate to Home"
            >
              Home
            </Link>
            <Link
              to="/customers"
              className="text-white hover:text-blue-200 px-3 py-2 rounded-md text-lg font-medium transition-colors duration-200"
              aria-label="Navigate to Customer Management"
            >
              Customers
            </Link>
            <Link
              to="/products"
              className="text-white hover:text-blue-200 px-3 py-2 rounded-md text-lg font-medium transition-colors duration-200"
              aria-label="Navigate to Product Management"
            >
              Products
            </Link>

            <Link
              to="/invoices"
              className="text-white hover:text-blue-200 px-3 py-2 rounded-md text-lg font-medium transition-colors duration-200"
              aria-label="Navigate to Invoice Management"
            >
              Invoices
            </Link>
          </div>
        </nav>
        <ErrorBoundary>
          <Routes>
            <Route path="/customers" element={<CustomerManagement />} />
            <Route path="/products" element={<ProductManagement />} />
            <Route path="/invoices" element={<InvoiceManagement />} />
            {/* Default route */}
            <Route
              path="/"
              element={
                <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                  <div className="bg-white shadow-lg rounded-lg p-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-6">Welcome to Invoice App</h1>
                    <p className="text-gray-600 mb-4">Choose a section to manage:</p>
                    <div className="flex space-x-4">
                      <Link
                        to="/customers"
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        aria-label="Go to Customer Management"
                      >
                        Manage Customers
                      </Link>
                      <Link
                        to="/products"
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        aria-label="Go to Product Management"
                      >
                        Manage Products
                      </Link>
                      <Link
                        to="/invoices"
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        aria-label="Go to Invoice Management"
                      >
                        Manage Invoices
                      </Link>
                    </div>
                  </div>
                </div>
              }
            />
            {/* 404 fallback */}
            <Route
              path="*"
              element={
                <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                  <div className="bg-white shadow-lg rounded-lg p-6">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">404 - Page Not Found</h1>
                    <p className="text-gray-600 mb-4">Sorry, the page you are looking for does not exist.</p>
                    <Link to="/" className="text-blue-600 underline">Go Home</Link>
                  </div>
                </div>
              }
            />
          </Routes>
        </ErrorBoundary>
      </div>
    </Router>
  );
};

export default App;