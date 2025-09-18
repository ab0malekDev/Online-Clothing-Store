const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// الحصول على تفاصيل المنتج
router.get('/products/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('category')
            .select('-__v');

        if (!product) {
            return res.status(404).json({
                error: 'المنتج غير موجود',
                message: 'لم يتم العثور على المنتج المطلوب'
            });
        }

        // زيادة عدد المشاهدات
        await product.incrementViews();

        // الحصول على المنتجات المشابهة
        const similarProducts = await product.getSimilarProducts(3);

        res.json({
            product,
            similarProducts
        });
    } catch (error) {
        console.error('خطأ في الحصول على تفاصيل المنتج:', error);
        res.status(500).json({
            error: 'خطأ في الخادم',
            message: 'حدث خطأ أثناء جلب تفاصيل المنتج'
        });
    }
});

// البحث عن المنتجات
router.get('/products/search/:query', async (req, res) => {
    try {
        const products = await Product.searchProducts(req.params.query);
        res.json(products);
    } catch (error) {
        console.error('خطأ في البحث عن المنتجات:', error);
        res.status(500).json({
            error: 'خطأ في الخادم',
            message: 'حدث خطأ أثناء البحث عن المنتجات'
        });
    }
});

// الحصول على المنتجات حسب التصنيف
router.get('/categories/:id/products', async (req, res) => {
    try {
        const products = await Product.find({ category: req.params.id })
            .populate('category')
            .select('-__v');

        res.json(products);
    } catch (error) {
        console.error('خطأ في الحصول على منتجات التصنيف:', error);
        res.status(500).json({
            error: 'خطأ في الخادم',
            message: 'حدث خطأ أثناء جلب منتجات التصنيف'
        });
    }
});

// التحقق من حالة تسجيل الدخول
router.get('/auth/check', (req, res) => {
    res.json({
        isAuthenticated: !!req.session.userId,
        user: req.session.userId ? {
            id: req.session.userId,
            name: req.session.name,
            email: req.session.email
        } : null
    });
});

// الحصول على أحدث المنتجات
router.get('/products/latest/:limit', async (req, res) => {
    try {
        const limit = parseInt(req.params.limit) || 6;
        const products = await Product.find()
            .populate('category')
            .sort({ createdAt: -1 })
            .limit(limit)
            .select('-__v');

        res.json(products);
    } catch (error) {
        console.error('خطأ في الحصول على أحدث المنتجات:', error);
        res.status(500).json({
            error: 'خطأ في الخادم',
            message: 'حدث خطأ أثناء جلب أحدث المنتجات'
        });
    }
});

module.exports = router;