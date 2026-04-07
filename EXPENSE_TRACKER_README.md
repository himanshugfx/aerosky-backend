# Expense Tracker - AeroSys Administration

## Overview

The Expense Tracker is a comprehensive financial management tool designed for AeroSys Aviation administrators to track, categorize, and analyze organizational expenses. It provides a complete solution for expense management with features like categorization, payment tracking, receipt attachments, and detailed analytics.

## Features

### 📊 Core Functionality
- **Add/Edit/Delete Expenses**: Full CRUD operations for expense management
- **Categorization**: Pre-defined categories for organized expense tracking
- **Payment Methods**: Track how expenses were paid (Cash, Credit Card, Bank Transfer, etc.)
- **Status Tracking**: Monitor expense status (Paid/Pending)
- **Receipt Attachments**: Upload and store digital receipts/bills
- **Date-based Tracking**: Record and filter expenses by date

### 🔍 Advanced Features
- **Search & Filtering**: Search by description, filter by category, status, and date range
- **Pagination**: Efficient handling of large expense datasets
- **Export Capabilities**: Export data to Excel and PDF formats
- **Real-time Analytics**: View expense summaries and trends
- **Category Breakdown**: Visual representation of spending by category
- **Monthly Overview**: Track spending patterns over time

### 📈 Analytics & Reporting
- **Dashboard Metrics**: Total expenses, monthly spending, pending expenses
- **Category Analysis**: Spending breakdown by expense categories
- **Trend Analysis**: Monthly expense trends and patterns
- **Export Reports**: Generate comprehensive financial reports

## User Interface

### Main Dashboard
- **Summary Cards**: Quick overview of key financial metrics
- **Expense Table**: Detailed list view with sorting and pagination
- **Filter Panel**: Advanced filtering options
- **Action Buttons**: Quick access to add expenses and export data

### Analytics View
- **Category Breakdown**: Pie chart style visualization of spending by category
- **Monthly Trends**: 6-month spending overview
- **Visual Indicators**: Progress bars and color-coded status indicators

### Add/Edit Expense Form
- **Required Fields**: Description, Amount, Date, Category
- **Optional Fields**: Payment Method, Receipt Attachment
- **File Upload**: Support for images and PDF receipts
- **Validation**: Client-side and server-side validation

## Technical Implementation

### API Endpoints

#### GET `/api/expenses`
Fetch expenses with filtering and pagination
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 20)
  - `category`: Filter by expense category
  - `status`: Filter by expense status
  - `startDate`: Filter from date
  - `endDate`: Filter to date
  - `search`: Search in descriptions

#### POST `/api/expenses`
Create a new expense (Administration only)
- **Body**: Expense data object

#### PUT `/api/expenses`
Update an existing expense (Administration only)
- **Body**: Expense data with ID

#### DELETE `/api/expenses`
Delete an expense (Administration only)
- **Query**: `id` - Expense ID to delete

### Database Schema

```prisma
model Expense {
  id             String   @id @default(uuid())
  description    String
  amount         Float
  date           DateTime
  category       String
  paymentMethod  String?  @map("payment_method")
  status         String   @default("Paid") // Paid, Pending
  attachment     String?  @db.Text // Base64 or URL
  organizationId String   @map("organization_id")
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
}
```

### Security & Permissions

- **Role-based Access**: Only ADMINISTRATION role can manage expenses
- **Organization Scoping**: Expenses are scoped to the user's organization
- **API Authentication**: All endpoints require valid authentication
- **Input Validation**: Comprehensive validation on both client and server

### Categories

Pre-defined expense categories:
- Office Supplies
- Travel
- Equipment
- Software
- Marketing
- Training
- Maintenance
- Utilities
- Insurance
- Legal
- Consulting
- Other

### Payment Methods

Supported payment methods:
- Cash
- Credit Card
- Debit Card
- Bank Transfer
- Cheque
- Digital Wallet
- Other

## Usage Guide

### Adding a New Expense

1. Navigate to the Expense Tracker in the Admin panel
2. Click "Add Expense" button
3. Fill in the required fields:
   - Description: Brief description of the expense
   - Amount: Expense amount in rupees
   - Date: When the expense occurred
   - Category: Select from predefined categories
4. Optionally add:
   - Payment Method
   - Receipt attachment (image or PDF)
5. Click "Add Expense" to save

### Filtering and Searching

1. Use the search bar to find expenses by description
2. Click "Filters" to access advanced filtering:
   - Filter by category
   - Filter by status (Paid/Pending)
   - Filter by date range
3. Results update automatically as you apply filters

### Exporting Data

1. Click "Excel" to export current filtered results to Excel
2. Click "PDF" to generate a PDF report
3. Files are automatically downloaded with timestamp

### Viewing Analytics

1. Click "Analytics" button to switch to analytics view
2. View category breakdown with visual progress bars
3. Review monthly spending trends
4. Switch back to "List View" for detailed expense management

## Integration Points

### File Upload System
- Integrates with existing FileUploader component
- Supports image formats and PDF files
- Stores attachments as base64 strings or URLs

### Authentication System
- Uses existing auth-service for user authentication
- Leverages role-based permissions
- Organization-scoped data access

### Database Integration
- Uses Prisma ORM for database operations
- Follows existing database patterns and relationships
- Maintains data consistency with foreign key constraints

## Best Practices

### Expense Management
- Always attach receipts for audit purposes
- Use descriptive expense descriptions
- Categorize expenses accurately for better reporting
- Keep payment methods updated for financial tracking

### Data Organization
- Regular review of pending expenses
- Monthly expense analysis for budget planning
- Export reports for accounting and tax purposes
- Maintain organized file attachments

### Security
- Only authorized personnel can manage expenses
- All data is organization-scoped
- File uploads are validated and sanitized
- API endpoints are protected with authentication

## Future Enhancements

Potential improvements for the expense tracker:
- Budget vs actual spending comparisons
- Recurring expense templates
- Multi-currency support
- Advanced reporting with charts
- Integration with accounting software
- Mobile app support
- Automated expense categorization using AI
- Approval workflows for large expenses