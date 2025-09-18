require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('./models/Category');

// اتصال بقاعدة البيانات
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('تم الاتصال بقاعدة البيانات بنجاح'))
    .catch(err => console.error('خطأ في الاتصال بقاعدة البيانات:', err));

// بيانات الأقسام الثابتة
const defaultCategories = [
    {
        name: 'اعراس',
        slug: 'اعراس',
        description: 'كل ما يخص الاعراس من ديكورات وتجهيزات',
        icon: 'fas fa-gem',
        image: '/images/defaults/categories/wedding.jpg',
        order: 1
    },
    {
        name: 'سهرة',
        slug: 'سهرة',
        description: 'فساتين وأزياء السهرة',
        icon: 'fas fa-feather-alt',
        order: 2
    },
    {
        name: 'سبورات',
        slug: 'سبورات',
        description: 'ملابس وأزياء رياضية',
        icon: 'fas fa-running',
        order: 3
    }
];

// إنشاء أو تحديث الأقسام
async function createCategories() {
    try {
        for (const category of defaultCategories) {
            // تحديث القسم إذا كان موجوداً أو إنشاء قسم جديد
            const updatedCategory = await Category.findOneAndUpdate(
                { slug: category.slug },
                category,
                { upsert: true, new: true }
            );
            
            if (updatedCategory) {
                console.log(`تم تحديث/إنشاء قسم ${category.name} بنجاح`);
            }
        }

        // حذف الأقسام غير الموجودة في القائمة الافتراضية
        const defaultSlugs = defaultCategories.map(cat => cat.slug);
        await Category.deleteMany({ slug: { $nin: defaultSlugs } });
        console.log('تم حذف الأقسام غير المستخدمة');

    } catch (error) {
        console.error('خطأ في تحديث الأقسام:', error);
    }
}

// تنفيذ العمليات
async function seed() {
    try {
        await createCategories();
    } catch (error) {
        console.error('خطأ في عملية التهيئة:', error);
    } finally {
        mongoose.connection.close();
        console.log('تم إغلاق الاتصال بقاعدة البيانات');
    }
}

// إضافة إعداد strictQuery لتجنب التحذير
mongoose.set('strictQuery', true);

seed();