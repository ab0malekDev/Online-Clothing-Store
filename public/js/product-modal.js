function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function showProductModal(productData) {
    const modal = document.getElementById('productModal');
    const modalInstance = new bootstrap.Modal(modal);
    const product = JSON.parse(decodeURIComponent(productData));

    // تحديث عنوان المنتج
    modal.querySelector('.modal-title').textContent = product.name;

    // تحديث الصورة الرئيسية
    const mainImage = modal.querySelector('#modalMainImage');
    mainImage.src = product.mainImage;
    mainImage.alt = product.name;

    // تحديث الصور المصغرة
    const thumbnailsContainer = modal.querySelector('#modalThumbnails');
    thumbnailsContainer.innerHTML = `
        <img src="${escapeHtml(product.mainImage)}" 
             alt="${escapeHtml(product.name)}" 
             class="thumbnail active"
             onclick="changeModalImage(this, '${escapeHtml(product.mainImage)}')">
    `;

    if (product.images && product.images.length > 0) {
        product.images.forEach(image => {
            thumbnailsContainer.innerHTML += `
                <img src="${escapeHtml(image.url)}" 
                     alt="${escapeHtml(product.name)}" 
                     class="thumbnail"
                     onclick="changeModalImage(this, '${escapeHtml(image.url)}')">
            `;
        });
    }

    // تحديث رمز المنتج
    modal.querySelector('.product-code').textContent = product.productCode;

    // تحديث القسم
    modal.querySelector('.product-category').innerHTML = `
        <i class="${escapeHtml(product.category.icon)}"></i>
        ${escapeHtml(product.category.name)}
    `;

    // تحديث الوصف
    modal.querySelector('.product-description').textContent = product.description;

    // تحديث السعر
    modal.querySelector('.price').textContent = `${product.price} ل.س`;

    // تحديث سعر الإيجار
    const rentalPriceElement = modal.querySelector('.rental-price');
    if (product.isRental && product.rentalPrice) {
        rentalPriceElement.innerHTML = `
            <span class="label">للإيجار:</span>
            ${product.rentalPrice} ل.س
        `;
        rentalPriceElement.style.display = 'block';
    } else {
        rentalPriceElement.style.display = 'none';
    }

    // تحديث الحالة
    modal.querySelector('.product-status').innerHTML = `
        <span class="status-badge ${product.isAvailable ? 'available' : 'unavailable'}">
            ${product.isAvailable ? 'متوفر' : 'غير متوفر'}
        </span>
    `;

    // تحديث روابط التواصل
    const whatsappLink = modal.querySelector('.btn-whatsapp');
    const whatsappMessage = encodeURIComponent(`استفسار عن ${product.name} (الرمز: ${product.productCode})`);
    whatsappLink.href = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

    const callLink = modal.querySelector('.btn-call');
    callLink.href = `tel:${contactPhone}`;

    // تحديث زر الطلب
    const orderButton = modal.querySelector('.btn-order');
    orderButton.dataset.productId = product._id;

    // عرض النافذة
    modalInstance.show();
}

// التحقق من حالة تسجيل الدخول ومعالجة الطلب
async function handleOrder(button) {
    const productId = button.dataset.productId;
    
    try {
        // التحقق من حالة تسجيل الدخول
        const response = await fetch('/api/auth/check', {
            credentials: 'include' // مهم لإرسال الكوكيز مع الطلب
        });
        const data = await response.json();
        
        if (data.isAuthenticated) {
            // إذا كان المستخدم مسجل دخول، قم بإنشاء الطلب
            window.location.href = `/orders/create/${productId}`;
        } else {
            // إذا لم يكن مسجل دخول، قم بتوجيهه لصفحة تسجيل الدخول
            window.location.href = `/auth/login?redirect=/orders/create/${productId}`;
        }
    } catch (error) {
        console.error('Error checking auth status:', error);
        alert('حدث خطأ أثناء معالجة الطلب. الرجاء المحاولة مرة أخرى.');
    }
}

function changeModalImage(thumbnail, src) {
    const mainImage = document.getElementById('modalMainImage');
    const thumbnails = document.querySelectorAll('#modalThumbnails .thumbnail');
    
    mainImage.src = src;
    thumbnails.forEach(t => t.classList.remove('active'));
    thumbnail.classList.add('active');
}