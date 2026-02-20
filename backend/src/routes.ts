import express from 'express';
import multer from 'multer';
import { submitReimbursement, getReimbursements, updateStatus, deleteReimbursement, analyzeReimbursement, updateReimbursement } from './controllers/reimbursementController';

const router = express.Router();

// Multer setup for memory storage (file buffer)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

import { getConfig, updateConfig, login } from './controllers/configController';

import { submitJob, getJobs, updateJob, updateJobStatus, deleteJob } from './controllers/jobController';

// Route: POST /api/reimbursements
router.post('/reimbursements', upload.single('slip'), submitReimbursement);
router.post('/reimbursements/analyze', upload.single('slip'), analyzeReimbursement); // New Analyze Route
router.get('/reimbursements', getReimbursements);
router.patch('/reimbursements/status', updateStatus);
router.patch('/reimbursements/update', updateReimbursement);
router.delete('/reimbursements', deleteReimbursement);

// Route: Config
router.get('/config', getConfig);
router.post('/config', updateConfig);
router.post('/login', login);

// Route: Jobs (New)
router.post('/jobs', upload.single('image'), submitJob);
router.get('/jobs', getJobs);
router.patch('/jobs/status', updateJobStatus);
router.patch('/jobs', updateJob);
router.delete('/jobs', deleteJob);

// Route: Projects
import { getProjects, createProject, updateProject, deleteProject } from './controllers/projectController';
router.get('/projects', getProjects);
router.post('/projects', createProject);
router.patch('/projects/:id', updateProject);
router.delete('/projects/:id', deleteProject);

export default router;
