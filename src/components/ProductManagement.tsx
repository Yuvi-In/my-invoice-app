import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { PDFDownloadLink } from '@react-pdf/renderer';
import JsBarcode from 'jsbarcode';
import BarcodePDF from './BarcodePDF';

interface Product {
  _id: string;
  Product_Category: 'Shoe Laser Cutting' | 'Wedding Invitations' | 'Laser Cutting';
  Product_ID: string;
  Customer_Nickname?: string;
  Material_Type?: 'Acrylic' | 'Leather' | 'Rexine' | 'Wood' | 'Paper';
  Unique_Code?: string;
  Product_Type?: 'Invitation Card' | 'Cake Box' | 'Tag';
  Sticker_Option?: 'With Sticker' | 'Without Sticker';
  Sticker_Type?: 'Normal' | 'Glitter';
  Sticker_Color?: 'Gold' | 'Silver' | 'Green' | 'Red' | 'Blue';
  Auto_Generated_ID?: string;
  Price?: number;
  Barcode_ID: string;
  Status: 'Active' | 'Inactive';
  Created_At: string;
  Updated_At: string;
}

interface FormData {
  Product_Category: 'Shoe Laser Cutting' | 'Wedding Invitations' | 'Laser Cutting';
  Customer_Nickname: string;
  Material_Type: 'Acrylic' | 'Leather' | 'Rexine' | 'Wood' | 'Paper' | '';
  Unique_Code: string;
  Product_Type: 'Invitation Card' | 'Cake Box' | 'Tag' | '';
  Sticker_Option: 'With Sticker' | 'Without Sticker' | '';
  Sticker_Type: 'Normal' | 'Glitter' | '';
  Sticker_Color: 'Gold' | 'Silver' | 'Green' | 'Red' | 'Blue' | '';
  Price: string;
  Status: 'Active' | 'Inactive';
}

const ProductManagement: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [formData, setFormData] = useState<FormData>({
    Product_Category: 'Shoe Laser Cutting',
    Customer_Nickname: '',
    Material_Type: '',
    Unique_Code: '',
    Product_Type: '',
    Sticker_Option: '',
    Sticker_Type: '',
    Sticker_Color: '',
    Price: '',
    Status: 'Active',
  });
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const barcodeRefs = useRef<{ [key: string]: HTMLCanvasElement }>({});

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    products.forEach((product) => {
      const canvas = barcodeRefs.current[product._id];
      if (canvas && product.Barcode_ID) {
        try {
          JsBarcode(canvas, product.Barcode_ID, {
            format: 'CODE128',
            displayValue: true,
            height: 50,
            width: 2,
          });
        } catch (error) {
          console.error(`Failed to render barcode for product ${product._id}:`, error);
        }
      }
    });
  }, [products]);

  useEffect(() => {
    if (formData.Product_Category === 'Shoe Laser Cutting' && formData.Customer_Nickname && formData.Material_Type) {
      suggestUniqueCode();
    }
  }, [formData.Customer_Nickname, formData.Material_Type, formData.Product_Category]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get<Product[]>('http://192.168.1.8:5000/api/products');
      setProducts(response.data);
    } catch (err) {
      console.error('Error fetching products:', err);
      toast.error('Failed to fetch products. Please check the backend server.');
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const checkProductIdAvailability = async (productId: string) => {
    if (!productId || productId.trim() === '') {
      return false;
    }
    try {
      const response = await axios.get<Product[]>('http://192.168.1.8:5000/api/products');
      return !response.data.some((p) => p.Product_ID === productId && p._id !== editingProductId);
    } catch (err) {
      toast.error('Failed to check product ID availability');
      return false;
    }
  };

  const suggestUniqueCode = async () => {
    if (formData.Product_Category !== 'Shoe Laser Cutting') return;
    try {
      const response = await axios.get<Product[]>('http://192.168.1.8:5000/api/products');
      setProducts(response.data);
      const prefix = `${formData.Customer_Nickname}-${formData.Material_Type}-`;
      const existingCodes = response.data
        .filter((p) => p.Product_ID.startsWith(prefix))
        .map((p) => parseInt(p.Unique_Code || '0', 10))
        .filter((code) => !isNaN(code));
      const nextCode = existingCodes.length ? Math.max(...existingCodes) + 1 : 1;
      setFormData((prev) => ({ ...prev, Unique_Code: String(nextCode).padStart(3, '0') }));
    } catch (err) {
      toast.error('Failed to generate unique code');
    }
  };

  const validateForm = async () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.Product_Category) {
      newErrors.Product_Category = 'Product category is required';
    }
    let productId = '';
    if (formData.Product_Category === 'Shoe Laser Cutting') {
      if (!formData.Customer_Nickname.trim()) {
        newErrors.Customer_Nickname = 'Customer nickname is required';
      }
      if (!formData.Material_Type) {
        newErrors.Material_Type = 'Material type is required';
      }
      if (!formData.Unique_Code.trim()) {
        newErrors.Unique_Code = 'Unique code is required';
      }
      if (!formData.Price || isNaN(Number(formData.Price)) || Number(formData.Price) <= 0) {
        newErrors.Price = 'Valid positive price is required';
      }
      productId = `${formData.Customer_Nickname}-${formData.Material_Type}-${formData.Unique_Code}`;
      if (!productId || productId.trim() === '') {
        newErrors.Unique_Code = 'Invalid product ID generated';
      } else {
        setIsChecking(true);
        const isAvailable = await checkProductIdAvailability(productId);
        setIsChecking(false);
        if (!isAvailable) {
          newErrors.Unique_Code = `Product ID ${productId} is already in use. Try a different unique code.`;
        }
      }
    } else if (formData.Product_Category === 'Wedding Invitations') {
      if (!formData.Product_Type) {
        newErrors.Product_Type = 'Product type is required';
      }
      if (!formData.Material_Type) {
        newErrors.Material_Type = 'Material type is required';
      }
      if (!formData.Sticker_Option) {
        newErrors.Sticker_Option = 'Sticker option is required';
      }
      if (formData.Sticker_Option === 'With Sticker') {
        if (!formData.Sticker_Type) {
          newErrors.Sticker_Type = 'Sticker type is required';
        }
        if (!formData.Sticker_Color) {
          newErrors.Sticker_Color = 'Sticker color is required';
        }
      }
      if (!formData.Price || isNaN(Number(formData.Price)) || Number(formData.Price) <= 0) {
        newErrors.Price = 'Valid positive price is required';
      }
      if (!editingProductId) {
        productId = `${formData.Product_Type}-${formData.Material_Type}-${formData.Sticker_Option === 'With Sticker' ? `Sticker-${formData.Sticker_Type}-${formData.Sticker_Color}` : 'NoSticker'}-TEMP`;
        if (!productId || productId.includes('undefined') || productId.includes('null')) {
          newErrors.Product_Type = 'Invalid product ID generated';
        } else {
          setIsChecking(true);
          const isAvailable = await checkProductIdAvailability(productId.replace('-TEMP', '-0001'));
          setIsChecking(false);
          if (!isAvailable) {
            newErrors.Product_Type = `A similar product ID already exists. Try a different product type or material.`;
          }
        }
      }
    } else if (formData.Product_Category === 'Laser Cutting') {
      productId = 'LASER-CUTTING-COMMON';
      setIsChecking(true);
      const isAvailable = await checkProductIdAvailability(productId);
      setIsChecking(false);
      if (!isAvailable) {
        newErrors.Product_Category = 'A Laser Cutting product already exists';
      }
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
    setSearchQuery(e.target.value.trim());
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const filteredProducts = products.filter((product) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    const nickname = product.Customer_Nickname?.toLowerCase() || '';
    const productType = product.Product_Type?.toLowerCase() || '';
    return nickname.includes(searchLower) || productType.includes(searchLower);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(await validateForm())) {
      toast.error('Please check the form for errors');
      return;
    }
    setIsLoading(true);
    await fetchProducts();
    const payload = {
      Product_Category: formData.Product_Category,
      Customer_Nickname: formData.Product_Category === 'Shoe Laser Cutting' ? formData.Customer_Nickname : undefined,
      Material_Type: ['Shoe Laser Cutting', 'Wedding Invitations'].includes(formData.Product_Category) ? formData.Material_Type : undefined,
      Unique_Code: formData.Product_Category === 'Shoe Laser Cutting' ? formData.Unique_Code : undefined,
      Product_Type: formData.Product_Category === 'Wedding Invitations' ? formData.Product_Type : undefined,
      Sticker_Option: formData.Product_Category === 'Wedding Invitations' ? formData.Sticker_Option : undefined,
      Sticker_Type: formData.Sticker_Option === 'With Sticker' ? formData.Sticker_Type : undefined,
      Sticker_Color: formData.Sticker_Option === 'With Sticker' ? formData.Sticker_Color : undefined,
      Price: ['Shoe Laser Cutting', 'Wedding Invitations'].includes(formData.Product_Category) ? Number(formData.Price) : undefined,
      Status: formData.Status,
    };
    try {
      if (editingProductId) {
        const response = await axios.put<Product>(`http://192.168.1.8:5000/api/products/${editingProductId}`, payload);
        setProducts(products.map((p) => (p._id === editingProductId ? response.data : p)));
        toast.success('Product updated successfully');
      } else {
        const response = await axios.post<Product>('http://192.168.1.8:5000/api/products', payload);
        setProducts([...products, response.data]);
        toast.success('Product created successfully');
      }
      resetForm();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Something went wrong, please try again';
      if (errorMsg.includes('product ID')) {
        if (formData.Product_Category === 'Shoe Laser Cutting') {
          setErrors((prev) => ({
            ...prev,
            Unique_Code: `Product ID is already in use. Try a different unique code (e.g., ${parseInt(formData.Unique_Code || '0', 10) + 1}).`,
          }));
        } else if (formData.Product_Category === 'Wedding Invitations') {
          setErrors((prev) => ({
            ...prev,
            Product_Type: 'Product ID is already in use. Try a different product type or material.',
          }));
        } else {
          setErrors((prev) => ({
            ...prev,
            Product_Category: 'A Laser Cutting product already exists.',
          }));
        }
      } else if (errorMsg.includes('Barcode_ID')) {
        setErrors((prev) => ({
          ...prev,
          Product_Category: 'Barcode ID conflict occurred. Please try again.',
        }));
      }
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async (id: string) => {
    try {
      const response = await axios.get<Product>(`http://192.168.1.8:5000/api/products/${id}`);
      setFormData({
        Product_Category: response.data.Product_Category,
        Customer_Nickname: response.data.Customer_Nickname || '',
        Material_Type: response.data.Material_Type || '',
        Unique_Code: response.data.Unique_Code || '',
        Product_Type: response.data.Product_Type || '',
        Sticker_Option: response.data.Sticker_Option || '',
        Sticker_Type: response.data.Sticker_Type || '',
        Sticker_Color: response.data.Sticker_Color || '',
        Price: response.data.Price ? String(response.data.Price) : '',
        Status: response.data.Status,
      });
      setEditingProductId(id);
    } catch (err) {
      toast.error('Failed to fetch product details');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    setIsLoading(true);
    try {
      await axios.delete(`http://192.168.1.8:5000/api/products/${id}`);
      setProducts(products.filter((p) => p._id !== id));
      toast.success('Product deleted successfully');
    } catch (err: any) {
      toast.error('Something went wrong, please try again');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      Product_Category: 'Shoe Laser Cutting',
      Customer_Nickname: '',
      Material_Type: '',
      Unique_Code: '',
      Product_Type: '',
      Sticker_Option: '',
      Sticker_Type: '',
      Sticker_Color: '',
      Price: '',
      Status: 'Active',
    });
    setEditingProductId(null);
    setErrors({});
  };

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Product Management</h1>

      <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          {editingProductId ? 'Edit Product' : 'Add Product'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="Product_Category" className="block text-sm font-medium text-gray-700">
                Product Category <span className="text-red-500">*</span>
              </label>
              <select
                id="Product_Category"
                name="Product_Category"
                value={formData.Product_Category}
                onChange={handleChange}
                className="mt-1 w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                aria-label="Product Category"
                aria-describedby={errors.Product_Category ? 'Product_Category-error' : undefined}
                disabled={isChecking}
              >
                <option value="Shoe Laser Cutting">Shoe Laser Cutting</option>
                <option value="Wedding Invitations">Wedding Invitations</option>
                <option value="Laser Cutting">Laser Cutting</option>
              </select>
              {errors.Product_Category && (
                <p id="Product_Category-error" className="mt-1 text-sm text-red-600">
                  {errors.Product_Category}
                </p>
              )}
            </div>
            {formData.Product_Category === 'Shoe Laser Cutting' && (
              <div>
                <label htmlFor="Customer_Nickname" className="block text-sm font-medium text-gray-700">
                  Customer Nickname <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="Customer_Nickname"
                  name="Customer_Nickname"
                  value={formData.Customer_Nickname}
                  onChange={handleChange}
                  className="mt-1 w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                  aria-label="Customer Nickname"
                  aria-describedby={errors.Customer_Nickname ? 'Customer_Nickname-error' : undefined}
                  disabled={isChecking}
                />
                {errors.Customer_Nickname && (
                  <p id="Customer_Nickname-error" className="mt-1 text-sm text-red-600">
                    {errors.Customer_Nickname}
                  </p>
                )}
              </div>
            )}
          </div>
          {['Shoe Laser Cutting', 'Wedding Invitations'].includes(formData.Product_Category) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="Material_Type" className="block text-sm font-medium text-gray-700">
                  Material Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="Material_Type"
                  name="Material_Type"
                  value={formData.Material_Type}
                  onChange={handleChange}
                  className="mt-1 w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                  aria-label="Material Type"
                  aria-describedby={errors.Material_Type ? 'Material_Type-error' : undefined}
                  disabled={isChecking}
                >
                  <option value="">Select Material</option>
                  {formData.Product_Category === 'Shoe Laser Cutting' ? (
                    <>
                      <option value="Acrylic">Acrylic</option>
                      <option value="Leather">Leather</option>
                      <option value="Rexine">Rexine</option>
                    </>
                  ) : (
                    <>
                      <option value="Wood">Wood</option>
                      <option value="Acrylic">Acrylic</option>
                      <option value="Paper">Paper</option>
                    </>
                  )}
                </select>
                {errors.Material_Type && (
                  <p id="Material_Type-error" className="mt-1 text-sm text-red-600">
                    {errors.Material_Type}
                  </p>
                )}
              </div>
              {formData.Product_Category === 'Shoe Laser Cutting' && (
                <div>
                  <label htmlFor="Unique_Code" className="block text-sm font-medium text-gray-700">
                    Unique Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="Unique_Code"
                    name="Unique_Code"
                    value={formData.Unique_Code}
                    onChange={handleChange}
                    className="mt-1 w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                    aria-label="Unique Code"
                    aria-describedby={errors.Unique_Code ? 'Unique_Code-error' : undefined}
                    disabled={isChecking}
                />
                {errors.Unique_Code && (
                  <p id="Unique_Code-error" className="mt-1 text-sm text-red-600">
                    {errors.Unique_Code}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
        {formData.Product_Category === 'Wedding Invitations' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="Product_Type" className="block text-sm font-medium text-gray-700">
                Product Type <span className="text-red-500">*</span>
              </label>
              <select
                id="Product_Type"
                name="Product_Type"
                value={formData.Product_Type}
                onChange={handleChange}
                className="mt-1 w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                aria-label="Product Type"
                aria-describedby={errors.Product_Type ? 'Product_Type-error' : undefined}
                disabled={isChecking}
              >
                <option value="">Select Product Type</option>
                <option value="Invitation Card">Invitation Card</option>
                <option value="Cake Box">Cake Box</option>
                <option value="Tag">Tag</option>
              </select>
              {errors.Product_Type && (
                <p id="Product_Type-error" className="mt-1 text-sm text-red-600">
                  {errors.Product_Type}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="Sticker_Option" className="block text-sm font-medium text-gray-700">
                Sticker Option <span className="text-red-500">*</span>
              </label>
              <select
                id="Sticker_Option"
                name="Sticker_Option"
                value={formData.Sticker_Option}
                onChange={handleChange}
                className="mt-1 w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                aria-label="Sticker Option"
                aria-describedby={errors.Sticker_Option ? 'Sticker_Option-error' : undefined}
                disabled={isChecking}
              >
                <option value="">Select Sticker Option</option>
                <option value="With Sticker">With Sticker</option>
                <option value="Without Sticker">Without Sticker</option>
              </select>
              {errors.Sticker_Option && (
                <p id="Sticker_Option-error" className="mt-1 text-sm text-red-600">
                  {errors.Sticker_Option}
                </p>
              )}
            </div>
          </div>
        )}
        {formData.Sticker_Option === 'With Sticker' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="Sticker_Type" className="block text-sm font-medium text-gray-700">
                Sticker Type <span className="text-red-500">*</span>
              </label>
              <select
                id="Sticker_Type"
                name="Sticker_Type"
                value={formData.Sticker_Type}
                onChange={handleChange}
                className="mt-1 w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                aria-label="Sticker Type"
                aria-describedby={errors.Sticker_Type ? 'Sticker_Type-error' : undefined}
                disabled={isChecking}
              >
                <option value="">Select Sticker Type</option>
                <option value="Normal">Normal</option>
                <option value="Glitter">Glitter</option>
              </select>
              {errors.Sticker_Type && (
                <p id="Sticker_Type-error" className="mt-1 text-sm text-red-600">
                  {errors.Sticker_Type}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="Sticker_Color" className="block text-sm font-medium text-gray-700">
                Sticker Color <span className="text-red-500">*</span>
              </label>
              <select
                id="Sticker_Color"
                name="Sticker_Color"
                value={formData.Sticker_Color}
                onChange={handleChange}
                className="mt-1 w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                aria-label="Sticker Color"
                aria-describedby={errors.Sticker_Color ? 'Sticker_Color-error' : undefined}
                disabled={isChecking}
              >
                <option value="">Select Sticker Color</option>
                <option value="Gold">Gold</option>
                <option value="Silver">Silver</option>
                <option value="Green">Green</option>
                <option value="Red">Red</option>
                <option value="Blue">Blue</option>
              </select>
              {errors.Sticker_Color && (
                <p id="Sticker_Color-error" className="mt-1 text-sm text-red-600">
                  {errors.Sticker_Color}
                </p>
              )}
            </div>
          </div>
        )}
        {['Shoe Laser Cutting', 'Wedding Invitations'].includes(formData.Product_Category) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="Price" className="block text-sm font-medium text-gray-700">
                Price (LKR) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="Price"
                name="Price"
                value={formData.Price}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="mt-1 w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                aria-label="Price"
                aria-describedby={errors.Price ? 'Price-error' : undefined}
                disabled={isChecking}
              />
              {errors.Price && (
                <p id="Price-error" className="mt-1 text-sm text-red-600">{errors.Price}</p>
              )}
            </div>
            <div>
              <label htmlFor="Status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="Status"
                name="Status"
                value={formData.Status}
                onChange={handleChange}
                className="mt-1 w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                aria-label="Status"
                disabled={isChecking}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        )}
        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={isLoading || isChecking}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300 disabled:cursor-not-allowed"
            aria-label={editingProductId ? 'Update Product' : 'Create Product'}
          >
            {isChecking ? 'Checking...' : isLoading ? 'Saving...' : editingProductId ? 'Update Product' : 'Create Product'}
          </button>
          <button
            type="button"
            onClick={resetForm}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            aria-label="Cancel"
            disabled={isChecking}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>

    <div className="bg-white shadow-lg rounded-lg p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Product List</h2>
      <div className="mb-4 flex items-center space-x-4">
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search by customer nickname or product type"
          className="w-full max-w-md p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          aria-label="Search products"
        />
        {searchQuery && (
          <button
            onClick={clearSearch}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            aria-label="Clear search"
          >
            Clear
          </button>
        )}
      </div>
      {isLoading ? (
        <p className="text-gray-600">Loading products...</p>
      ) : filteredProducts.length === 0 ? (
        <p className="text-gray-600">No products found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer Nickname
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Material Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price (LKR)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Barcode
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
              {filteredProducts.map((product) => (
                <tr key={product._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.Product_ID}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.Product_Category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.Customer_Nickname || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.Product_Type || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.Material_Type || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.Price || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <canvas
                      ref={(el) => {
                        if (el) barcodeRefs.current[product._id] = el;
                      }}
                      className="h-12"
                      aria-label={`Barcode for ${product.Product_ID}`}
                    />
                    <PDFDownloadLink
                      document={<BarcodePDF barcode={product.Barcode_ID} productId={product.Product_ID} />}
                      fileName={`${product.Product_ID}_barcode.pdf`}
                      className="text-blue-600 hover:text-blue-900 ml-2"
                    >
                      {({ loading }) => (loading ? 'Generating PDF...' : 'Print Barcode')}
                    </PDFDownloadLink>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.Status}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {product.Product_Category !== 'Laser Cutting' && (
                      <button
                        onClick={() => handleEdit(product._id)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                        aria-label={`Edit ${product.Product_ID}`}
                      >
                        Edit
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(product._id)}
                      className="text-red-600 hover:text-red-900"
                      aria-label={`Delete ${product.Product_ID}`}
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

export default ProductManagement;