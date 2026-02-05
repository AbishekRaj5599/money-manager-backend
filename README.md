# Money Manager Backend

A Node.js REST API for the Money Manager application with MongoDB Atlas integration.

## Features

- **Transaction CRUD**: Create, read, update, delete transactions
- **Filtering**: Filter transactions by period, category, division, date range
- **Edit Restrictions**: Prevent editing after 12 hours
- **Summary Statistics**: Generate financial summaries and breakdowns
- **MongoDB Atlas**: Cloud database integration

## Tech Stack

- Node.js
- Express.js
- MongoDB Atlas
- Mongoose ODM
- CORS enabled

## API Endpoints

### Transactions
- `GET /api/transactions` - Get all transactions with optional filters
- `POST /api/transactions` - Create new transaction
- `PUT /api/transactions/:id` - Update transaction (within 12 hours)
- `DELETE /api/transactions/:id` - Delete transaction (within 12 hours)

### Summary
- `GET /api/summary` - Get financial summary and statistics

### Health Check
- `GET /api/health` - API health status

## Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/money-manager-backend.git
cd money-manager-backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file with:
```
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster0.mongodb.net/money-manager?retryWrites=true&w=majority
JWT_SECRET=your-jwt-secret
```

4. Start the server:
```bash
npm start
```

For development with auto-restart:
```bash
npm run dev
```

## MongoDB Atlas Setup

1. Create a MongoDB Atlas account
2. Create a new cluster
3. Create a database user
4. Get the connection string
5. Replace the MONGODB_URI in .env file

## Deployment

The API can be deployed to:
- Heroku
- Railway
- Render
- DigitalOcean App Platform
- AWS Elastic Beanstalk

## Environment Variables

- `PORT`: Server port (default: 5000)
- `MONGODB_URI`: MongoDB Atlas connection string
- `JWT_SECRET`: Secret key for JWT tokens

## Data Model

### Transaction Schema
```javascript
{
  type: String, // 'income' or 'expense'
  amount: Number,
  description: String,
  category: String,
  division: String, // 'office' or 'personal'
  timestamp: Date,
  canEdit: Boolean
}
```

## Query Parameters

### GET /api/transactions
- `period`: 'weekly', 'monthly', 'yearly'
- `division`: 'office', 'personal', 'all'
- `category`: category name or 'all'
- `startDate`: ISO date string
- `endDate`: ISO date string