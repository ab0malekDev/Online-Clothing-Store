const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true
    },
    isMain: {
        type: Boolean,
        default: false
    },
    order: {
        type: Number,
        default: 0
    }
});

const productSchema = new mongoose.Schema({
    productId: {
        type: Number,
        unique: true,
        min: 1,
        validate: {
            validator: function(v) {
                return Number.isInteger(v) && v > 0 && !isNaN(v);
            },
            message: props => `${props.value} ليس رقماً صحيحاً موجباً`
        }
    },
    productCode: {
        type: String,
        unique: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        unique: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    isRental: {
        type: Boolean,
        default: false
    },
    rentalPrice: {
        type: Number,
        min: 0
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    mainImage: {
        type: String,
        required: true
    },
    images: [imageSchema],
    isAvailable: {
        type: Boolean,
        default: true
    },
    views: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// إنشاء رقم تسلسلي ورمز المنتج تلقائياً
productSchema.pre('save', async function(next) {
    try {
        if (!this.isNew) {
            return next();
        }

        // البحث عن آخر منتج وزيادة الرقم
        const count = await mongoose.model('Product').countDocuments();
        const nextId = count + 1;
        
        // إنشاء رمز المنتج
        this.productId = nextId;
        this.productCode = `P${String(nextId).padStart(4, '0')}`;

        // إنشاء slug من اسم المنتج
        if (this.name && !this.slug) {
            this.slug = this.name
                .toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^\w\-]+/g, '')
                .replace(/\-\-+/g, '-')
                .replace(/^-+/, '')
                .replace(/-+$/, '');
            
            // التحقق من تكرار الـ slug
            const slugRegEx = new RegExp(`^${this.slug}(-[0-9]*)?$`, 'i');
            const productsWithSlug = await mongoose.model('Product').find({ slug: slugRegEx });
            
            if (productsWithSlug.length) {
                this.slug = `${this.slug}-${productsWithSlug.length + 1}`;
            }
        }

        next();
    } catch (error) {
        next(error);
    }
});

module.exports = mongoose.model('Product', productSchema);