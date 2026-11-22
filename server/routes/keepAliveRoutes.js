import express from "express";
import { getKeepAliveStats } from "../utils/keepAlive.js";

const router = express.Router();

/**
 * @route   GET /api/keep-alive
 * @desc    Keep-alive endpoint to prevent Render.com free instance from sleeping
 * @access  Public
 */
router.get("/", (req, res) => {
	res.status(200).json({
		success: true,
		status: "active",
		message: "Server is awake and active",
		timestamp: new Date().toISOString(),
		uptime: `${Math.floor(process.uptime())}s`,
		environment: process.env.NODE_ENV || "development" || "production",
		stats: getKeepAliveStats(),
	});
});

/**
 * @route   GET /api/keep-alive/ping
 * @desc    Lightweight ping-pong endpoint
 * @access  Public
 */
router.get("/ping", (req, res) => {
	res.status(200).send("pong");
});

export default router;
