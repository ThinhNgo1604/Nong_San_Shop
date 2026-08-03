const fs = require('fs');
const path = require('path');
const { db, collection, doc, setDoc } = require('./firebase');

async function importSqlToFirebase(sqlFilePath) {
    try {
        const resolvedPath = path.resolve(sqlFilePath);
        if (!fs.existsSync(resolvedPath)) {
            console.error(`❌ Không tìm thấy file: ${resolvedPath}`);
            console.log(`💡 Vui lòng copy file NongSanDB.sql vào thư mục gốc dự án hoặc thư mục backend!`);
            return;
        }

        console.log(`📖 Đang đọc file SQL từ: ${resolvedPath}`);
        const sqlContent = fs.readFileSync(resolvedPath, 'utf8');

        // Regex tìm các câu lệnh INSERT INTO
        // Ví dụ: INSERT [dbo].[SanPham] ([MaSP], [TenSP], [DonGia]) VALUES (1, N'Táo Envy', 85000)
        const insertRegex = /INSERT\s+(?:INTO\s+)?\[?(?:dbo\.)?([a-zA-Z0-9_]+)\]?\s*\(([^)]+)\)\s*VALUES\s*\((.+)\);?/gi;

        let match;
        let totalInserted = 0;
        const countsByTable = {};

        while ((match = insertRegex.exec(sqlContent)) !== null) {
            const tableName = match[1].replace(/[\[\]']/g, '').trim();
            const columnsStr = match[2];
            const valuesStr = match[3];

            // Parse danh sách cột
            const columns = columnsStr.split(',').map(c => c.replace(/[\[\]'\s]/g, '').trim());

            // Parse danh sách giá trị (xử lý đơn giản chuỗi, số, NULL, N'text')
            // Match values separating by comma, respecting quotes
            const rawValues = [];
            let currentVal = '';
            let inQuotes = false;
            let quoteChar = '';

            for (let i = 0; i < valuesStr.length; i++) {
                const char = valuesStr[i];
                if ((char === "'" || char === '"') && (i === 0 || valuesStr[i - 1] !== '\\')) {
                    if (!inQuotes) {
                        inQuotes = true;
                        quoteChar = char;
                    } else if (char === quoteChar) {
                        inQuotes = false;
                    } else {
                        currentVal += char;
                    }
                } else if (char === ',' && !inQuotes) {
                    rawValues.push(currentVal.trim());
                    currentVal = '';
                } else {
                    currentVal += char;
                }
            }
            if (currentVal.trim()) {
                rawValues.push(currentVal.trim());
            }

            // Clean values
            const cleanValues = rawValues.map(val => {
                let v = val.trim();
                if (v.toUpperCase() === 'NULL') return null;
                if (v.toUpperCase() === 'CAST(1 AS BIT)' || v.toUpperCase() === '1') return true;
                if (v.toUpperCase() === 'CAST(0 AS BIT)' || v.toUpperCase() === '0') return false;
                // Strip leading N' and trailing '
                if (v.startsWith("N'") && v.endsWith("'")) return v.slice(2, -1);
                if (v.startsWith("'") && v.endsWith("'")) return v.slice(1, -1);
                if (!isNaN(v) && v !== '') return Number(v);
                return v;
            });

            // Ghép thành record
            const record = {};
            columns.forEach((col, idx) => {
                record[col] = cleanValues[idx] !== undefined ? cleanValues[idx] : null;
            });

            // Xác định Document ID (ví dụ: MaSP, MaDM, MaTK...)
            const primaryKey = columns.find(c => /^Ma[A-Z0-9]+/i.test(c)) || columns[0];
            const docId = record[primaryKey] ? String(record[primaryKey]) : doc(collection(db, tableName)).id;

            // Lưu lên Firestore
            await setDoc(doc(db, tableName, docId), record, { merge: true });

            countsByTable[tableName] = (countsByTable[tableName] || 0) + 1;
            totalInserted++;
        }

        console.log(`\n🎉 Nạp dữ liệu SQL lên Firebase Firestore thành công! (Tổng số record: ${totalInserted})`);
        console.table(countsByTable);
    } catch (err) {
        console.error('❌ Lỗi khi nạp SQL:', err);
    }
}

// Chạy trực tiếp nếu gọi từ command line
if (require.main === module) {
    const args = process.argv.slice(2);
    const sqlFile = args[0] || path.join(__dirname, '../NongSanDB.sql');
    importSqlToFirebase(sqlFile);
}

module.exports = importSqlToFirebase;
