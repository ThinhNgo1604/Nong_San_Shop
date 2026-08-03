const taskModel = require("../models/taskModel");

// GET /api/tasks/status
// Trả về danh sách nhiệm vụ kèm trạng thái: 'locked' | 'available' | 'claimed'
const getTaskStatus = async (req, res) => {
    try {
        const { maTK } = req.user;
        const maKH = await taskModel.getMaKHByMaTK(maTK);

        if (!maKH) {
            return res.status(404).json({ message: "Không tìm thấy thông tin khách hàng" });
        }

        const [tasks, claimedIds, totalPoints] = await Promise.all([
            taskModel.getAllTasks(),
            taskModel.getClaimedToday(maKH),
            taskModel.getTotalPoints(maKH)
        ]);

        const tasksWithStatus = await Promise.all(
            tasks.map(async (task) => {
                const isClaimed = claimedIds.includes(task.MaNV);
                let status = "locked";

                if (isClaimed) {
                    status = "claimed";
                } else {
                    const isEligible = await taskModel.checkCondition(maKH, task.LoaiDieuKien);
                    status = isEligible ? "available" : "locked";
                }

                return { ...task, status };
            })
        );

        res.status(200).json({ tasks: tasksWithStatus, totalPoints });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi server khi tải nhiệm vụ" });
    }
};

// POST /api/tasks/:id/claim
const claimTask = async (req, res) => {
    try {
        const { maTK } = req.user;
        const maNV = Number(req.params.id);
        const maKH = await taskModel.getMaKHByMaTK(maTK);

        if (!maKH) {
            return res.status(404).json({ message: "Không tìm thấy thông tin khách hàng" });
        }

        const tasks = await taskModel.getAllTasks();
        const task = tasks.find(t => t.MaNV === maNV);
        if (!task) {
            return res.status(404).json({ message: "Nhiệm vụ không tồn tại" });
        }

        const claimedIds = await taskModel.getClaimedToday(maKH);
        if (claimedIds.includes(maNV)) {
            return res.status(400).json({ message: "Bạn đã nhận nhiệm vụ này hôm nay rồi" });
        }

        const isEligible = await taskModel.checkCondition(maKH, task.LoaiDieuKien);
        if (!isEligible) {
            return res.status(400).json({ message: "Bạn chưa hoàn thành nhiệm vụ này" });
        }

        await taskModel.claimTask(maKH, task);
        const totalPoints = await taskModel.getTotalPoints(maKH);

        res.status(200).json({ message: "Nhận điểm thành công", totalPoints });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi server khi nhận điểm" });
    }
};

module.exports = { getTaskStatus, claimTask };