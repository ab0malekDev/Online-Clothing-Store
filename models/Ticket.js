const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    attachments: [{
        url: {
            type: String,
            required: true
        },
        type: {
            type: String,
            enum: ['image', 'file'],
            default: 'image'
        }
    }],
    isRead: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

const ticketSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['dress_design', 'support', 'complaint', 'order'],
        default: 'dress_design'
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    },
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed', 'closed'],
        default: 'pending'
    },
    replyStatus: {
        type: String,
        enum: ['waiting_support', 'waiting_customer'],
        default: 'waiting_support'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    messages: [messageSchema],
    lastMessage: {
        type: Date,
        default: Date.now
    },
    measurements: {
        bust: Number,
        waist: Number,
        hips: Number,
        length: Number,
        sleeves: Number,
        shoulders: Number,
        notes: String
    },
    preferences: {
        color: String,
        style: String,
        fabric: String,
        notes: String
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    isArchived: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// تحديث وقت آخر رسالة عند إضافة رسالة جديدة
ticketSchema.pre('save', function(next) {
    if (this.messages && this.messages.length > 0) {
        this.lastMessage = this.messages[this.messages.length - 1].createdAt;
    }
    next();
});

// دالة مساعدة لإضافة رسالة جديدة
ticketSchema.methods.addMessage = async function(senderId, content, attachments = []) {
    const message = {
        sender: senderId,
        content
    };

    if (attachments && attachments.length > 0) {
        message.attachments = attachments.map(attachment => ({
            url: attachment.url,
            type: attachment.type
        }));
    }

    this.messages.push(message);

    // تحديث حالة الرد بناءً على المرسل
    const user = await mongoose.model('User').findById(senderId);
    if (user.role === 'admin' || user.role === 'owner') {
        this.replyStatus = 'waiting_customer';
    } else {
        this.replyStatus = 'waiting_support';
    }

    await this.save();
};

// دالة مساعدة لتحديث حالة التذكرة
ticketSchema.methods.updateStatus = async function(status) {
    this.status = status;
    await this.save();
};

// دالة مساعدة لتعيين مسؤول للتذكرة
ticketSchema.methods.assign = async function(adminId) {
    this.assignedTo = adminId;
    await this.save();
};

module.exports = mongoose.model('Ticket', ticketSchema);