const express = require("express");
const router = express.Router();

const taskController = require("../controllers/taskController");
const { verifyToken } = require("../middlewares/authMiddleware");

router.get("/status", verifyToken, taskController.getTaskStatus);
router.post("/:id/claim", verifyToken, taskController.claimTask);

module.exports = router;