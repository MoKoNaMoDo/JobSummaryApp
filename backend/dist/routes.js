"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const reimbursementController_1 = require("./controllers/reimbursementController");
const router = express_1.default.Router();
// Multer setup for memory storage (file buffer)
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});
const configController_1 = require("./controllers/configController");
const jobController_1 = require("./controllers/jobController");
// Route: POST /api/reimbursements
router.post('/reimbursements', upload.single('slip'), reimbursementController_1.submitReimbursement);
router.post('/reimbursements/analyze', upload.single('slip'), reimbursementController_1.analyzeReimbursement); // New Analyze Route
router.get('/reimbursements', reimbursementController_1.getReimbursements);
router.patch('/reimbursements/status', reimbursementController_1.updateStatus);
router.patch('/reimbursements/update', reimbursementController_1.updateReimbursement);
router.delete('/reimbursements', reimbursementController_1.deleteReimbursement);
// Route: Config
router.get('/config', configController_1.getConfig);
router.post('/config', configController_1.updateConfig);
router.post('/login', configController_1.login);
// Route: Jobs (New)
router.post('/jobs', upload.single('image'), jobController_1.submitJob);
router.get('/jobs', jobController_1.getJobs);
exports.default = router;
