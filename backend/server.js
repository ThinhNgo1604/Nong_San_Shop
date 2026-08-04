process.on("uncaughtException", (err) => {
    console.error("⚠️ Uncaught Exception:", err);
});
const express = require("express");
const path = require("path");
const { createServer: createViteServer } = require("vite");
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

const app = express();

// ===== MIDDLEWARE (luôn đặt cors() và express.json() TRƯỚC mọi route) =====
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

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

app.get("/api", (req, res) => {
    res.json({
        message: "🚀 Server API đang chạy thành công!"
    });
});

// Global Error Handler for API
app.use("/api", (err, req, res, next) => {
    console.error("Server Error:", err);
    res.status(err.status || 500).json({
        message: err.message || "Lỗi hệ thống không xử lý được",
        error: process.env.NODE_ENV === "development" ? err : {}
    });
});

async function startServer() {
    if (process.env.NODE_ENV !== "production") {
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: "spa",
            root: path.resolve(__dirname, "../frontend")
        });
        app.use(vite.middlewares);
    } else {
        const distPath = path.resolve(__dirname, "../dist");
        app.use(express.static(distPath));
        app.get("*", (req, res) => {
            res.sendFile(path.join(distPath, "index.html"));
        });
    }

    const PORT = 3000;
    app.listen(PORT, "0.0.0.0", async () => {
        console.log(`🚀 Server đang chạy tại: http://0.0.0.0:${PORT}`);
        await connectDB();
        await createDefaultAdmin();
    });
}

startServer();

module.exports = app;