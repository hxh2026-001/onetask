"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const api_1 = __importDefault(require("./routes/api"));
const DatabaseManager_1 = require("./database/DatabaseManager");
const PORT = process.env.PORT || 7002;
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use('/api', api_1.default);
app.get('/', (req, res) => {
    res.json({
        name: 'Compiler Sandbox API',
        version: '1.0.0',
        endpoints: {
            compile: 'POST /api/compile',
            scenarios: 'GET /api/scenarios',
            snippets: 'GET /api/snippets',
            errors: 'GET /api/errors',
            health: 'GET /api/health',
        },
    });
});
const db = (0, DatabaseManager_1.getDatabase)();
app.listen(PORT, () => {
    console.log(`Compiler Sandbox Server running on port ${PORT}`);
    console.log(`Database initialized`);
});
process.on('SIGTERM', () => {
    db.close();
    process.exit(0);
});
process.on('SIGINT', () => {
    db.close();
    process.exit(0);
});
//# sourceMappingURL=index.js.map