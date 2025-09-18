document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('.product-form');
    const mainImageInput = document.querySelector('input[name="mainImage"]');
    const imagesInput = document.querySelector('input[name="images"]');
    
    // إضافة شريط التقدم
    const progressContainer = document.createElement('div');
    progressContainer.className = 'upload-progress';
    progressContainer.innerHTML = `
        <div class="progress" style="display: none;">
            <div class="progress-bar progress-bar-striped progress-bar-animated" 
                 role="progressbar" 
                 style="width: 0%">0%</div>
        </div>
        <div class="upload-status"></div>
    `;
    form.insertBefore(progressContainer, form.querySelector('.form-actions'));

    // معالجة تحميل الصور
    function handleImagePreview(input, previewContainer) {
        const files = input.files;
        if (!files.length) return;

        // إنشاء حاوية المعاينة إذا لم تكن موجودة
        let preview = previewContainer.querySelector('.image-preview');
        if (!preview) {
            preview = document.createElement('div');
            preview.className = 'image-preview';
            previewContainer.appendChild(preview);
        }
        preview.innerHTML = '';

        // عرض المعاينة لكل صورة
        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const div = document.createElement('div');
                div.className = 'preview-item';
                div.innerHTML = `
                    <img src="${e.target.result}" alt="معاينة">
                    <div class="preview-info">
                        <span class="filename">${file.name}</span>
                        <span class="filesize">${formatFileSize(file.size)}</span>
                    </div>
                `;
                preview.appendChild(div);
            };
            reader.readAsDataURL(file);
        });
    }

    // تنسيق حجم الملف
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // معالجة رفع الملفات
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const formData = new FormData(form);
        const progressBar = progressContainer.querySelector('.progress');
        const progressBarInner = progressBar.querySelector('.progress-bar');
        const statusDiv = progressContainer.querySelector('.upload-status');

        try {
            progressBar.style.display = 'block';
            statusDiv.textContent = 'جاري رفع الملفات...';
            
            const xhr = new XMLHttpRequest();
            xhr.open(form.method, form.action);

            xhr.upload.onprogress = function(e) {
                if (e.lengthComputable) {
                    const percentComplete = Math.round((e.loaded / e.total) * 100);
                    progressBarInner.style.width = percentComplete + '%';
                    progressBarInner.textContent = percentComplete + '%';
                }
            };

            xhr.onload = function() {
                if (xhr.status === 200 || xhr.status === 201) {
                    statusDiv.textContent = 'تم رفع الملفات بنجاح!';
                    progressBarInner.classList.remove('progress-bar-animated');
                    progressBarInner.classList.add('bg-success');
                    
                    // إعادة التوجيه بعد ثانيتين
                    setTimeout(() => {
                        window.location.href = '/dashboard';
                    }, 2000);
                } else {
                    throw new Error('فشل رفع الملفات');
                }
            };

            xhr.onerror = function() {
                throw new Error('حدث خطأ في الاتصال');
            };

            xhr.send(formData);
        } catch (error) {
            progressBar.style.display = 'none';
            statusDiv.textContent = 'حدث خطأ: ' + error.message;
            statusDiv.style.color = 'red';
        }
    });

    // معاينة الصور عند اختيارها
    if (mainImageInput) {
        mainImageInput.addEventListener('change', function() {
            handleImagePreview(this, this.parentElement);
        });
    }

    if (imagesInput) {
        imagesInput.addEventListener('change', function() {
            handleImagePreview(this, this.parentElement);
        });
    }
});

// التحقق من حجم وعدد الملفات
function validateFiles(input) {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const maxFiles = input.name === 'mainImage' ? 1 : 10;
    const files = input.files;

    if (files.length > maxFiles) {
        alert(`يمكنك اختيار ${maxFiles} ${maxFiles === 1 ? 'صورة فقط' : 'صور كحد أقصى'}`);
        input.value = '';
        return false;
    }

    for (let i = 0; i < files.length; i++) {
        if (files[i].size > maxSize) {
            alert(`الملف ${files[i].name} أكبر من 5MB`);
            input.value = '';
            return false;
        }
    }

    return true;
}

// إضافة الأنماط
const style = document.createElement('style');
style.textContent = `
.upload-progress {
    margin: 1rem 0;
}

.progress {
    height: 25px;
    border-radius: 15px;
    background-color: #f8f9fa;
    margin-bottom: 0.5rem;
}

.progress-bar {
    background-color: var(--primary-color);
    border-radius: 15px;
    transition: width 0.3s ease;
}

.upload-status {
    font-size: 0.9rem;
    color: var(--text-color);
    text-align: center;
}

.image-preview {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin-top: 1rem;
}

.preview-item {
    width: 150px;
    background: white;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.preview-item img {
    width: 100%;
    height: 100px;
    object-fit: cover;
}

.preview-info {
    padding: 0.5rem;
    font-size: 0.8rem;
}

.preview-info .filename {
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--text-color);
}

.preview-info .filesize {
    color: #6c757d;
}
`;

document.head.appendChild(style);