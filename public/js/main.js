document.addEventListener('DOMContentLoaded', function() {
    // تفعيل تأثير النافبار عند السكرول
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // تفعيل ظهور العناصر عند السكرول
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    // مراقبة العناوين
    document.querySelectorAll('.section-title').forEach(title => {
        observer.observe(title);
    });

    // مراقبة البطاقات
    document.querySelectorAll('.category-card, .product-card').forEach(card => {
        observer.observe(card);
    });

    // تأثيرات إضافية للروابط
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('mouseenter', function(e) {
            const icon = this.querySelector('.nav-icon');
            icon.style.transform = 'scale(1.2) rotate(10deg)';
        });

        link.addEventListener('mouseleave', function(e) {
            const icon = this.querySelector('.nav-icon');
            icon.style.transform = 'scale(1) rotate(0deg)';
        });
    });

    // تأثير الضغط على البطاقات
    document.querySelectorAll('.category-card, .product-card').forEach(card => {
        card.addEventListener('mousedown', function() {
            this.style.transform = 'scale(0.95)';
        });

        card.addEventListener('mouseup', function() {
            this.style.transform = 'scale(1)';
        });

        card.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    });

    // تأثير متحرك للأزرار
    document.querySelectorAll('button').forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
        });

        button.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });

    // تأثير الظهور التدريجي للصور
    document.querySelectorAll('img').forEach(img => {
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.5s ease';
        
        img.addEventListener('load', function() {
            this.style.opacity = '1';
        });
    });

    // تأثير حركة الورود مع حركة الماوس
    const flowers = document.querySelectorAll('.flower');
    document.addEventListener('mousemove', function(e) {
        const mouseX = e.clientX / window.innerWidth;
        const mouseY = e.clientY / window.innerHeight;

        flowers.forEach((flower, index) => {
            const speed = (index + 1) * 20;
            const x = (mouseX - 0.5) * speed;
            const y = (mouseY - 0.5) * speed;
            
            flower.style.transform = `translate(${x}px, ${y}px)`;
        });
    });
});