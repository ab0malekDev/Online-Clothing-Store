const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const fs = require('fs');
const MongoStore = require('connect-mongo');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

// إعداد Socket.IO
io.on('connection', (socket) => {
    console.log('مستخدم جديد متصل');

    // تخزين معلومات الغرف للمستخدم
    const userRooms = new Set();

    // الانضمام إلى غرفة المحادثة
    socket.on('join-ticket', (data) => {
        const { ticketId, userId, role } = data;
        const roomId = `ticket-${ticketId}`;
        
        // انضمام إلى غرفة التذكرة
        socket.join(roomId);
        userRooms.add(roomId);
        
        // انضمام إلى الغرفة الخاصة بالمستخدم
        if (role === 'admin' || role === 'owner') {
            socket.join('support-room');
            userRooms.add('support-room');
        } else {
            const userRoom = `user-${userId}`;
            socket.join(userRoom);
            userRooms.add(userRoom);
        }
        
        console.log(`المستخدم ${userId} انضم إلى الغرفة ${ticketId}`);
        
        // إرسال تأكيد الانضمام
        socket.emit('joined-ticket', { ticketId, success: true });
    });

    // إرسال رسالة جديدة
    socket.on('chat-message', (data) => {
        const roomId = `ticket-${data.ticketId}`;
        console.log(`إرسال رسالة إلى الغرفة ${roomId}:`, data);
        
        // إرسال الرسالة لجميع المتصلين في الغرفة
        io.in(roomId).emit('chat-message', {
            ...data,
            timestamp: Date.now() // إضافة طابع زمني للرسالة
        });
    });

    // تأكيد استلام الرسالة
    socket.on('message-received-confirmation', (data) => {
        console.log('تأكيد استلام الرسالة:', data);
    });

    // مغادرة الغرفة
    socket.on('leave-ticket', (data) => {
        const { ticketId, userId, role } = data;
        
        // مغادرة جميع الغرف المخزنة
        userRooms.forEach(room => {
            socket.leave(room);
        });
        userRooms.clear();
        
        console.log(`المستخدم ${userId} غادر الغرفة ${ticketId}`);
    });

    socket.on('disconnect', () => {
        // مغادرة جميع الغرف عند قطع الاتصال
        userRooms.forEach(room => {
            socket.leave(room);
        });
        userRooms.clear();
        console.log('مستخدم غادر الاتصال');
    });
});

// تصدير io للاستخدام في الراوترز
app.set('io', io);

// إعداد mongoose
mongoose.set('strictQuery', true);

// إعدادات الخادم
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(cookieParser(process.env.SESSION_SECRET || 'lamasat-secret-key'));

// إعدادات الجلسة
app.use(session({
    secret: process.env.SESSION_SECRET || 'lamasat-secret-key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lamasat_boutique',
        ttl: 24 * 60 * 60,
        autoRemove: 'native'
    }),
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// إعدادات الرسائل
app.use(flash());

// استيراد الوسائط والراوترز
const auth = require('./middleware/auth');
const loadCategories = require('./middleware/categories');
const authRouter = require('./routes/auth');
const mainRouter = require('./routes/main');
const dashboardRouter = require('./routes/dashboard');
const ticketsRouter = require('./routes/tickets');
const apiRouter = require('./routes/api');

// الوسائط العامة
app.use(loadCategories);

// المتغيرات العامة
app.use((req, res, next) => {
    // متغيرات الجلسة
    res.locals.isAuthenticated = req.session.isAuthenticated || false;
    res.locals.currentUser = req.session.username || null;
    res.locals.userRole = req.session.role || null;
    
    // متغيرات الاتصال
    res.locals.contactPhone = process.env.CONTACT_PHONE || '0930125249';
    res.locals.whatsappNumber = process.env.WHATSAPP_NUMBER || '963930125249';
    
    // متغيرات افتراضية
    res.locals.currentPage = '';
    res.locals.title = 'لمسات بوتيك';
    
    // متغيرات الرسائل
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    
    next();
});

// إنشاء مجلد التحميلات إذا لم يكن موجوداً
const uploadDirs = ['public/uploads', 'public/uploads/products', 'public/uploads/categories', 'public/uploads/tickets'];
uploadDirs.forEach(dir => {
    const fullPath = path.join(__dirname, dir);
    if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
    }
});

// استخدام الراوترز
app.use('/auth', authRouter);
app.use('/', mainRouter);
app.use('/dashboard', auth.isAuthenticated, dashboardRouter);
app.use('/tickets', auth.isAuthenticated, ticketsRouter);

// راوتر API
app.use('/api', [
    (req, res, next) => {
        res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        next();
    }
], apiRouter);

// معالجة الصفحات غير الموجودة
app.use((req, res) => {
    res.status(404).render('404', {
        message: 'الصفحة غير موجودة',
        categories: [],
        currentPage: '404',
        title: 'صفحة غير موجودة'
    });
});

// معالجة الأخطاء
app.use((err, req, res, next) => {
    console.error(err.stack);
    
    res.status(500).render('error', {
        message: 'حدث خطأ في الخادم',
        error: process.env.NODE_ENV === 'development' ? err : {},
        categories: [],
        currentPage: 'error',
        title: 'خطأ في الخادم'
    });
});

// اتصال قاعدة البيانات
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lamasat_boutique')
    .then(() => console.log('تم الاتصال بقاعدة البيانات بنجاح'))
    .catch(err => console.error('خطأ في الاتصال بقاعدة البيانات:', err));

const PORT = process.env.PORT || 3018;
server.listen(PORT, () => {
    console.log(`الخادم يعمل على المنفذ ${PORT}`);
});

// تصدير app للاستخدام في الملفات الأخرى
module.exports = app;