import express from 'express';
import multer from 'multer';
import { getConfig, updateConfig, login } from './controllers/configController';
import { submitJob, getJobs, updateJob, updateJobStatus, deleteJob, refineJobText } from './controllers/jobController';
import { getProjects, createProject, updateProject, deleteProject } from './controllers/projectController';
import { submitReimbursement, getReimbursements, updateStatus, deleteReimbursement, analyzeReimbursement, updateReimbursement } from './controllers/reimbursementController';

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
});

// Config & Auth
router.get('/config', getConfig);
router.post('/config', updateConfig);
router.post('/login', login);

// Jobs
router.post('/jobs', upload.single('image'), submitJob);
router.get('/jobs', getJobs);
router.patch('/jobs/status', updateJobStatus);
router.patch('/jobs', updateJob);
router.delete('/jobs', deleteJob);
router.post('/ai/refine', refineJobText);

// Projects
router.get('/projects', getProjects);
router.post('/projects', createProject);
router.patch('/projects/:id', updateProject);
router.delete('/projects/:id', deleteProject);

// Reimbursements
router.post('/reimbursements', upload.single('slip'), submitReimbursement);
router.post('/reimbursements/analyze', upload.single('slip'), analyzeReimbursement);
router.get('/reimbursements', getReimbursements);
router.patch('/reimbursements/status', updateStatus);
router.patch('/reimbursements/update', updateReimbursement);
router.delete('/reimbursements', deleteReimbursement);

export default router;
