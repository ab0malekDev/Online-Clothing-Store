const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const Order = require('../models/Order');
const Ticket = require('../models/Ticket');

// صفحة الطلبات للمستخدمين
router.get('/orders', isAuthenticated, async (req, res) => {
    try {
        // التأكد من أن المستخدم ليس مسؤولاً
        if (req.session.role === 'admin' || req.session.role === 'owner') {
            return res.redirect('/dashboard');
        }

        // جلب طلبات وتذاكر المستخدم
        const [orders, tickets] = await Promise.all([
            Order.find({ user: req.session.userId })
                .populate('products.product')
                .sort({ createdAt: -1 }),
            Ticket.find({
                user: req.session.userId,
                $or: [
                    { type: 'dress_design' },
                    { type: 'order' }
                ]
            })
            .populate('order')
            .sort({ createdAt: -1 })
        ]);

        res.render('orders/index', {
            title: 'طلباتي',
            currentPage: 'orders',
            orders,
            tickets,
            getStatusText: (status) => {
                switch (status) {
                    case 'pending':
                        return 'قيد المراجعة';
                    case 'approved':
                        return 'تمت الموافقة';
                    case 'rejected':
                        return 'مرفوض';
                    case 'completed':
                        return 'مكتمل';
                    default:
                        return status;
                }
            },
            getTicketBadgeClass: (status) => {
                switch (status) {
                    case 'pending':
                        return 'badge-warning';
                    case 'in_progress':
                        return 'badge-primary';
                    case 'completed':
                        return 'badge-success';
                    case 'closed':
                        return 'badge-secondary';
                    default:
                        return 'badge-secondary';
                }
            },
            getTicketStatusText: (status) => {
                switch (status) {
                    case 'pending':
                        return 'في انتظار الرد';
                    case 'in_progress':
                        return 'قيد التنفيذ';
                    case 'completed':
                        return 'مكتمل';
                    case 'closed':
                        return 'مغلق';
                    default:
                        return status;
                }
            }
        });
    } catch (error) {
        console.error('خطأ في عرض الطلبات:', error);
        req.flash('error_msg', 'حدث خطأ في عرض الطلبات');
        res.redirect('/');
    }
});
const Product = require('../models/Product');
const Category = require('../models/Category');

// الصفحة الرئيسية
router.get('/', async (req, res) => {
    try {
        const [products, categories] = await Promise.all([
            Product.find().populate('category').sort('-createdAt').limit(6),
            Category.find().sort('order')
        ]);

        res.render('home', {
            title: 'الرئيسية',
            products,
            categories,
            currentPage: 'home',
            contactPhone: process.env.CONTACT_PHONE,
            whatsappNumber: process.env.WHATSAPP_NUMBER
        });
    } catch (error) {
        console.error('خطأ في تحميل الصفحة الرئيسية:', error);
        res.render('error', {
            message: 'حدث خطأ في تحميل الصفحة',
            error: { status: 500 }
        });
    }
});

// صفحة القسم
router.get('/category/:slug', async (req, res) => {
    try {
        const category = await Category.findOne({ slug: req.params.slug });
        if (!category) {
            return res.render('404', {
                title: 'القسم غير موجود',
                currentPage: 'category'
            });
        }

        const products = await Product.find({ category: category._id }).populate('category');

        res.render('category', {
            title: category.name,
            category,
            products,
            currentPage: 'category'
        });
    } catch (error) {
        console.error('خطأ في تحميل صفحة القسم:', error);
        res.render('error', {
            message: 'حدث خطأ في تحميل الصفحة',
            error: { status: 500 }
        });
    }
});

// صفحة المنتج
router.get('/product/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('category');
        if (!product) {
            return res.render('404', {
                title: 'المنتج غير موجود',
                currentPage: 'product'
            });
        }

        // زيادة عدد المشاهدات
        product.views = (product.views || 0) + 1;
        await product.save();

        // جلب منتجات مشابهة
        const relatedProducts = await Product.find({
            category: product.category,
            _id: { $ne: product._id }
        })
        .populate('category')
        .limit(3);

        res.render('product-details', {
            title: product.name,
            product,
            relatedProducts,
            currentPage: 'product'
        });
    } catch (error) {
        console.error('خطأ في تحميل صفحة المنتج:', error);
        res.render('error', {
            message: 'حدث خطأ في تحميل الصفحة',
            error: { status: 500 }
        });
    }
});

// صفحة البحث
router.get('/search', async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) {
            return res.redirect('/');
        }

        const products = await Product.find({
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } },
                { productCode: { $regex: query, $options: 'i' } }
            ]
        }).populate('category');

        res.render('search', {
            title: 'نتائج البحث',
            query,
            products,
            currentPage: 'search'
        });
    } catch (error) {
        console.error('خطأ في البحث:', error);
        res.render('error', {
            message: 'حدث خطأ في البحث',
            error: { status: 500 }
        });
    }
});

// إنشاء طلب جديد
router.get('/orders/create/:productId', isAuthenticated, async (req, res) => {
    try {
        // جلب المنتج مع التحقق من توفره
        const product = await Product.findById(req.params.productId);
        if (!product) {
            req.flash('error_msg', 'المنتج غير موجود');
            return res.redirect('/');
        }

        if (!product.isAvailable) {
            req.flash('error_msg', 'عذراً، هذا المنتج غير متوفر حالياً');
            return res.redirect('/');
        }

        // إنشاء طلب جديد
        const order = new Order({
            user: req.session.userId,
            products: [{
                product: product._id,
                quantity: 1,
                price: product.price,
                isRental: false
            }],
            totalPrice: product.price,
            status: 'pending'
        });

        await order.save();

        // إنشاء تذكرة مرتبطة بالطلب
        const ticket = new Ticket({
            user: req.session.userId,
            title: `طلب ${product.name} (${product.productCode})`,
            type: 'order',
            order: order._id,
            messages: [{
                sender: req.session.userId,
                content: `تم إنشاء طلب جديد للمنتج: ${product.name}\nالسعر: ${product.price} ل.س`
            }]
        });

        await ticket.save();

        req.flash('success_msg', 'تم إنشاء الطلب بنجاح');
        res.redirect('/orders');
    } catch (error) {
        console.error('خطأ في إنشاء الطلب:', error);
        req.flash('error_msg', 'حدث خطأ في إنشاء الطلب');
        res.redirect('/');
    }
});

module.exports = router;