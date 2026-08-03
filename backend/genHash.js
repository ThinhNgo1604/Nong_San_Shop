const bcrypt = require("bcryptjs");

// Đổi "123456" thành mật khẩu bạn muốn đặt cho tài khoản Admin
const plainPassword = "123456";

bcrypt.hash(plainPassword, 10).then((hash) => {
    console.log("Mật khẩu gốc:", plainPassword);
    console.log("Mật khẩu đã hash:", hash);
});