const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { validateLogin } = require('../middleware/auth');

// صفحة التسجيل الجديد
router.get('/register', (req, res) => {
    // إذا كان المستخدم مسجل الدخول بالفعل، توجيهه للوحة التحكم
    if (req.session.isAuthenticated) {
        return res.redirect('/dashboard');
    }

    res.render('auth/register', {
        title: 'تسجيل حساب جديد',
        error: req.flash('error')[0]
    });
});

// معالجة التسجيل الجديد
router.post('/register', async (req, res) => {
    try {
        const { email, username, password, confirmPassword, phone, address } = req.body;

        // التحقق من البيانات
        if (!email || !username || !password || !confirmPassword || !phone || !address) {
            req.flash('error', 'يرجى ملء جميع الحقول');
            return res.redirect('/auth/register');
        }

        // التحقق من رقم الهاتف
        if (!phone.country || !phone.number) {
            req.flash('error', 'يرجى إدخال رقم الهاتف والدولة');
            return res.redirect('/auth/register');
        }

        // التحقق من صحة البريد الإلكتروني
        const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
        if (!emailRegex.test(email)) {
            req.flash('error', 'يرجى إدخال بريد إلكتروني صحيح');
            return res.redirect('/auth/register');
        }

        // التحقق من تطابق كلمتي المرور
        if (password !== confirmPassword) {
            req.flash('error', 'كلمتا المرور غير متطابقتين');
            return res.redirect('/auth/register');
        }

        // التحقق من عدم وجود المستخدم أو البريد الإلكتروني
        const existingUser = await User.findOne({
            $or: [
                { username },
                { email }
            ]
        });
        
        if (existingUser) {
            if (existingUser.email === email) {
                req.flash('error', 'البريد الإلكتروني مستخدم بالفعل');
            } else {
                req.flash('error', 'اسم المستخدم موجود بالفعل');
            }
            return res.redirect('/auth/register');
        }

        // إنشاء مستخدم جديد
        const user = new User({
            email,
            username,
            password,
            phone: {
                country: phone.country,
                number: phone.number
            },
            address,
            role: 'normal',
            isActive: true
        });

        await user.save();

        req.flash('success_msg', 'تم إنشاء الحساب بنجاح، يمكنك الآن تسجيل الدخول');
        res.redirect('/auth/login');
    } catch (error) {
        console.error('خطأ في التسجيل:', error);
        req.flash('error', 'حدث خطأ أثناء إنشاء الحساب');
        res.redirect('/auth/register');
    }
});

// صفحة تسجيل الدخول
router.get('/login', (req, res) => {
    // إذا كان المستخدم مسجل الدخول بالفعل، توجيهه للوحة التحكم
    if (req.session.isAuthenticated) {
        return res.redirect('/dashboard');
    }

    res.render('auth/login', {
        title: 'تسجيل الدخول',
        error: req.flash('error')[0]
    });
});

// معالجة تسجيل الدخول
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // التحقق من البيانات
        if (!username || !password) {
            req.flash('error', 'يرجى إدخال اسم المستخدم وكلمة المرور');
            return res.redirect('/auth/login');
        }

        // التحقق من صحة بيانات تسجيل الدخول
        const result = await validateLogin(username, password);

        if (result.isValid) {
            // تخزين بيانات المستخدم في الجلسة
            req.session.isAuthenticated = true;
            req.session.username = result.user.username;
            req.session.role = result.user.role;
            req.session.userId = result.user._id;
            
            // رسالة ترحيب
            let welcomeMessage;
            if (result.user.role === 'owner') {
                welcomeMessage = 'مرحباً بك في لوحة التحكم (المالك)';
            } else if (result.user.role === 'admin') {
                welcomeMessage = 'مرحباً بك في لوحة التحكم';
            } else {
                welcomeMessage = 'مرحباً بك في متجر لمسات';
            }
            req.flash('success_msg', welcomeMessage);
            
            // توجيه المستخدم حسب نوع حسابه
            if (result.user.role === 'normal') {
                res.redirect('/');
            } else {
                res.redirect('/dashboard');
            }
        } else {
            req.flash('error', result.error);
            res.redirect('/auth/login');
        }
    } catch (error) {
        console.error('خطأ في تسجيل الدخول:', error);
        req.flash('error', 'حدث خطأ أثناء تسجيل الدخول');
        res.redirect('/auth/login');
    }
});

// تسجيل الخروج
router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/auth/login');
    });
});

module.exports = router;