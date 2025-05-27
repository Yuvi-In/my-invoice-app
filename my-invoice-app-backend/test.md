// Schemas
const customerSchema = new mongoose.Schema({
  Customer_Type: {
    type: String,
    enum: ['Production', 'In-store', 'Wedding Invitation Maker'],
    required: [true, 'Customer type is required'],
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
      message: 'Invalid email address',
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
      message: 'Phone number must be 9-10 digits',
    },
  },
  Address: { type: String },
  Tax_ID: {
    type: String,
    validate: {
      validator: function (value) {
        return !value || /^\d{9}$|^\d{9}-7000$/.test(value);
      },
      message: 'Tax ID must be 9 digits or 9 digits with -7000',
    },
  },
  Job_Type: {
    type: String,
    enum: ['Wedding Invitations', 'Shoe Laser Cutting', 'Laser Cutting'],
    required: [true, 'Job type is required'],
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
  _id: { type: String, required: true }, // Nickname as _id
  Customer_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
});

const weddingCustomerSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // Nickname as _id
  Customer_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
});

const instoreCustomerSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // Phone_Number as _id
  Customer_ID: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
});



// Middleware to update Updated_At
customerSchema.pre('findOneAndUpdate', function (next) {
  this.set({ Updated_At: new Date() });
  next();
});

// Routes
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
    res.status(500).json({ error: 'Something went wrong, please try again' });
  }
});

app.get('/api/customers/:id', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
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
    res.status(500).json({ error: 'Something went wrong, please try again' });
  }
});

app.post('/api/customers', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { Customer_Type, Full_Name, Contact_Person, Email, Phone_Number, Address, Tax_ID, Job_Type, Status, Nickname } = req.body;

    if (!Customer_Type || !Full_Name || !Job_Type) {
      throw new Error('Customer type, full name, and job type are required');
    }
    if (Customer_Type === 'In-store' && !Phone_Number) {
      throw new Error('Phone number is required for In-store customers');
    }
    if (['Production', 'Wedding Invitation Maker'].includes(Customer_Type) && !Nickname) {
      throw new Error(`Nickname is required for ${Customer_Type} customers`);
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
      res.status(400).json({ error: messages || 'Please check the form for errors' });
    } else if (error.code === 11000) {
      res.status(400).json({ error: 'This phone number or nickname is already in use' });
    } else {
      res.status(500).json({ error: error.message || 'Something went wrong, please try again' });
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
      throw new Error('Customer type, full name, and job type are required');
    }
    if (Customer_Type === 'In-store' && !Phone_Number) {
      throw new Error('Phone number is required for In-store customers');
    }
    if (['Production', 'Wedding Invitation Maker'].includes(Customer_Type) && !Nickname) {
      throw new Error(`Nickname is required for ${Customer_Type} customers`);
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
      throw new Error('Customer not found');
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
      res.status(400).json({ error: messages || 'Please check the form for errors' });
    } else if (error.code === 11000) {
      res.status(400).json({ error: 'This phone number or nickname is already in use' });
    } else {
      res.status(500).json({ error: error.message || 'Something went wrong, please try again' });
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
      throw new Error('Customer not found');
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
    res.status(500).json({ error: error.message || 'Something went wrong, please try again' });
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
    res.status(500).json({ error: 'Something went wrong, please try again' });
  } finally {
    session.endSession();
  }
});