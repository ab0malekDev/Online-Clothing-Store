const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const mongoose = require('mongoose');
const Ticket = require('../models/Ticket');
const { isAuthenticated, isOwner } = require('../middleware/auth');

// إعداد multer لرفع الملفات
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'public/uploads/tickets/');
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

// صفحة إنشاء تذكرة جديدة
router.get('/new', isAuthenticated, (req, res) => {
    res.render('tickets/new', {
        title: 'تفصيل فستان جديد'
    });
});

// إنشاء تذكرة جديدة
router.post('/', isAuthenticated, upload.array('attachments'), async (req, res) => {
    try {
        const ticket = new Ticket({
            user: req.session.userId,
            title: req.body.title,
            type: 'dress_design',
            measurements: {
                bust: req.body.measurements.bust,
                waist: req.body.measurements.waist,
                hips: req.body.measurements.hips,
                length: req.body.measurements.length,
                sleeves: req.body.measurements.sleeves,
                shoulders: req.body.measurements.shoulders,
                notes: req.body.measurements.notes
            },
            preferences: {
                color: req.body.preferences.color,
                style: req.body.preferences.style,
                fabric: req.body.preferences.fabric,
                notes: req.body.preferences.notes
            }
        });

        // إضافة الرسالة الأولى مع المرفقات
        const message = {
            sender: mongoose.Types.ObjectId(req.session.userId),
            content: 'تم إنشاء طلب تفصيل جديد'
        };

        if (req.files && req.files.length > 0) {
            message.attachments = req.files.map(file => ({
                url: '/uploads/tickets/' + file.filename,
                type: 'image'
            }));
        }

        // تعيين حالة الرد الأولية
        ticket.replyStatus = 'waiting_support';
        ticket.messages.push(message);

        await ticket.save();
        req.flash('success_msg', 'تم إنشاء طلب التفصيل بنجاح');
        res.redirect(`/tickets/${ticket._id}`);
    } catch (error) {
        console.error(error);
        // حذف الملفات المرفوعة في حالة حدوث خطأ
        if (req.files) {
            for (const file of req.files) {
                await fs.unlink(file.path).catch(() => {});
            }
        }
        req.flash('error_msg', 'حدث خطأ في إنشاء طلب التفصيل');
        res.redirect('/tickets/new');
    }
});

// عرض تذكرة محددة
router.get('/:id', isAuthenticated, async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id)
            .populate('user')
            .populate('assignedTo')
            .populate('order')
            .populate({
                path: 'messages.sender',
                model: 'User',
                select: '_id username role'
            })
            .populate({
                path: 'order',
                populate: {
                    path: 'products.product',
                    model: 'Product'
                }
            });

        if (!ticket) {
            req.flash('error_msg', 'التذكرة غير موجودة');
            return res.redirect('/orders');
        }

        // التحقق من الصلاحيات
        if (ticket.user._id.toString() !== req.session.userId && 
            !['admin', 'owner'].includes(req.session.role)) {
            req.flash('error_msg', 'غير مصرح لك بالوصول لهذه التذكرة');
            return res.redirect('/orders');
        }

        res.render('tickets/show', {
            title: ticket.title,
            ticket,
            userId: req.session.userId,
            userRole: req.session.role,
            getCountryCode: (country) => {
                const codes = {
                    'SY': '+963',
                    'LB': '+961',
                    'JO': '+962',
                    'EG': '+20',
                    'SA': '+966',
                    'AE': '+971',
                    'KW': '+965',
                    'QA': '+974',
                    'BH': '+973',
                    'OM': '+968',
                    'IQ': '+964'
                };
                return codes[country] || country;
            },
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
        req.flash('error_msg', 'حدث خطأ في عرض التذكرة');
        res.redirect('/orders');
    }
});

// إضافة رسالة جديدة
router.post('/:id/messages', isAuthenticated, upload.array('attachments'), async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);
        
        if (!ticket) {
            return res.status(404).json({ message: 'التذكرة غير موجودة' });
        }

        // التحقق من الصلاحيات
        const isAdmin = ['admin', 'owner'].includes(req.session.role);
        const isOwner = ticket.user.toString() === req.session.userId;

        // السماح للمشرفين والمالك والعميل صاحب التذكرة بإضافة رسائل
        if (!isAdmin && !isOwner) {
            return res.status(403).json({ message: 'غير مصرح لك بإضافة رسائل' });
        }

        // تحديث حالة الرد بناءً على دور المستخدم من الجلسة
        if (req.session.role === 'admin' || req.session.role === 'owner') {
            ticket.replyStatus = 'waiting_customer';
        } else {
            ticket.replyStatus = 'waiting_support';
        }

        try {
            // إضافة الرسالة الجديدة
            const message = {
                sender: mongoose.Types.ObjectId(req.session.userId), // تحويل ID إلى ObjectId
                content: req.body.content
            };

            // إضافة المرفقات إذا وجدت
            if (req.files && req.files.length > 0) {
                message.attachments = req.files.map(file => ({
                    url: '/uploads/tickets/' + file.filename,
                    type: 'image'
                }));
            }

            // تحديث حالة الرد
            if (req.session.role === 'admin' || req.session.role === 'owner') {
                ticket.replyStatus = 'waiting_customer';
            } else {
                ticket.replyStatus = 'waiting_support';
            }

            // حفظ الرسالة والتذكرة
            ticket.messages.push(message);
            await ticket.save();

            // جلب معلومات المرسل
            const populatedTicket = await Ticket.findById(ticket._id)
                .populate({
                    path: 'messages.sender',
                    model: 'User',
                    select: '_id username role'
                });

            const newMessage = populatedTicket.messages[populatedTicket.messages.length - 1];

            // إرسال الرسالة عبر Socket.IO
            const io = req.app.get('io');
            const messageData = {
                message: {
                    _id: newMessage._id,
                    content: newMessage.content,
                    sender: {
                        _id: req.session.userId,
                        username: req.session.username || req.session.email,
                        role: req.session.role
                    },
                    attachments: newMessage.attachments || [],
                    createdAt: newMessage.createdAt,
                    isRead: false
                },
                replyStatus: ticket.replyStatus,
                ticketId: ticket._id,
                senderRole: req.session.role
            };

            console.log('إرسال رسالة جديدة:', JSON.stringify(messageData, null, 2));
            
            // إرسال الرسالة لجميع المتصلين في غرفة التذكرة
            io.in(`ticket-${ticket._id}`).emit('chat-message', messageData);

            res.status(200).json({
                message: 'تم إضافة الرسالة بنجاح',
                data: {
                    message: newMessage,
                    replyStatus: ticket.replyStatus
                }
            });
        } catch (error) {
            console.error('خطأ في إضافة الرسالة:', error);
            throw error;
        }
    } catch (error) {
        console.error(error);
        // حذف الملفات المرفوعة في حالة حدوث خطأ
        if (req.files) {
            for (const file of req.files) {
                await fs.unlink(file.path).catch(() => {});
            }
        }
        res.status(500).json({ message: 'حدث خطأ في إضافة الرسالة' });
    }
});

// تحديث حالة التذكرة (للمشرفين فقط)
router.put('/:id/status', isAuthenticated, async (req, res) => {
    try {
        if (!['admin', 'owner'].includes(req.session.role)) {
            return res.status(403).json({ message: 'غير مصرح لك بتحديث حالة التذكرة' });
        }

        const ticket = await Ticket.findById(req.params.id);
        
        if (!ticket) {
            return res.status(404).json({ message: 'التذكرة غير موجودة' });
        }

        await ticket.updateStatus(req.body.status);
        res.status(200).json({ message: 'تم تحديث حالة التذكرة بنجاح' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'حدث خطأ في تحديث حالة التذكرة' });
    }
});

// حذف تذكرة (للمشرفين فقط)
router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        if (!['admin', 'owner'].includes(req.session.role)) {
            return res.status(403).json({ message: 'غير مصرح لك بحذف التذكرة' });
        }

        const ticket = await Ticket.findById(req.params.id);
        
        if (!ticket) {
            return res.status(404).json({ message: 'التذكرة غير موجودة' });
        }

        // حذف المرفقات
        for (const message of ticket.messages) {
            for (const attachment of message.attachments) {
                await fs.unlink('public' + attachment.url).catch(() => {});
            }
        }

        await ticket.deleteOne();
        res.status(200).json({ message: 'تم حذف التذكرة بنجاح' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'حدث خطأ في حذف التذكرة' });
    }
});

module.exports = router;