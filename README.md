# Lamasat Boutique - Wedding & Evening Dress Management System

## 📋 Overview

**Lamasat Boutique** is a comprehensive management system for a specialized boutique dealing in wedding and evening dress sales and rentals. The system provides an easy-to-use interface for customers and a comprehensive dashboard for administrators to manage products, orders, and support tickets.

## ✨ Key Features

### 🛍️ For Customers
- **Product Browsing**: View wedding and evening dresses with high-quality images
- **Search & Filter**: Search products by name or description
- **Product Details**: View complete details with multiple images
- **Order System**: Direct product ordering capability
- **Ticket System**: Communicate with support team for custom dress design requests
- **Order Tracking**: Monitor order and ticket status

### 👨‍💼 For Administrators
- **Comprehensive Dashboard**: Complete store management
- **Product Management**: Add, edit, and delete products
- **Category Management**: Organize products into different categories
- **User Management**: Add and manage administrator accounts
- **Ticket System**: Manage design requests and technical support
- **Order Management**: Track and process customer orders

### 🔧 Technical Features
- **Responsive UI**: Works on all devices
- **Secure Authentication**: Password encryption
- **Image Upload**: Support for multiple product images
- **Real-time Chat**: Socket.IO for instant communication
- **Session Management**: Secure sessions with MongoDB
- **Complete API**: Programmatic interfaces for system interaction

## 🚀 Installation & Setup

### Requirements
- Node.js (Version 14 or higher)
- MongoDB (Version 4.4 or higher)
- npm or yarn

### Installation Steps

1. **Clone the Project**
```bash
git clone [project-url]
cd NewLamasat
```

2. **Install Dependencies**
```bash
npm install
```

3. **Environment Variables Setup**
Create a `.env` file in the root directory:
```env
# Database Settings
MONGODB_URI=mongodb://localhost:27017/lamasat_boutique

# Session Settings
SESSION_SECRET=your-secret-key-here

# Admin Settings
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-admin-password

# Contact Settings
CONTACT_PHONE=0930125249
WHATSAPP_NUMBER=963930125249

# Environment Settings
NODE_ENV=development
PORT=3018
```

4. **Database Setup**
```bash
npm run setup
```

5. **Start the Server**
```bash
# For development
npm run dev

# For production
npm start
```

6. **Access the Website**
- Website: `http://localhost:3018`
- Dashboard: `http://localhost:3018/dashboard`

## 📁 Project Structure

```
NewLamasat/
├── app.js                 # Main application file
├── package.json           # Project info and dependencies
├── setup.js              # Database setup file
├── seed.js               # Sample data insertion file
├── middleware/           # Application middleware
│   ├── auth.js          # Authentication middleware
│   └── categories.js    # Categories loading middleware
├── models/              # Database models
│   ├── User.js          # User model
│   ├── Product.js       # Product model
│   ├── Category.js      # Category model
│   ├── Order.js         # Order model
│   └── Ticket.js        # Ticket model
├── routes/              # Application routes
│   ├── auth.js          # Authentication routes
│   ├── main.js          # Main routes
│   ├── dashboard.js     # Dashboard routes
│   ├── tickets.js       # Ticket routes
│   └── api.js           # API routes
├── views/               # View templates
│   ├── auth/           # Authentication templates
│   ├── dashboard/      # Dashboard templates
│   ├── orders/         # Order templates
│   ├── tickets/        # Ticket templates
│   └── partials/       # Partial templates
├── public/             # Static files
│   ├── css/           # Stylesheet files
│   ├── js/            # JavaScript files
│   ├── images/        # Static images
│   └── uploads/       # Uploaded files
└── README.md          # This file
```

## 🎯 Detailed Features

### User System
- **Three User Types**:
  - `normal`: Regular customers
  - `admin`: Administrators
  - `owner`: Owner (highest privileges)

### Product System
- **Comprehensive Product Management**:
  - Automatic serial numbers
  - Unique product codes
  - Sales and rental support
  - Multiple images
  - Category classification
  - View tracking

### Category System
- **Product Organization**:
  - Customizable categories
  - Icons and descriptions
  - Custom ordering
  - Category images

### Order System
- **Order Management**:
  - Sales and rental orders
  - Order status tracking
  - Product linking
  - Custom notes

### Ticket System
- **Integrated Support System**:
  - Custom dress design tickets
  - Technical support tickets
  - Real-time chat with Socket.IO
  - File attachments
  - Ticket status tracking
  - User assignment

## 🔌 API Documentation

### Authentication Routes
```
POST /auth/login          # User login
POST /auth/register       # User registration
POST /auth/logout         # User logout
```

### Product Routes
```
GET  /                    # Homepage
GET  /category/:slug      # Display specific category
GET  /product/:id         # Display specific product
GET  /search              # Search products
```

### Order Routes
```
GET  /orders              # Display user orders
GET  /orders/create/:id   # Create new order
```

### Ticket Routes
```
GET  /tickets/new         # Create new ticket
POST /tickets             # Submit new ticket
GET  /tickets/:id         # Display specific ticket
POST /tickets/:id/messages # Add message to ticket
```

### Dashboard Routes
```
GET  /dashboard           # Main dashboard
GET  /dashboard/products  # Product management
GET  /dashboard/categories # Category management
GET  /dashboard/users     # User management
GET  /dashboard/tickets   # Ticket management
```

## 🛠️ Development

### Available Commands
```bash
npm start          # Start server for production
npm run dev        # Start server for development with nodemon
npm run setup      # Setup database
npm run seed       # Insert sample data
```

### Adding New Features
1. Create model in `models/` folder
2. Add routes in `routes/` folder
3. Create templates in `views/` folder
4. Add styles in `public/css/` folder
5. Add JavaScript in `public/js/` folder

## 🔒 Security

- **Password Encryption**: Using bcryptjs
- **Secure Sessions**: Using express-session with MongoDB
- **CSRF Protection**: Using csurf middleware
- **Authorization**: Custom middleware for role verification
- **Input Validation**: Data validation and sanitization

## 📱 Compatibility

- **Browsers**: Chrome, Firefox, Safari, Edge
- **Devices**: Desktop, Tablet, Mobile
- **Operating Systems**: Windows, macOS, Linux

## 🤝 Contributing

1. Fork the project
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support or to report issues:
- **Phone**: 0930125249
- **WhatsApp**: 963930125249
- **Email**: [Email Address]

## 🔄 Future Updates

- [ ] Electronic payment system
- [ ] Mobile application
- [ ] Product rating system
- [ ] Notification system
- [ ] Advanced analytics
- [ ] Multi-language support
- [ ] Advanced inventory system

---

**Developed by Lamasat Boutique Team** 💎
