const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const Product = require('../models/Product');
const Category = require('../models/Category');
const User = require('../models/User');
const Ticket = require('../models/Ticket');
const { isAuthenticated, isOwner } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// إعداد multer لرفع الصور
// إعداد multer لرفع الصور
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        // تحديد المجلد حسب نوع الملف (منتجات أو أقسام)
        const uploadPath = file.fieldname.startsWith('category') ?
            'public/uploads/categories/' :
            'public/uploads/products/';
        cb(null, uploadPath);
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: function(req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb('Error: Images Only!');
        }
    }
});

// الصفحة الرئيسية للوحة التحكم
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const products = await Product.find().populate('category').sort({ createdAt: -1 });
        res.render('dashboard/index', {
            title: 'لوحة التحكم',
            currentPage: 'dashboard',
            products
        });
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'حدث خطأ في تحميل المنتجات');
        res.redirect('/');
    }
});

// صفحة إدارة المستخدمين (للمالك فقط)
router.get('/users', isAuthenticated, isOwner, async (req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 });
        res.render('dashboard/users', {
            title: 'إدارة المستخدمين',
            currentPage: 'users',
            users
        });
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'حدث خطأ في تحميل المستخدمين');
        res.redirect('/dashboard');
    }
});

// إضافة مستخدم جديد
router.post('/users', isAuthenticated, isOwner, async (req, res) => {
    try {
        const { username, password, isActive } = req.body;
        
        // التحقق من عدم تكرار اسم المستخدم
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            req.flash('error_msg', 'اسم المستخدم موجود بالفعل');
            return res.redirect('/dashboard/users');
        }

        // إنشاء مستخدم جديد
        const user = new User({
            username,
            password,
            isActive: isActive === 'on',
            role: 'admin'
        });
        
        await user.save();
        
        req.flash('success_msg', 'تم إضافة المستخدم بنجاح');
        res.redirect('/dashboard/users');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'حدث خطأ في إضافة المستخدم');
        res.redirect('/dashboard/users');
    }
});

// تعديل مستخدم
router.put('/users/:id', isAuthenticated, isOwner, async (req, res) => {
    try {
        const { username, password, isActive } = req.body;
        const user = await User.findById(req.params.id);
        
        if (!user) {
            req.flash('error_msg', 'المستخدم غير موجود');
            return res.redirect('/dashboard/users');
        }

        // التحقق من عدم تكرار اسم المستخدم
        const existingUser = await User.findOne({ username, _id: { $ne: user._id } });
        if (existingUser) {
            req.flash('error_msg', 'اسم المستخدم موجود بالفعل');
            return res.redirect('/dashboard/users');
        }

        // تحديث البيانات
        user.username = username;
        if (password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
        }
        user.isActive = isActive === 'on';
        
        await user.save();
        
        req.flash('success_msg', 'تم تحديث المستخدم بنجاح');
        res.redirect('/dashboard/users');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'حدث خطأ في تحديث المستخدم');
        res.redirect('/dashboard/users');
    }
});

// حذف مستخدم
router.delete('/users/:id', isAuthenticated, isOwner, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({ message: 'المستخدم غير موجود' });
        }

        if (user.role === 'owner') {
            return res.status(403).json({ message: 'لا يمكن حذف المستخدم المالك' });
        }

        await user.deleteOne();
        res.status(200).json({ message: 'تم حذف المستخدم بنجاح' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'حدث خطأ في حذف المستخدم' });
    }
});

// صفحة إدارة التذاكر
router.get('/tickets', isAuthenticated, isOwner, async (req, res) => {
    try {
        // جلب التذاكر مع فصل تذاكر الطلبات عن تذاكر التفصيل
        const [designTickets, orderTickets] = await Promise.all([
            Ticket.find({ type: 'dress_design' })
                .populate('user')
                .populate('assignedTo')
                .sort('-lastMessage'),
            Ticket.find({ type: 'order' })
                .populate('user')
                .populate('order')
                .populate('assignedTo')
                .sort('-lastMessage')
        ]);

        res.render('dashboard/tickets', {
            title: 'إدارة التذاكر',
            currentPage: 'tickets',
            designTickets,
            orderTickets,
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
        console.error(error);
        req.flash('error_msg', 'حدث خطأ في تحميل التذاكر');
        res.redirect('/dashboard');
    }
});

// صفحة إدارة الأقسام
router.get('/categories', isAuthenticated, isOwner, async (req, res) => {
    try {
        const categories = await Category.find().sort('order');
        res.render('dashboard/categories', {
            title: 'إدارة الأقسام',
            currentPage: 'categories',
            categories
        });
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'حدث خطأ في تحميل الأقسام');
        res.redirect('/dashboard');
    }
});

// صفحة إضافة قسم جديد
router.get('/categories/add', isAuthenticated, isOwner, async (req, res) => {
    res.render('dashboard/category-form', {
        title: 'إضافة قسم جديد',
        currentPage: 'add-category',
        category: null
    });
});

// إضافة قسم جديد
router.post('/categories', isAuthenticated, isOwner, upload.single('image'), async (req, res) => {
    try {
        const { name, description, icon, order } = req.body;
        
        // إنشاء slug من الاسم
        const slug = name
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '');
        
        // التحقق من عدم تكرار الـ slug
        const existingCategory = await Category.findOne({ slug });
        if (existingCategory) {
            req.flash('error_msg', 'يوجد قسم بنفس الاسم بالفعل');
            return res.redirect('/dashboard/categories/add');
        }

        const category = new Category({
            name,
            slug,
            description,
            icon: icon || 'fas fa-folder',
            order: order || 0,
            image: req.file ? '/uploads/categories/' + req.file.filename : undefined
        });

        await category.save();
        req.flash('success_msg', 'تم إضافة القسم بنجاح');
        res.redirect('/dashboard/categories');
    } catch (error) {
        console.error(error);
        if (req.file) {
            await fs.unlink('public/uploads/categories/' + req.file.filename).catch(() => {});
        }
        req.flash('error_msg', 'حدث خطأ في إضافة القسم');
        res.redirect('/dashboard/categories/add');
    }
});

// صفحة تعديل قسم
router.get('/categories/:id/edit', isAuthenticated, isOwner, async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        
        if (!category) {
            req.flash('error_msg', 'القسم غير موجود');
            return res.redirect('/dashboard/categories');
        }

        res.render('dashboard/category-form', {
            title: 'تعديل قسم',
            currentPage: 'edit-category',
            category
        });
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'حدث خطأ في تحميل القسم');
        res.redirect('/dashboard/categories');
    }
});

// تحديث قسم
router.put('/categories/:id', isAuthenticated, isOwner, upload.single('image'), async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        
        if (!category) {
            req.flash('error_msg', 'القسم غير موجود');
            return res.redirect('/dashboard/categories');
        }

        const { name, description, icon, order } = req.body;
        
        // تحديث slug فقط إذا تغير الاسم
        if (name !== category.name) {
            const slug = name
                .toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^\w\-]+/g, '')
                .replace(/\-\-+/g, '-')
                .replace(/^-+/, '')
                .replace(/-+$/, '');
            
            const existingCategory = await Category.findOne({
                slug,
                _id: { $ne: category._id }
            });
            
            if (existingCategory) {
                req.flash('error_msg', 'يوجد قسم بنفس الاسم بالفعل');
                return res.redirect(`/dashboard/categories/${category._id}/edit`);
            }
            
            category.slug = slug;
        }

        category.name = name;
        category.description = description;
        category.icon = icon || 'fas fa-folder';
        category.order = order || 0;

        if (req.file) {
            if (category.image) {
                await fs.unlink('public' + category.image).catch(() => {});
            }
            category.image = '/uploads/categories/' + req.file.filename;
        }

        await category.save();
        req.flash('success_msg', 'تم تحديث القسم بنجاح');
        res.redirect('/dashboard/categories');
    } catch (error) {
        console.error(error);
        if (req.file) {
            await fs.unlink('public/uploads/categories/' + req.file.filename).catch(() => {});
        }
        req.flash('error_msg', 'حدث خطأ في تحديث القسم');
        res.redirect('/dashboard/categories');
    }
});

// حذف قسم
router.delete('/categories/:id', isAuthenticated, isOwner, async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        
        if (!category) {
            return res.status(404).json({ message: 'القسم غير موجود' });
        }

        // التحقق من عدم وجود منتجات مرتبطة بالقسم
        const productsCount = await Product.countDocuments({ category: category._id });
        if (productsCount > 0) {
            return res.status(400).json({
                message: 'لا يمكن حذف القسم لوجود منتجات مرتبطة به'
            });
        }

        if (category.image) {
            await fs.unlink('public' + category.image).catch(() => {});
        }

        await category.deleteOne();
        res.status(200).json({ message: 'تم حذف القسم بنجاح' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'حدث خطأ في حذف القسم' });
    }
});

// صفحة إضافة منتج
router.get('/products/add', isAuthenticated, async (req, res) => {
    try {
        const categories = await Category.find();
        res.render('dashboard/product-form', {
            title: 'إضافة منتج',
            currentPage: 'add-product',
            categories,
            product: null
        });
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'حدث خطأ في تحميل الأقسام');
        res.redirect('/dashboard');
    }
});

// إضافة منتج جديد
router.post('/products', isAuthenticated, upload.fields([
    { name: 'mainImage', maxCount: 1 },
    { name: 'images', maxCount: 8 }
]), async (req, res) => {
    try {
        const product = new Product({
            name: req.body.name,
            description: req.body.description,
            price: req.body.price,
            category: req.body.category,
            isRental: req.body.isRental === 'on',
            rentalPrice: req.body.rentalPrice,
            isAvailable: req.body.isAvailable === 'on',
            mainImage: req.files.mainImage ? '/uploads/products/' + req.files.mainImage[0].filename : undefined,
            images: req.files.images ? req.files.images.map((file, index) => ({
                url: '/uploads/products/' + file.filename,
                isMain: false,
                order: index
            })) : []
        });

        await product.validate();
        await product.save();

        req.flash('success_msg', 'تم إضافة المنتج بنجاح');
        res.redirect('/dashboard');
    } catch (error) {
        console.error('خطأ في إضافة منتج:', error);

        // حذف الصور المرفوعة في حالة حدوث خطأ
        if (req.files) {
            if (req.files.mainImage) {
                await fs.unlink('public/uploads/products/' + req.files.mainImage[0].filename).catch(() => {});
            }
            if (req.files.images) {
                for (const file of req.files.images) {
                    await fs.unlink('public/uploads/products/' + file.filename).catch(() => {});
                }
            }
        }

        let errorMsg = 'حدث خطأ في إضافة المنتج';
        
        if (error.code === 11000) {
            if (error.keyPattern.productId) {
                errorMsg = 'رقم المنتج مستخدم بالفعل';
            } else if (error.keyPattern.productCode) {
                errorMsg = 'رمز المنتج مستخدم بالفعل';
            }
        }
        else if (error.name === 'ValidationError') {
            errorMsg = Object.values(error.errors).map(err => err.message).join(', ');
        }

        req.flash('error_msg', errorMsg);
        res.redirect('/dashboard/products/add');
    }
});

// صفحة تعديل منتج
router.get('/products/:id/edit', isAuthenticated, async (req, res) => {
    try {
        const [product, categories] = await Promise.all([
            Product.findById(req.params.id).populate('category'),
            Category.find()
        ]);

        if (!product) {
            req.flash('error_msg', 'المنتج غير موجود');
            return res.redirect('/dashboard');
        }

        res.render('dashboard/product-form', {
            title: 'تعديل منتج',
            currentPage: 'edit-product',
            categories,
            product
        });
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'حدث خطأ في تحميل المنتج');
        res.redirect('/dashboard');
    }
});

// تحديث منتج
router.put('/products/:id', isAuthenticated, upload.fields([
    { name: 'mainImage', maxCount: 1 },
    { name: 'images', maxCount: 8 }
]), async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            req.flash('error_msg', 'المنتج غير موجود');
            return res.redirect('/dashboard');
        }

        // تحديث البيانات الأساسية
        Object.assign(product, {
            ...req.body,
            isRental: req.body.isRental === 'on',
            isAvailable: req.body.isAvailable === 'on'
        });

        // تحديث الـ slug إذا تغير الاسم
        if (product.name !== req.body.name) {
            const newSlug = req.body.name
                .toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^\w\-]+/g, '')
                .replace(/\-\-+/g, '-')
                .replace(/^-+/, '')
                .replace(/-+$/, '');
            
            // التحقق من تكرار الـ slug
            const slugRegEx = new RegExp(`^${newSlug}(-[0-9]*)?$`, 'i');
            const productsWithSlug = await Product.find({
                slug: slugRegEx,
                _id: { $ne: product._id }
            });
            
            product.slug = productsWithSlug.length ?
                `${newSlug}-${productsWithSlug.length + 1}` :
                newSlug;
        }

        if (req.files.mainImage) {
            if (product.mainImage) {
                await fs.unlink('public' + product.mainImage).catch(() => {});
            }
            product.mainImage = '/uploads/products/' + req.files.mainImage[0].filename;
        }

        if (req.files.images) {
            const newImages = req.files.images.map((file, index) => ({
                url: '/uploads/products/' + file.filename,
                isMain: false,
                order: product.images.length + index
            }));
            product.images.push(...newImages);
        }

        await product.save();
        req.flash('success_msg', 'تم تحديث المنتج بنجاح');
        res.redirect('/dashboard');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'حدث خطأ في تحديث المنتج');
        res.redirect('/dashboard');
    }
});

// حذف منتج
router.delete('/products/:id', isAuthenticated, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({ message: 'المنتج غير موجود' });
        }

        if (product.mainImage) {
            await fs.unlink('public' + product.mainImage).catch(() => {});
        }
        
        for (const image of product.images) {
            await fs.unlink('public' + image.url).catch(() => {});
        }

        await product.deleteOne();
        res.status(200).json({ message: 'تم حذف المنتج بنجاح' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'حدث خطأ في حذف المنتج' });
    }
});

// حذف صورة من منتج
router.delete('/products/images/:productId/:imageId', isAuthenticated, async (req, res) => {
    try {
        const product = await Product.findById(req.params.productId);
        
        if (!product) {
            return res.status(404).json({ message: 'المنتج غير موجود' });
        }

        const image = product.images.id(req.params.imageId);
        
        if (!image) {
            return res.status(404).json({ message: 'الصورة غير موجودة' });
        }

        await fs.unlink('public' + image.url).catch(() => {});
        image.deleteOne();
        await product.save();

        res.status(200).json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'حدث خطأ في حذف الصورة' });
    }
});

module.exports = router;