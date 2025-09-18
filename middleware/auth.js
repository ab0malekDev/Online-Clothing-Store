const bcrypt = require('bcryptjs');
const User = require('../models/User');

// التحقق من تسجيل الدخول
function isAuthenticated(req, res, next) {
    if (req.session && req.session.isAuthenticated) {
        return next();
    }
    res.redirect('/auth/login');
}

// التحقق من صلاحيات المالك
function isOwner(req, res, next) {
    if (req.session && req.session.isAuthenticated && req.session.role === 'owner') {
        return next();
    }
    res.status(403).render('error', {
        message: 'غير مصرح لك بالوصول',
        error: { status: 403 }
    });
}

// التحقق من صحة بيانات تسجيل الدخول
async function validateLogin(username, password) {
    try {
        // أولاً: التحقق من بيانات المستخدم المالك في .env
        if (username === process.env.OWNER_USERNAME && password === process.env.OWNER_PASSWORD) {
            return {
                isValid: true,
                user: {
                    username: process.env.OWNER_USERNAME,
                    role: 'owner'
                }
            };
        }

        // ثانياً: التحقق من المستخدمين في قاعدة البيانات
        const user = await User.findOne({
            $or: [
                { username },
                { email: username } // يمكن استخدام البريد الإلكتروني بدلاً من اسم المستخدم
            ]
        });
        
        if (!user) {
            return {
                isValid: false,
                error: 'اسم المستخدم أو كلمة المرور غير صحيحة'
            };
        }

        if (!user.isActive) {
            return {
                isValid: false,
                error: 'هذا الحساب غير نشط'
            };
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return {
                isValid: false,
                error: 'اسم المستخدم أو كلمة المرور غير صحيحة'
            };
        }

        return {
            isValid: true,
            user: {
                _id: user._id,
                username: user.username,
                role: user.role
            }
        };

    } catch (error) {
        console.error('خطأ في التحقق من المستخدم:', error);
        return {
            isValid: false,
            error: 'حدث خطأ في تسجيل الدخول'
        };
    }
}

module.exports = {
    isAuthenticated,
    isOwner,
    validateLogin
};