"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173', /https:\/\/.*\.vercel\.app$/],
    credentials: true
}));
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
const routes_1 = __importDefault(require("./routes"));
app.use('/api', routes_1.default);
// Basic Route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to ClearBill API', status: 'OK' });
});
exports.default = app;
