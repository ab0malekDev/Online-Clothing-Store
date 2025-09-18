const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'اسم المستخدم مطلوب'],
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: [true, 'البريد الإلكتروني مطلوب'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'يرجى إدخال بريد إلكتروني صحيح']
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['normal', 'admin', 'owner'],
        default: 'normal'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    phone: {
        number: {
            type: String,
            required: [true, 'رقم الهاتف مطلوب']
        },
        country: {
            type: String,
            required: [true, 'الدولة مطلوبة']
        }
    },
    address: {
        type: String,
        required: [true, 'العنوان مطلوب'],
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    // إيقاف إضافة حقل id تلقائياً
    _id: true,
    id: false
});

// تشفير كلمة المرور قبل الحفظ
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// التحقق من كلمة المرور
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw error;
    }
};

module.exports = mongoose.model('User', userSchema);