const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://your-username:your-password@cluster0.mongodb.net/money-manager?retryWrites=true&w=majority';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('MongoDB connection error:', err));

// Transaction Schema
const transactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  division: {
    type: String,
    enum: ['office', 'personal'],
    default: 'personal'
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  canEdit: {
    type: Boolean,
    default: true
  }
});

const Transaction = mongoose.model('Transaction', transactionSchema);

// Routes

// Get all transactions
app.get('/api/transactions', async (req, res) => {
  try {
    const { period, division, category, startDate, endDate } = req.query;
    let filter = {};
    
    // Apply filters
    if (division && division !== 'all') {
      filter.division = division;
    }
    
    if (category && category !== 'all') {
      filter.category = category;
    }
    
    // Date filtering
    if (period) {
      const now = new Date();
      let dateFilter = {};
      
      if (period === 'weekly') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFilter = { $gte: weekAgo };
      } else if (period === 'monthly') {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        dateFilter = { $gte: monthStart };
      } else if (period === 'yearly') {
        const yearStart = new Date(now.getFullYear(), 0, 1);
        dateFilter = { $gte: yearStart };
      }
      
      if (Object.keys(dateFilter).length > 0) {
        filter.timestamp = dateFilter;
      }
    }
    
    if (startDate && endDate) {
      filter.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const transactions = await Transaction.find(filter).sort({ timestamp: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new transaction
app.post('/api/transactions', async (req, res) => {
  try {
    const transaction = new Transaction(req.body);
    await transaction.save();
    
    // Set edit restriction after 12 hours
    setTimeout(async () => {
      await Transaction.findByIdAndUpdate(transaction._id, { canEdit: false });
    }, 12 * 60 * 60 * 1000);
    
    res.status(201).json(transaction);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update transaction
app.put('/api/transactions/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    if (!transaction.canEdit) {
      return res.status(403).json({ error: 'Transaction cannot be edited after 12 hours' });
    }
    
    const updatedTransaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    res.json(updatedTransaction);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete transaction
app.delete('/api/transactions/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    if (!transaction.canEdit) {
      return res.status(403).json({ error: 'Transaction cannot be deleted after 12 hours' });
    }
    
    await Transaction.findByIdAndDelete(req.params.id);
    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get summary statistics
app.get('/api/summary', async (req, res) => {
  try {
    const { period, division, category } = req.query;
    let filter = {};
    
    if (division && division !== 'all') {
      filter.division = division;
    }
    
    if (category && category !== 'all') {
      filter.category = category;
    }
    
    const transactions = await Transaction.find(filter);
    
    const summary = {
      totalIncome: transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
      totalExpense: transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
      transactionCount: transactions.length,
      categoryBreakdown: {},
      divisionBreakdown: { office: 0, personal: 0 }
    };
    
    // Category breakdown
    transactions.forEach(t => {
      const key = `${t.type}-${t.category}`;
      if (!summary.categoryBreakdown[key]) {
        summary.categoryBreakdown[key] = { amount: 0, count: 0 };
      }
      summary.categoryBreakdown[key].amount += t.amount;
      summary.categoryBreakdown[key].count += 1;
    });
    
    // Division breakdown
    transactions.filter(t => t.type === 'expense').forEach(t => {
      summary.divisionBreakdown[t.division] += t.amount;
    });
    
    summary.netBalance = summary.totalIncome - summary.totalExpense;
    
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Money Manager API is running',
    endpoints: {
      transactions: '/api/transactions',
      summary: '/api/summary',
      health: '/api/health'
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});