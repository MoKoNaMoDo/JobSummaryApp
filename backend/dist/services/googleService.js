"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleService = void 0;
const docs_1 = require("./google/docs");
const driveUpload_1 = require("./google/driveUpload");
const jobRows_1 = require("./google/jobRows");
const spreadsheetConfig_1 = require("./google/spreadsheetConfig");
const sheetTabs_1 = require("./google/sheetTabs");
class GoogleService {
    static getJobSpreadsheetId() {
        return (0, spreadsheetConfig_1.getJobSpreadsheetId)();
    }
    static async generateReimbursementDoc(data) {
        return (0, docs_1.generateReimbursementDoc)(data);
    }
    static async uploadSlip(file, contextName, date, prefix = 'JobSummary') {
        return (0, driveUpload_1.uploadSlip)(file, contextName, date, prefix);
    }
    static async appendToSheet(data, prefix = 'JobSummary', projectSlug) {
        return (0, jobRows_1.appendToSheet)(data, prefix, projectSlug);
    }
    static async getReimbursements(month, year, prefix = 'JobSummary', projectSlug) {
        return (0, jobRows_1.getReimbursements)(month, year, prefix, projectSlug);
    }
    static async updateRowStatus(sheetName, rowIndex, status, prefix = 'JobSummary') {
        return (0, jobRows_1.updateRowStatus)(sheetName, rowIndex, status, prefix);
    }
    static async updateRowData(sheetName, rowIndex, data, prefix = 'JobSummary') {
        return (0, jobRows_1.updateRowData)(sheetName, rowIndex, data, prefix);
    }
    static async deleteRow(sheetName, rowIndex, prefix = 'JobSummary') {
        return (0, jobRows_1.deleteRow)(sheetName, rowIndex, prefix);
    }
    static async readTab(spreadsheetId, tabName) {
        return (0, sheetTabs_1.readTab)(spreadsheetId, tabName);
    }
    static async writeTab(spreadsheetId, tabName, rows) {
        return (0, sheetTabs_1.writeTab)(spreadsheetId, tabName, rows);
    }
}
exports.GoogleService = GoogleService;
