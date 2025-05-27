const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const validator = require('validator');
const app = express();

// Middleware
app.use(cors({ origin: ['http://localhost:5173', 'http://192.168.1.5:5173'] }));
app.use(express.json());

// MongoDB connection
mongoose.connect('mongodb+srv://induwarayuvindu:Yuvindu2E2003@cluster0.u32dvwl.mongodb.net/invoiceApp?retryWrites=true&w=majority')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Schemas
const customerSchema = new mongoose.Schema({
  Customer_Type: {
    type: String,
    enum: ['Production', 'In-store', 'Wedding Invitation Maker'],
    required: [true, 'Please select a customer type (Production, In-store, or Wedding Invitation Maker)'],
  },
  Full_Name: {
    type: String,
    required: [true, 'Full name is required'],
  },
  Contact_Person: { type: String },
  Email: {
    type: String,
    validate: {
      validator: (value) => !value || validator.isEmail(value),
      message: 'Please enter a valid email address',
    },
  },
  Phone_Number: {
    type: String,
    required: [function () {
      return this.Customer_Type === 'In-store';
    }, 'Phone number is required for In-store customers'],
    validate: {
      validator: function (value) {
        return !value || /^\d{9,10}$/.test(value);
      },
      message: 'Phone number must be 9 or 10 digits',
    },
  },
  Address: { type: String },
  Tax_ID: {
    type: String,
    validate: {
      validator: function (value) {
        return !value || /^\d{9}$|^\d{9}-7000$/.test(value);
      },
      message: 'Tax ID must be 9 digits or 9 digits followed by -7000',
    },
  },
  Job_Type: {
    type: String,
    enum: ['Wedding Invitations', 'Shoe Laser Cutting', 'Laser Cutting'],
    required: [true, 'Please select a job type (Wedding Invitations, Shoe Laser Cutting, or Laser Cutting)'],
  },
  Status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active',
  },
  Created_At: { type: Date, default: Date.now },
  Updated_At: { type: Date, default: Date.now },
});

const productionCustomerSchema = new mongoose.Schema({
  _id: { type: String, required: [true, 'Nickname is required for Production customers'] },
  Customer_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: [true, 'Customer ID is required'] },
});

const weddingCustomerSchema = new mongoose.Schema({
  _id: { type: String, required: [true, 'Nickname is required for Wedding Invitation Maker customers'] },
  Customer_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: [true, 'Customer ID is required'] },
});

const instoreCustomerSchema = new mongoose.Schema({
  _id: { type: String, required: [true, 'Phone number is required for In-store customers'] },
  Customer_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: [true, 'Customer ID is required'] },
});

// Product Schema
const productSchema = new mongoose.Schema({
  Product_Category: {
    type: String,
    enum: ['Shoe Laser Cutting', 'Wedding Invitations', 'Laser Cutting'],
    required: [true, 'Please select a product category (Shoe Laser Cutting, Wedding Invitations, or Laser Cutting)'],
  },
  Product_ID: {
    type: String,
    required: [true, 'Product ID is required'],
    unique: [true, 'This Product ID is already in use'],
    validate: {
      validator: function (value) {
        return value && value.trim().length > 0;
      },
      message: 'Product ID cannot be empty',
    },
  },
  Customer_Nickname: {
    type: String,
    required: [function () {
      return this.Product_Category === 'Shoe Laser Cutting';
    }, 'Customer nickname is required for Shoe Laser Cutting products'],
  },
  Material_Type: {
    type: String,
    enum: ['Acrylic', 'Leather', 'Rexine', 'Wood', 'Paper', null],
    required: [function () {
      return ['Shoe Laser Cutting', 'Wedding Invitations'].includes(this.Product_Category);
    }, 'Material type is required for Shoe Laser Cutting and Wedding Invitations products'],
  },
  Unique_Code: {
    type: String,
    required: [function () {
      return this.Product_Category === 'Shoe Laser Cutting';
    }, 'Unique code is required for Shoe Laser Cutting products'],
  },
  Product_Type: {
    type: String,
    enum: ['Invitation Card', 'Cake Box', 'Tag', null],
    required: [function () {
      return this.Product_Category === 'Wedding Invitations';
    }, 'Product type is required for Wedding Invitations products'],
  },
  Sticker_Option: {
    type: String,
    enum: ['With Sticker', 'Without Sticker', null],
    required: [function () {
      return this.Product_Category === 'Wedding Invitations';
    }, 'Sticker option is required for Wedding Invitations products'],
  },
  Sticker_Type: {
    type: String,
    enum: ['Normal', 'Glitter', null],
    required: [function () {
      return this.Sticker_Option === 'With Sticker';
    }, 'Sticker type is required when With Sticker is selected'],
  },
  Sticker_Color: {
    type: String,
    enum: ['Gold', 'Silver', 'Green', 'Red', 'Blue', null],
    required: [function () {
      return this.Sticker_Option === 'With Sticker';
    }, 'Sticker color is required when With Sticker is selected'],
  },
  Auto_Generated_ID: {
    type: String,
    required: [function () {
      return this.Product_Category === 'Wedding Invitations';
    }, 'Auto-generated ID is required for Wedding Invitations products'],
  },
  Price: {
    type: Number,
    required: [function () {
      return ['Shoe Laser Cutting', 'Wedding Invitations'].includes(this.Product_Category);
    }, 'Price is required for Shoe Laser Cutting and Wedding Invitations products'],
    min: [0, 'Price cannot be negative'],
  },
  Barcode_ID: {
    type: String,
    required: [true, 'Barcode ID is required'],
    unique: [true, 'This Barcode ID is already in use'],
  },
  Status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active',
  },
  Created_At: { type: Date, default: Date.now },
  Updated_At: { type: Date, default: Date.now },
});

// Invoice/Quotation Schema
const lineItemSchema = new mongoose.Schema({
  Item_Description: { type: String, required: [true, 'Item description is required'] },
  Quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1'],
  },
  Rate: {
    type: Number,
    required: [true, 'Rate is required'],
    min: [0, 'Rate cannot be negative'],
  },
  Line_Total: {
    type: Number,
    required: [true, 'Line total is required'],
    min: [0, 'Line total cannot be negative'],
  },
});

const invoiceSchema = new mongoose.Schema({
  Document_Type: {
    type: String,
    enum: ['Invoice', 'Quotation'],
    required: [true, 'Document type (Invoice or Quotation) is required'],
  },
  Document_ID: {
    type: String,
    required: [true, 'Document ID is required'],
    unique: [true, 'This Document ID is already in use'],
  },
  Customer_ID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: [true, 'Customer is required for the invoice/quotation'],
  },
  Date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now,
  },
  Items: [lineItemSchema],
  Total_Amount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount cannot be negative'],
  },
  Created_At: { type: Date, default: Date.now },
  Updated_At: { type: Date, default: Date.now },
});

// Function to generate a unique Barcode_ID
const generateUniqueBarcodeID = async (model, productCategory) => {
  if (productCategory === 'Laser Cutting') {
    return 'LC';
  }

  const categoryPrefix = {
    'Shoe Laser Cutting': 'SLC',
    'Wedding Invitations': 'WI',
    'Laser Cutting': 'LC',
  }[productCategory] || 'UNKNOWN';

  const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const barcodeID = `ORGA-${categoryPrefix}-${randomNum}`;

  const existing = await model.findOne({ Barcode_ID: barcodeID });
  if (existing) {
    return generateUniqueBarcodeID(model, productCategory); // Recursive retry
  }
  return barcodeID;
};

// Function to generate Document_ID
const generateDocumentID = async (documentType, date) => {
  const prefix = documentType === 'Invoice' ? 'OLCI' : 'OLCQ';
  const formattedDate = date.toISOString().split('T')[0]; // YYYY-MM-DD
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const count = await Invoice.countDocuments({
    Document_Type: documentType,
    Date: { $gte: startOfDay, $lte: endOfDay },
  });

  const id = String(count + 1).padStart(2, '0'); // Increment and pad to 2 digits
  return `${prefix}_${formattedDate}_${id}`;
};

// Pre-save hook to ensure Barcode_ID is unique and valid
productSchema.pre('save', async function (next) {
  if (!this.Barcode_ID || this.Barcode_ID.trim() === '') {
    this.Barcode_ID = await generateUniqueBarcodeID(this.constructor, this.Product_Category);
  }
  if (!this.Barcode_ID || this.Barcode_ID.trim() === '') {
    return next(new Error('Failed to generate a valid Barcode ID. Please try again.'));
  }
  const existing = await this.constructor.findOne({ Barcode_ID: this.Barcode_ID });
  if (existing && existing._id.toString() !== this._id) {
    return next(new Error(`The Barcode ID ${this.Barcode_ID} is already in use. Please try again.`));
  }
  next();
});

// Pre-update hook to ensure Barcode_ID remains valid
productSchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate();
  if (update.Barcode_ID && update.Barcode_ID.trim() === '') {
    return next(new Error('Barcode ID cannot be empty. Please provide a valid value.'));
  }
  const existing = await this.model.findOne({ Barcode_ID: update.Barcode_ID, _id: { $ne: this.getQuery()._id } });
  if (existing) {
    return next(new Error(`The Barcode ID ${update.Barcode_ID} is already in use. Please try again.`));
  }
  this.set({ Updated_At: new Date() });
  next();
});

// Pre-save hook for Invoice to calculate Total_Amount


const Customer = mongoose.model('Customer', customerSchema);
const ProductionCustomer = mongoose.model('ProductionCustomer', productionCustomerSchema);
const WeddingCustomer = mongoose.model('WeddingCustomer', weddingCustomerSchema);
const InstoreCustomer = mongoose.model('InstoreCustomer', instoreCustomerSchema);
const Product = mongoose.model('Product', productSchema);
const Invoice = mongoose.model('Invoice', invoiceSchema);

// Middleware to update Updated_At
customerSchema.pre('findOneAndUpdate', function (next) {
  this.set({ Updated_At: new Date() });
  next();
});

// Customer Routes
app.get('/api/customers', async (req, res) => {
  try {
    const customers = await Customer.find();
    const enrichedCustomers = await Promise.all(customers.map(async (customer) => {
      let additionalData = {};
      if (customer.Customer_Type === 'Production') {
        const prodCustomer = await ProductionCustomer.findOne({ Customer_ID: customer._id });
        additionalData = { Nickname: prodCustomer?._id };
      } else if (customer.Customer_Type === 'Wedding Invitation Maker') {
        const weddingCustomer = await WeddingCustomer.findOne({ Customer_ID: customer._id });
        additionalData = { Nickname: weddingCustomer?._id };
      } else if (customer.Customer_Type === 'In-store') {
        const instoreCustomer = await InstoreCustomer.findOne({ Customer_ID: customer._id });
        additionalData = { Instore_Phone_Number: instoreCustomer?._id };
      }
      return { ...customer.toObject(), ...additionalData };
    }));
    res.json(enrichedCustomers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'An error occurred while fetching customers. Please try again later.' });
  }
});

app.get('/api/customers/:id', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found. Please check the ID and try again.' });
    }
    let additionalData = {};
    if (customer.Customer_Type === 'Production') {
      const prodCustomer = await ProductionCustomer.findOne({ Customer_ID: customer._id });
      additionalData = { Nickname: prodCustomer?._id };
    } else if (customer.Customer_Type === 'Wedding Invitation Maker') {
      const weddingCustomer = await WeddingCustomer.findOne({ Customer_ID: customer._id });
      additionalData = { Nickname: weddingCustomer?._id };
    } else if (customer.Customer_Type === 'In-store') {
      const instoreCustomer = await InstoreCustomer.findOne({ Customer_ID: customer._id });
      additionalData = { Instore_Phone_Number: instoreCustomer?._id };
    }
    res.json({ ...customer.toObject(), ...additionalData });
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ error: 'An error occurred while fetching the customer. Please try again later.' });
  }
});

app.post('/api/customers', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { Customer_Type, Full_Name, Contact_Person, Email, Phone_Number, Address, Tax_ID, Job_Type, Status, Nickname } = req.body;

    if (!Customer_Type || !Full_Name || !Job_Type) {
      throw new Error('Customer type, full name, and job type are required. Please fill in all mandatory fields.');
    }
    if (Customer_Type === 'In-store' && !Phone_Number) {
      throw new Error('Phone number is required for In-store customers. Please provide a valid phone number.');
    }
    if (['Production', 'Wedding Invitation Maker'].includes(Customer_Type) && !Nickname) {
      throw new Error(`Nickname is required for ${Customer_Type} customers. Please provide a nickname.`);
    }

    const customer = new Customer({
      Customer_Type,
      Full_Name,
      Contact_Person,
      Email,
      Phone_Number,
      Address,
      Tax_ID,
      Job_Type,
      Status: Status || 'Active',
    });
    await customer.save({ session });

    if (Customer_Type === 'Production') {
      const prodCustomer = new ProductionCustomer({
        _id: Nickname,
        Customer_ID: customer._id,
      });
      await prodCustomer.save({ session });
    } else if (Customer_Type === 'Wedding Invitation Maker') {
      const weddingCustomer = new WeddingCustomer({
        _id: Nickname,
        Customer_ID: customer._id,
      });
      await weddingCustomer.save({ session });
    } else if (Customer_Type === 'In-store') {
      const instoreCustomer = new InstoreCustomer({
        _id: Phone_Number,
        Customer_ID: customer._id,
      });
      await instoreCustomer.save({ session });
    }

    await session.commitTransaction();
    res.status(201).json({ ...customer.toObject(), Nickname, Instore_Phone_Number: Customer_Type === 'In-store' ? Phone_Number : undefined });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error creating customer:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message).join(', ');
      res.status(400).json({ error: messages || 'Validation failed. Please check the form and try again.' });
    } else if (error.code === 11000) {
      res.status(400).json({ error: 'This phone number or nickname is already in use. Please use a unique value.' });
    } else {
      res.status(500).json({ error: 'An error occurred while creating the customer. Please try again later.' });
    }
  } finally {
    session.endSession();
  }
});

app.put('/api/customers/:id', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { Customer_Type, Full_Name, Contact_Person, Email, Phone_Number, Address, Tax_ID, Job_Type, Status, Nickname } = req.body;

    if (!Customer_Type || !Full_Name || !Job_Type) {
      throw new Error('Customer type, full name, and job type are required. Please fill in all mandatory fields.');
    }
    if (Customer_Type === 'In-store' && !Phone_Number) {
      throw new Error('Phone number is required for In-store customers. Please provide a valid phone number.');
    }
    if (['Production', 'Wedding Invitation Maker'].includes(Customer_Type) && !Nickname) {
      throw new Error(`Nickname is required for ${Customer_Type} customers. Please provide a nickname.`);
    }

    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      {
        Customer_Type,
        Full_Name,
        Contact_Person,
        Email,
        Phone_Number,
        Address,
        Tax_ID,
        Job_Type,
        Status: Status || 'Active',
        Updated_At: new Date(),
      },
      { new: true, runValidators: true, session }
    );
    if (!customer) {
      throw new Error('Customer not found. Please check the customer ID and try again.');
    }

    if (Customer_Type === 'Production') {
      await ProductionCustomer.deleteOne({ Customer_ID: customer._id }, { session });
      const prodCustomer = new ProductionCustomer({
        _id: Nickname,
        Customer_ID: customer._id,
      });
      await prodCustomer.save({ session });
    } else if (Customer_Type === 'Wedding Invitation Maker') {
      await WeddingCustomer.deleteOne({ Customer_ID: customer._id }, { session });
      const weddingCustomer = new WeddingCustomer({
        _id: Nickname,
        Customer_ID: customer._id,
      });
      await weddingCustomer.save({ session });
    } else if (Customer_Type === 'In-store') {
      await InstoreCustomer.deleteOne({ Customer_ID: customer._id }, { session });
      const instoreCustomer = new InstoreCustomer({
        _id: Phone_Number,
        Customer_ID: customer._id,
      });
      await instoreCustomer.save({ session });
    } else {
      await ProductionCustomer.deleteOne({ Customer_ID: customer._id }, { session });
      await WeddingCustomer.deleteOne({ Customer_ID: customer._id }, { session });
      await InstoreCustomer.deleteOne({ Customer_ID: customer._id }, { session });
    }

    await session.commitTransaction();
    res.json({ ...customer.toObject(), Nickname, Instore_Phone_Number: Customer_Type === 'In-store' ? Phone_Number : undefined });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error updating customer:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message).join(', ');
      res.status(400).json({ error: messages || 'Validation failed. Please check the form and try again.' });
    } else if (error.code === 11000) {
      res.status(400).json({ error: 'This phone number or nickname is already in use. Please use a unique value.' });
    } else {
      res.status(500).json({ error: 'An error occurred while updating the customer. Please try again later.' });
    }
  } finally {
    session.endSession();
  }
});

app.delete('/api/customers/:id', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      throw new Error('Customer not found. Please check the customer ID and try again.');
    }
    await Customer.deleteOne({ _id: req.params.id }, { session });
    await ProductionCustomer.deleteOne({ Customer_ID: req.params.id }, { session });
    await WeddingCustomer.deleteOne({ Customer_ID: req.params.id }, { session });
    await InstoreCustomer.deleteOne({ Customer_ID: req.params.id }, { session });
    await session.commitTransaction();
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error deleting customer:', error);
    res.status(500).json({ error: 'An error occurred while deleting the customer. Please try again later.' });
  } finally {
    session.endSession();
  }
});

app.get('/api/seed-customers', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    await Customer.deleteMany({}, { session });
    await ProductionCustomer.deleteMany({}, { session });
    await WeddingCustomer.deleteMany({}, { session });
    await InstoreCustomer.deleteMany({}, { session });
    const customers = await Customer.insertMany([
      {
        Customer_Type: 'In-store',
        Full_Name: 'John Doe',
        Phone_Number: '123456789',
        Tax_ID: '987654321',
        Job_Type: 'Wedding Invitations',
        Status: 'Active',
      },
      {
        Customer_Type: 'Production',
        Full_Name: 'Jane Smith',
        Tax_ID: '123456789-7000',
        Job_Type: 'Shoe Laser Cutting',
        Status: 'Active',
      },
      {
        Customer_Type: 'Wedding Invitation Maker',
        Full_Name: 'Wedding Co',
        Job_Type: 'Laser Cutting',
        Status: 'Active',
      },
    ], { session });
    await ProductionCustomer.insertMany([
      { _id: 'JSmith', Customer_ID: customers[1]._id },
    ], { session });
    await WeddingCustomer.insertMany([
      { _id: 'WeddingCo', Customer_ID: customers[2]._id },
    ], { session });
    await InstoreCustomer.insertMany([
      { _id: '123456789', Customer_ID: customers[0]._id },
    ], { session });
    await session.commitTransaction();
    res.json({ message: 'Customers seeded' });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error seeding customers:', error);
    res.status(500).json({ error: 'An error occurred while seeding customers. Please try again later.' });
  } finally {
    session.endSession();
  }
});

// Product Routes
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'An error occurred while fetching products. Please try again later.' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found. Please check the product ID and try again.' });
    }
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'An error occurred while fetching the product. Please try again later.' });
  }
});

app.post('/api/products', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const {
      Product_Category,
      Customer_Nickname,
      Material_Type,
      Unique_Code,
      Product_Type,
      Sticker_Option,
      Sticker_Type,
      Sticker_Color,
      Price,
    } = req.body;

    if (!Product_Category) {
      throw new Error('Product category is required. Please select a product category.');
    }

    let Product_ID;
    let Auto_Generated_ID;
    if (Product_Category === 'Shoe Laser Cutting') {
      if (!Customer_Nickname || !Material_Type || !Unique_Code || !Price) {
        throw new Error('Customer nickname, material type, unique code, and price are required for Shoe Laser Cutting products.');
      }
      Product_ID = `SLC-${Customer_Nickname}-${Material_Type}-${Unique_Code}`;
    } else if (Product_Category === 'Wedding Invitations') {
      if (!Product_Type || !Material_Type || !Sticker_Option || !Price) {
        throw new Error('Product type, material type, sticker option, and price are required for Wedding Invitations products.');
      }
      if (Sticker_Option === 'With Sticker' && (!Sticker_Type || !Sticker_Color)) {
        throw new Error('Sticker type and color are required when With Sticker is selected for Wedding Invitations.');
      }
      const lastProduct = await Product.findOne({ Product_Category: 'Wedding Invitations' }, {}, { sort: { Auto_Generated_ID: -1 }, session });
      Auto_Generated_ID = lastProduct?.Auto_Generated_ID
        ? String(Number(lastProduct.Auto_Generated_ID) + 1).padStart(4, '0')
        : '0001';
      const stickerDetail = Sticker_Option === 'With Sticker' ? 'With Sticker' : 'Without Sticker';
      Product_ID = `WI-${Material_Type}-${Product_Type}-${stickerDetail}-${Auto_Generated_ID}`;
    } else if (Product_Category === 'Laser Cutting') {
      const existingLaserCutting = await Product.findOne({ Product_Category: 'Laser Cutting' }).session(session);
      if (existingLaserCutting) {
        throw new Error('Only one Laser Cutting product is allowed at a time. Please delete the existing one first.');
      }
      Product_ID = 'LC';
    }

    if (!Product_ID || Product_ID.trim() === '') {
      throw new Error('Invalid Product ID generated. Please check the input data and try again.');
    }

    const existingProduct = await Product.findOne({ Product_ID }).session(session);
    if (existingProduct) {
      throw new Error(`Product ID ${Product_ID} is already in use. Please use a unique Product ID.`);
    }

    const barcodeID = await generateUniqueBarcodeID(Product, Product_Category);
    if (!barcodeID || barcodeID.trim() === '') {
      throw new Error('Failed to generate a valid Barcode ID. Please try again.');
    }

    const product = new Product({
      Product_Category,
      Product_ID,
      Customer_Nickname,
      Material_Type,
      Unique_Code,
      Product_Type,
      Sticker_Option,
      Sticker_Type,
      Sticker_Color,
      Auto_Generated_ID,
      Price,
      Barcode_ID: barcodeID,
      Status: 'Active',
    });
    await product.save({ session });

    await session.commitTransaction();
    res.status(201).json(product);
  } catch (error) {
    await session.abortTransaction();
    console.error('Error creating product:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message).join(', ');
      res.status(400).json({ error: messages || 'Validation failed. Please check the form and try again.' });
    } else if (error.code === 11000) {
      res.status(400).json({ error: 'This Product ID or Barcode ID is already in use. Please use unique values.' });
    } else {
      res.status(500).json({ error: 'An error occurred while creating the product. Please try again later.' });
    }
  } finally {
    session.endSession();
  }
});

app.put('/api/products/:id', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const {
      Product_Category,
      Customer_Nickname,
      Material_Type,
      Unique_Code,
      Product_Type,
      Sticker_Option,
      Sticker_Type,
      Sticker_Color,
      Price,
      Status,
    } = req.body;

    if (!Product_Category) {
      throw new Error('Product category is required. Please select a product category.');
    }

    let Product_ID;
    let Auto_Generated_ID;
    if (Product_Category === 'Shoe Laser Cutting') {
      if (!Customer_Nickname || !Material_Type || !Unique_Code || !Price) {
        throw new Error('Customer nickname, material type, unique code, and price are required for Shoe Laser Cutting products.');
      }
      Product_ID = `SLC-${Customer_Nickname}-${Material_Type}-${Unique_Code}`;
    } else if (Product_Category === 'Wedding Invitations') {
      if (!Product_Type || !Material_Type || !Sticker_Option || !Price) {
        throw new Error('Product type, material type, sticker option, and price are required for Wedding Invitations products.');
      }
      if (Sticker_Option === 'With Sticker' && (!Sticker_Type || !Sticker_Color)) {
        throw new Error('Sticker type and color are required when With Sticker is selected for Wedding Invitations.');
      }
      const existingProduct = await Product.findById(req.params.id).session(session);
      if (!existingProduct) {
        throw new Error('Product not found. Please check the product ID and try again.');
      }
      Auto_Generated_ID = existingProduct.Auto_Generated_ID;
      const stickerDetail = Sticker_Option === 'With Sticker' ? 'With Sticker' : 'Without Sticker';
      Product_ID = `WI-${Material_Type}-${Product_Type}-${stickerDetail}-${Auto_Generated_ID}`;
    } else if (Product_Category === 'Laser Cutting') {
      const existingLaserCutting = await Product.findOne({ Product_Category: 'Laser Cutting', _id: { $ne: req.params.id } }).session(session);
      if (existingLaserCutting) {
        throw new Error('Only one Laser Cutting product is allowed at a time. Please delete the existing one first.');
      }
      Product_ID = 'LC';
    }

    if (!Product_ID || Product_ID.trim() === '') {
      throw new Error('Invalid Product ID generated. Please check the input data and try again.');
    }

    const existingProduct = await Product.findOne({ Product_ID, _id: { $ne: req.params.id } }).session(session);
    if (existingProduct) {
      throw new Error(`Product ID ${Product_ID} is already in use. Please use a unique Product ID.`);
    }

    const barcodeID = await generateUniqueBarcodeID(Product, Product_Category);
    if (!barcodeID || barcodeID.trim() === '') {
      throw new Error('Failed to generate a valid Barcode ID. Please try again.');
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        Product_Category,
        Product_ID,
        Customer_Nickname,
        Material_Type,
        Unique_Code,
        Product_Type,
        Sticker_Option,
        Sticker_Type,
        Sticker_Color,
        Auto_Generated_ID,
        Price,
        Barcode_ID: barcodeID,
        Status: Status || 'Active',
        Updated_At: new Date(),
      },
      { new: true, runValidators: true, session }
    );
    if (!product) {
      throw new Error('Product not found. Please check the product ID and try again.');
    }

    await session.commitTransaction();
    res.json(product);
  } catch (error) {
    await session.abortTransaction();
    console.error('Error updating product:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message).join(', ');
      res.status(400).json({ error: messages || 'Validation failed. Please check the form and try again.' });
    } else if (error.code === 11000) {
      res.status(400).json({ error: 'This Product ID or Barcode ID is already in use. Please use unique values.' });
    } else {
      res.status(500).json({ error: 'An error occurred while updating the product. Please try again later.' });
    }
  } finally {
    session.endSession();
  }
});

app.delete('/api/products/:id', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      throw new Error('Product not found. Please check the product ID and try again.');
    }
    await Product.deleteOne({ _id: req.params.id }, { session });
    await session.commitTransaction();
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'An error occurred while deleting the product. Please try again later.' });
  } finally {
    session.endSession();
  }
});

app.get('/api/seed-products', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    await Product.deleteMany({}, { session });

    const barcodeID1 = await generateUniqueBarcodeID(Product, 'Shoe Laser Cutting');
    const barcodeID2 = await generateUniqueBarcodeID(Product, 'Wedding Invitations');
    const barcodeID3 = await generateUniqueBarcodeID(Product, 'Laser Cutting');

    const products = [
      {
        Product_Category: 'Shoe Laser Cutting',
        Product_ID: 'SLC-JSmith-Leather-001',
        Customer_Nickname: 'JSmith',
        Material_Type: 'Leather',
        Unique_Code: '001',
        Price: 5000,
        Barcode_ID: barcodeID1,
        Status: 'Active',
      },
      {
        Product_Category: 'Wedding Invitations',
        Product_ID: 'WI-Wood-Invitation Card-With Sticker-0001',
        Product_Type: 'Invitation Card',
        Material_Type: 'Wood',
        Sticker_Option: 'With Sticker',
        Sticker_Type: 'Normal',
        Sticker_Color: 'Gold',
        Auto_Generated_ID: '0001',
        Price: 2000,
        Barcode_ID: barcodeID2,
        Status: 'Active',
      },
      {
        Product_Category: 'Laser Cutting',
        Product_ID: 'LC',
        Barcode_ID: barcodeID3,
        Status: 'Active',
      },
    ];

    await Product.insertMany(products, { session });
    await session.commitTransaction();
    res.json({ message: 'Products seeded' });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error seeding products:', error);
    res.status(500).json({ error: 'An error occurred while seeding products. Please try again later.' });
  } finally {
    session.endSession();
  }
});

// Invoice Management Routes
// Search customers by type and identifier
app.post('/api/customers/search', async (req, res) => {
  try {
    const { Customer_Type, Identifier } = req.body;

    if (!Customer_Type || !Identifier) {
      return res.status(400).json({ error: 'Customer type and identifier (Phone Number or Nickname) are required.' });
    }

    if (!['In-store', 'Production', 'Wedding Invitation Maker'].includes(Customer_Type)) {
      return res.status(400).json({ error: 'Invalid customer type. Must be In-store, Production, or Wedding Invitation Maker.' });
    }

    let customer;
    if (Customer_Type === 'In-store') {
      const instoreCustomer = await InstoreCustomer.findOne({ _id: Identifier });
      if (!instoreCustomer) {
        return res.status(404).json({ error: 'No customer found with this phone number.' });
      }
      customer = await Customer.findById(instoreCustomer.Customer_ID);
      if (!customer) {
        return res.status(404).json({ error: 'Customer not found.' });
      }
      customer = customer.toObject();
      customer.Phone_Number = Identifier;
    } else if (Customer_Type === 'Production') {
      const prodCustomer = await ProductionCustomer.findOne({ _id: Identifier });
      if (!prodCustomer) {
        return res.status(404).json({ error: 'No customer found with this nickname.' });
      }
      customer = await Customer.findById(prodCustomer.Customer_ID);
      if (!customer) {
        return res.status(404).json({ error: 'Customer not found.' });
      }
      customer = customer.toObject();
      customer.Nickname = Identifier;
    } else if (Customer_Type === 'Wedding Invitation Maker') {
      const weddingCustomer = await WeddingCustomer.findOne({ _id: Identifier });
      if (!weddingCustomer) {
        return res.status(404).json({ error: 'No customer found with this nickname.' });
      }
      customer = await Customer.findById(weddingCustomer.Customer_ID);
      if (!customer) {
        return res.status(404).json({ error: 'Customer not found.' });
      }
      customer = customer.toObject();
      customer.Nickname = Identifier;
    }

    res.json(customer);
  } catch (error) {
    console.error('Error searching customer:', error);
    res.status(500).json({ error: 'An error occurred while searching for the customer. Please try again later.' });
  }
});

// Process barcode scan
app.post('/api/invoices/scan', async (req, res) => {
  try {
    const { Barcode_ID, Duration, Material_Cost, Quantity } = req.body;

    if (!Barcode_ID) {
      return res.status(400).json({ error: 'Barcode ID is required.' });
    }
    if (!Quantity || Quantity < 1) {
      return res.status(400).json({ error: 'Quantity must be at least 1.' });
    }

    let item = {};
    if (Barcode_ID === 'LC') {
      if (!Duration || Duration <= 0) {
        return res.status(400).json({ error: 'Duration in minutes is required for Laser Cutting and must be greater than 0.' });
      }
      const rate = 60; // LKR 60 per minute
      const baseCost = rate * Duration;
      const materialCost = Material_Cost && Material_Cost >= 0 ? Material_Cost : 0;
      const lineTotal = (baseCost + materialCost) * Quantity;
      item = {
        Item_Description: `Laser Cutting (${Duration} minutes${Material_Cost ? `, Material Cost: LKR ${Material_Cost}` : ''})`,
        Quantity,
        Rate: baseCost + materialCost,
        Line_Total: lineTotal,
      };
    } else if (Barcode_ID.startsWith('ORGA-WI-')) {
      const product = await Product.findOne({ Barcode_ID });
      if (!product) {
        return res.status(404).json({ error: 'Wedding Invitation product not found for this Barcode ID.' });
      }
      const lineTotal = product.Price * Quantity;
      item = {
        Item_Description: `Wedding Invitation (${product.Product_ID})`,
        Quantity,
        Rate: product.Price,
        Line_Total: lineTotal,
      };
    } else if (Barcode_ID.startsWith('ORGA-SLC-')) {
      const product = await Product.findOne({ Barcode_ID });
      if (!product) {
        return res.status(404).json({ error: 'Shoe Laser Cutting product not found for this Barcode ID.' });
      }
      const lineTotal = product.Price * Quantity;
      item = {
        Item_Description: `Shoe Laser Cutting (${product.Product_ID})`,
        Quantity,
        Rate: product.Price,
        Line_Total: lineTotal,
      };
    } else {
      return res.status(400).json({ error: 'Invalid Barcode ID. It must start with LC, ORGA-WI-, or ORGA-SLC-.' });
    }

    res.json(item);
  } catch (error) {
    console.error('Error processing barcode:', error);
    res.status(500).json({ error: 'An error occurred while processing the barcode. Please try again later.' });
  }
});

// Create and save invoice/quotation
app.post('/api/invoices', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { Document_Type, Customer_ID, Items, invoiceDateInput } = req.body;

    if (!Document_Type || !['Invoice', 'Quotation'].includes(Document_Type)) {
      throw new Error('Document type must be either Invoice or Quotation.');
    }
    if (!Customer_ID) {
      throw new Error('Customer ID is required.');
    }
    if (!Items || !Array.isArray(Items) || Items.length === 0) {
      throw new Error('At least one item is required in the invoice/quotation.');
    }

    // Validate Items array
    for (const [index, item] of Items.entries()) {
      if (!item.Item_Description || typeof item.Item_Description !== 'string') {
        throw new Error(`Item at index ${index}: Item_Description must be a non-empty string.`);
      }
      if (!Number.isInteger(item.Quantity) || item.Quantity < 1) {
        throw new Error(`Item at index ${index}: Quantity must be an integer greater than or equal to 1.`);
      }
      if (typeof item.Rate !== 'number' || item.Rate < 0) {
        throw new Error(`Item at index ${index}: Rate must be a non-negative number.`);
      }
      if (typeof item.Line_Total !== 'number' || item.Line_Total < 0) {
        throw new Error(`Item at index ${index}: Line_Total must be a non-negative number.`);
      }
    }

    console.log('Received Items:', Items); // Log received items for debugging

    const customer = await Customer.findById(Customer_ID).session(session);
    if (!customer) {
      throw new Error('Customer not found. Please check the customer ID.');
    }

    const invoiceDate = invoiceDateInput ? new Date(invoiceDateInput) : new Date();
    if (isNaN(invoiceDate.getTime())) {
      throw new Error('Invalid date format provided. Please use a valid date string (e.g., "2025-05-17").');
    }

    const documentID = await generateDocumentID(Document_Type, invoiceDate);

    const invoice = new Invoice({
      Document_Type,
      Document_ID: documentID,
      Customer_ID,
      Date: invoiceDate,
      Items,
    });

    console.log('Invoice before save:', invoice.toObject()); // Log invoice state before save

    await invoice.save({ session });

    await session.commitTransaction();
    res.status(201).json(invoice);
  } catch (error) {
    await session.abortTransaction();
    console.error('Error creating invoice:', error); 
    console.error('Request body:', req.body); // Log the incoming request body
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message).join(', ');
      res.status(400).json({ error: messages || 'Validation failed. Please check the form and try again.' });
    } else if (error.code === 11000) {
      res.status(400).json({ error: 'This Document ID is already in use. Please try again.' });
    } else {
      res.status(500).json({ error: error.message || 'An error occurred while creating the invoice/quotation. Please try again later.' });
    }
  } finally {
    session.endSession();
  }
});

// Fetch all invoices/quotations
app.get('/api/invoices', async (req, res) => {
  try {
    const invoices = await Invoice.find().populate('Customer_ID');
    res.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'An error occurred while fetching invoices/quotations. Please try again later.' });
  }
});

// Fetch a single invoice/quotation
app.get('/api/invoices/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate('Customer_ID');
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice/Quotation not found. Please check the ID and try again.' });
    }
    res.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ error: 'An error occurred while fetching the invoice/quotation. Please try again later.' });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));