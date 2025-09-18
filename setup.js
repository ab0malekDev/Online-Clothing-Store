require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Category = require('./models/Category');
const fs = require('fs').promises;
const path = require('path');

// إنشاء مجلدات الصور
async function createImageDirectories() {
    const dirs = [
        'public/images/categories',
        'public/images/products',
        'public/uploads/categories',
        'public/uploads/products'
    ];

    for (const dir of dirs) {
        try {
            await fs.mkdir(path.join(__dirname, dir), { recursive: true });
            console.log(`تم إنشاء المجلد: ${dir}`);
        } catch (error) {
            if (error.code !== 'EEXIST') {
                console.error(`خطأ في إنشاء المجلد ${dir}:`, error);
            }
        }
    }
}

// إنشاء حساب الأدمن
async function createAdminUser() {
    try {
        const adminExists = await User.findOne({ username: process.env.ADMIN_USERNAME });
        
        if (adminExists) {
            console.log('حساب الأدمن موجود بالفعل');
            return;
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, salt);

        const admin = new User({
            username: process.env.ADMIN_USERNAME,
            password: hashedPassword,
            role: 'admin',
            isActive: true
        });

        await admin.save();
        console.log('تم إنشاء حساب الأدمن بنجاح');
    } catch (error) {
        console.error('خطأ في إنشاء حساب الأدمن:', error);
        throw error;
    }
}

// إنشاء الأقسام الأساسية
async function createDefaultCategories() {
    try {
        const categoriesExist = await Category.findOne();
        
        if (categoriesExist) {
            console.log('الأقسام موجودة بالفعل');
            return;
        }

        const categories = [
            {
                name: 'فساتين زفاف',
                description: 'تشكيلة متنوعة من فساتين الزفاف الفاخرة',
                icon: 'fas fa-female',
                image: '/images/categories/wedding.jpg',
                order: 1
            },
            {
                name: 'فساتين سهرة',
                description: 'فساتين سهرة عصرية وأنيقة',
                icon: 'fas fa-star',
                image: '/images/categories/evening.jpg',
                order: 2
            },
            {
                name: 'فساتين سوارية',
                description: 'فساتين سوارية مميزة لجميع المناسبات',
                icon: 'fas fa-gem',
                image: '/images/categories/soiree.jpg',
                order: 3
            }
        ];

        await Category.insertMany(categories);
        console.log('تم إنشاء الأقسام الأساسية بنجاح');
    } catch (error) {
        console.error('خطأ في إنشاء الأقسام:', error);
        throw error;
    }
}

// دالة الإعداد الرئيسية
async function setup() {
    try {
        // الاتصال بقاعدة البيانات
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lamasat_boutique');
        console.log('تم الاتصال بقاعدة البيانات بنجاح');

        // إنشاء المجلدات
        await createImageDirectories();

        // إنشاء حساب الأدمن
        await createAdminUser();

        // إنشاء الأقسام الأساسية
        await createDefaultCategories();

        console.log('تم إكمال عملية الإعداد بنجاح');
        process.exit(0);
    } catch (error) {
        console.error('حدث خطأ أثناء الإعداد:', error);
        process.exit(1);
    }
}

// تشغيل الإعداد
console.log('جاري إعداد النظام...');
setup();