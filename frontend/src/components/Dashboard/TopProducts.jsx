import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

function TopProducts({ data = [] }) {
    const chartData = {
        labels: (data || []).map(x => x.TenSP),
        datasets: [
            {
                label: "Số lượng đã bán",
                data: (data || []).map(x => x.SoLuongBan),
                backgroundColor: [
                    "rgba(40, 167, 69, 0.85)",
                    "rgba(23, 162, 184, 0.85)",
                    "rgba(255, 193, 7, 0.85)",
                    "rgba(253, 126, 20, 0.85)",
                    "rgba(111, 66, 193, 0.85)"
                ],
                borderColor: [
                    "#28a745",
                    "#17a2b8",
                    "#ffc107",
                    "#fd7e14",
                    "#6f42c1"
                ],
                borderWidth: 1.5,
                borderRadius: 6,
                barPercentage: 0.55,
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        return ` Đã bán: ${context.raw} sản phẩm`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 1,
                    precision: 0
                }
            }
        }
    };

    return (
        <div className="card shadow-sm border-0 mb-4">
            <div className="card-body">
                <h5 className="fw-bold mb-3 text-primary d-flex align-items-center gap-2">
                    📊 Top 5 sản phẩm bán chạy (Dạng cột)
                </h5>
                <div style={{ height: "350px", position: "relative" }}>
                    {data && data.length > 0 ? (
                        <Bar data={chartData} options={options} />
                    ) : (
                        <div className="d-flex align-items-center justify-content-center h-100 text-muted">
                            Chưa có dữ liệu bán hàng trong khoảng thời gian này
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default TopProducts;