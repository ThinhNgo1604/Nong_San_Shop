process.on("uncaughtException", (err) => {
    console.error("⚠️ Uncaught Exception:", err);
});
const express = require("express");
const app = express();

const cors = require("cors");

require("dotenv").config();

const { connectDB } = require("./config/db");

const createDefaultAdmin = require("./utils/createDefaultAdmin");
// Import Routes
const categoryRoutes = require("./routes/categoryRoutes");

const productRoutes = require('./routes/productRoutes');

const cartRoutes = require('./routes/cartRoutes');

const orderRoutes = require("./routes/orderRoutes");

const customerRoutes = require("./routes/customerRoutes");

const addressRoutes = require('./routes/addressRoutes');

const notificationRoutes = require("./routes/notificationRoutes");

const voucherRoutes = require("./routes/voucherRoutes");

const reviewRoutes = require("./routes/reviewRoutes");

const dashboardRoutes = require("./routes/dashboardRoutes");

const taskRoutes = require("./routes/taskRoutes");

const authRoutes = require("./routes/authRoutes");

const chatbotRoutes = require("./routes/chatbotRoutes");

const reportRoutes = require("./routes/reportRoutes");


// ===== MIDDLEWARE (luôn đặt cors() và express.json() TRƯỚC mọi route) =====
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Khởi tạo DB & Admin mặc định (chạy cả trên Serverless Vercel)
let initPromise = null;
app.use(async (req, res, next) => {
    if (!initPromise) {
        initPromise = (async () => {
            try {
                await connectDB();
                await createDefaultAdmin();
            } catch (err) {
                console.error("Init DB Error:", err);
            }
        })();
    }
    await initPromise;
    next();
});

// ===== ROUTES =====
app.use("/api/categories", categoryRoutes);
app.use("/api/auth", authRoutes); 
app.use('/api/products', productRoutes);

app.use('/api/cart', cartRoutes);

app.use("/api/orders", orderRoutes);

app.use("/api/customers", customerRoutes);

app.use('/api/addresses', addressRoutes);

app.use("/api/notifications", notificationRoutes);

app.use("/api/reviews", reviewRoutes);

app.use("/api/vouchers", voucherRoutes);

app.use("/api/dashboard", dashboardRoutes);

app.use("/api/report", reportRoutes);


app.use("/api/tasks", taskRoutes);

app.use("/api/chatbot", chatbotRoutes);

app.use("/api/momo", require("./routes/momoRoutes"));

app.use("/api/vietqr", require("./routes/vietqrRoutes"));

app.use("/api/sepay", require("./routes/sepayRoutes"));

// Test API
app.get("/", (req, res) => {
    res.json({
        message: "🚀 Server đang chạy thành công!"
    });
});

const PORT = process.env.BACKEND_PORT || 5000;

if (process.env.NODE_ENV !== "production" || require.main === module) {
    app.listen(PORT, async () => {
        console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);

        await connectDB();
        await createDefaultAdmin();
    });
}

module.exports = app;