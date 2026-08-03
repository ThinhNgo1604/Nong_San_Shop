function calculatePrice(product) {

    if (!product.TuDongGiamGia) {
        return product.GiaGoc;
    }

    const now = new Date();

    const hour =
        now.getHours() +
        now.getMinutes() / 60;

    const startHour = 7;

    const endHour = 21;

    let progress =
        (hour - startHour) /
        (endHour - startHour);

    progress = Math.max(0, Math.min(1, progress));

    const discount =
        product.GiamToiDa * progress;

    const finalPrice =
        product.GiaGoc *
        (1 - discount / 100);

    return Math.round(finalPrice);

}

module.exports = calculatePrice;