document.addEventListener('DOMContentLoaded', function() {
    const formatter = new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: 2
    });

    document.querySelectorAll('.formatted-price').forEach(element => {
        const price = parseFloat(element.dataset.price);
        element.textContent = formatter.format(price);
    });
});