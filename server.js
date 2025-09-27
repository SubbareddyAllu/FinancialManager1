/**
 * SpendLy Financial Manager Backend API (server.js)
 * * This file sets up a Node.js server using Express.js and Mongoose 
 * to handle CRUD operations for expense data in MongoDB.
 * * * IMPORTANT SETUP STEPS:
 * 1. Ensure Node.js and MongoDB are installed.
 * 2. Save this file as 'server.js' in your backend directory.
 * 3. Open your terminal in that directory and run:
 * npm init -y
 * npm install express mongoose cors
 * 4. Replace the 'MONGO_URI' placeholder below with your actual connection string.
 * 5. Run the server: node server.js
 * * * API Endpoints (The frontend will call these):
 * - POST /api/expenses    (Create Expense)
 * - GET /api/expenses     (Read All Expenses)
 * - PUT /api/expenses/:id (Update Expense - Not currently used by frontend but included)
 * - DELETE /api/expenses/:id (Delete Expense)
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// --- Configuration ---
const PORT = 5000;

// !!! --- ACTION REQUIRED: REPLACE THIS WITH YOUR MONGODB CONNECTION STRING --- !!!
// Example: 'mongodb+srv://user:password@clustername.mongodb.net/spendly_db?retryWrites=true&w=majority'
const MONGO_URI = 'mongodb://localhost:27017/spendly_db'; 

// --- Mongoose Setup and Connection ---

mongoose.connect(MONGO_URI)
    .then(() => console.log('Successfully connected to MongoDB.'))
    .catch(err => {
        console.error('!!! MongoDB connection error !!!');
        console.error('Please check your MONGO_URI in server.js and ensure MongoDB is running.');
        console.error(err.message);
    });

// Define the Expense Schema
const expenseSchema = new mongoose.Schema({
    description: { 
        type: String, 
        required: [true, 'Description is required'],
        trim: true
    },
    amount: { 
        type: Number, 
        required: [true, 'Amount is required'],
        min: [0.01, 'Amount must be greater than zero']
    },
    category: { 
        type: String, 
        default: 'Uncategorized' 
    },
    date: { 
        type: Date, 
        default: Date.now 
    }
}, { 
    timestamps: true // Adds createdAt and updatedAt timestamps
});

// Create the Expense Model
const Expense = mongoose.model('Expense', expenseSchema);


// --- Express Application Setup ---

const app = express();

// Middleware
// 1. CORS: Allows your frontend (e.g., running on port 8000 or a different domain) to talk to this API
// The origin should match where your frontend is served from (e.g., http://localhost:8080 or your GitHub Pages URL)
app.use(cors({
    origin: '*' // Allow all origins for development, you should tighten this up later
}));
// 2. Body Parser: Allows Express to read JSON data sent in the request body
app.use(express.json());


// --- API Routes (CRUD) ---

// 1. CREATE: Add a new expense (POST /api/expenses)
app.post('/api/expenses', async (req, res) => {
    try {
        const newExpense = new Expense(req.body);
        const savedExpense = await newExpense.save();
        res.status(201).json(savedExpense); 
    } catch (error) {
        console.error('Error creating expense:', error);
        // Mongoose validation errors
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Validation failed', errors: error.errors });
        }
        res.status(500).json({ message: 'Failed to create expense', error: error.message });
    }
});

// 2. READ: Get all expenses (GET /api/expenses)
app.get('/api/expenses', async (req, res) => {
    try {
        // Fetches all, sorted by date descending (newest first)
        const expenses = await Expense.find({}).sort({ date: -1 });
        res.status(200).json(expenses);
    } catch (error) {
        console.error('Error fetching expenses:', error);
        res.status(500).json({ message: 'Failed to fetch expenses' });
    }
});

// 3. UPDATE: Update a specific expense by ID (PUT /api/expenses/:id)
app.put('/api/expenses/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updatedExpense = await Expense.findByIdAndUpdate(
            id, 
            req.body, 
            { 
                new: true, 
                runValidators: true 
            }
        );

        if (!updatedExpense) {
            return res.status(404).json({ message: 'Expense not found' });
        }

        res.status(200).json(updatedExpense);
    } catch (error) {
        console.error('Error updating expense:', error);
        res.status(400).json({ message: 'Failed to update expense', error: error.message });
    }
});

// 4. DELETE: Delete a specific expense by ID (DELETE /api/expenses/:id)
app.delete('/api/expenses/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await Expense.findByIdAndDelete(id);

        if (!result) {
            return res.status(404).json({ message: 'Expense not found' });
        }
        
        // Respond with 204 No Content for a successful deletion
        res.status(204).send(); 
    } catch (error) {
        console.error('Error deleting expense:', error);
        res.status(500).json({ message: 'Failed to delete expense' });
    }
});

// Basic health check route
app.get('/', (req, res) => {
    res.send('SpendLy API is running!');
});

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`\nSpendLy Server is running on http://localhost:${PORT}`);
    console.log('API Endpoints are ready for use.');
});