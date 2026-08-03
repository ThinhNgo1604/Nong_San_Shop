function calculatePrice(product) {
    if (!product) return 0;
    
    const giaGoc = Number(product.GiaGoc || product.DonGia) || 0;
    
    const isAutoDiscount = product.TuDongGiamGia === true || 
                           product.TuDongGiamGia === 1 || 
                           String(product.TuDongGiamGia) === "1" || 
                           String(product.TuDongGiamGia) === "true";

    if (!isAutoDiscount || !product.GiamToiDa || Number(product.GiamToiDa) <= 0) {
        return giaGoc;
    }

    const discountPercent = Number(product.GiamToiDa) || 0;
    const finalPrice = giaGoc * (1 - discountPercent / 100);

    return Math.round(finalPrice);
}

module.exports = calculatePrice;