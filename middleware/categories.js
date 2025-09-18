const Category = require('../models/Category');

async function loadCategories(req, res, next) {
    try {
        const categories = await Category.find().sort('order');
        res.locals.categories = categories;
        next();
    } catch (error) {
        console.error('خطأ في تحميل الأقسام:', error);
        res.locals.categories = [];
        next();
    }
}

module.exports = loadCategories;