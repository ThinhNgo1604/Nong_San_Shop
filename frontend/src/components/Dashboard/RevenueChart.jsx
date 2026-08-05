import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

function RevenueChart({ chartData = [] }) {
    const data = {
        labels: (chartData || []).map(item => item.Ngay),
        datasets: [
            {
                label: "Doanh thu (VNĐ)",
                data: (chartData || []).map(item => item.DoanhThu),
                borderColor: "#198754",
                backgroundColor: "rgba(25, 135, 84, 0.15)",
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: "#198754",
                pointBorderColor: "#fff",
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 8,
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    font: { size: 13, weight: '600' }
                }
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        return ` Doanh thu: ${Number(context.raw || 0).toLocaleString('vi-VN')} đ`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function(value) {
                        return Number(value).toLocaleString('vi-VN') + ' đ';
                    }
                }
            }
        }
    };

    return (
        <div className="card shadow-sm border-0 mb-4">
            <div className="card-body">
                <h5 className="fw-bold mb-3 text-success d-flex align-items-center gap-2">
                    📈 Biểu đồ doanh thu (Sơ đồ dây)
                </h5>
                <div style={{ height: "350px", position: "relative" }}>
                    {chartData && chartData.length > 0 ? (
                        <Line data={data} options={options} />
                    ) : (
                        <div className="d-flex align-items-center justify-content-center h-100 text-muted">
                            Chưa có dữ liệu doanh thu trong khoảng thời gian này
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default RevenueChart;