// عرض رسائل النظام
function showSystemMessages(messages) {
    if (messages.success) {
        Swal.fire({
            icon: 'success',
            title: 'نجاح',
            text: messages.success,
            timer: 3000,
            timerProgressBar: true,
            showConfirmButton: false
        });
    }

    if (messages.error) {
        Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: messages.error,
            confirmButtonText: 'حسناً'
        });
    }
}

// تفعيل tooltips
function initTooltips() {
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

// تهيئة النظام
document.addEventListener('DOMContentLoaded', function() {
    initTooltips();
});