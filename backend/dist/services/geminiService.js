"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiService = void 0;
const generative_ai_1 = require("@google/generative-ai");
const dotenv_1 = __importDefault(require("dotenv"));
const configService_1 = require("./configService");
dotenv_1.default.config();
class GeminiService {
    static async analyzeSlip(fileBuffer, mimeType) {
        try {
            const apiKey = configService_1.ConfigService.get('geminiApiKey');
            if (!apiKey) {
                throw new Error("Gemini API Key is missing in Config.");
            }
            const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const prompt = `
                Analyze this payment slip/receipt image and extract the following information in JSON format:
                {
                    "date": "YYYY-MM-DD", (The transaction date. If not found, return null)
                    "amount": number, (The total amount paid. If not found, return null)
                    "taxId": "string", (The 13-digit tax identification number. If not found, return null)
                    "merchant": "string" (The name of the receiver/shop/counterparty. If not found, return null)
                }
                
                IMPORTANT:
                - Return ONLY the raw JSON string.
                - Do NOT include markdown formatting (like \`\`\`json).
                - Use "null" (without quotes) for missing values.
            `;
            const imagePart = {
                inlineData: {
                    data: fileBuffer.toString("base64"),
                    mimeType
                }
            };
            const result = await model.generateContent([prompt, imagePart]);
            const response = await result.response;
            const text = response.text();
            console.log("Gemini Raw Response:", text); // Debugging
            // Clean up code blocks if present
            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            try {
                return JSON.parse(cleanText);
            }
            catch (parseError) {
                console.error("Failed to parse Gemini response:", cleanText);
                throw new Error("Invalid format returned by AI");
            }
        }
        catch (error) {
            console.error("Error analyzing slip with Gemini:", error);
            throw new Error("Failed to analyze slip image");
        }
    }
    static async analyzeJob(note, fileBuffer, mimeType) {
        try {
            const apiKey = configService_1.ConfigService.get('geminiApiKey');
            if (!apiKey)
                throw new Error("Gemini API Key is missing.");
            const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
            const prompt = `
                Analyze this daily work log entry (text note and optional image). 
                The user is likely a Software Developer or in a Technical role.
                Extract summary data in JSON format.
                
                Note Context: "${note}"
                
                Extract:
                {
                    "taskName": "string", (Short, professional title, e.g., "Fix Auth Race Condition", "Implement Dashboard API")
                    "category": "string", (One of: "Feature", "BugFix", "Refactor", "Testing", "DevOps", "Maintenance", "Meeting", "Support", "Research")
                    "description": "string", (Professional summary of what was done. Use technical terms if appropriate.)
                    "date": "YYYY-MM-DD", (Date mentioned or today's date)
                    "cost": number, (Any associated cost mentioned, else 0)
                    "status": "string" (Suggest "Completed", "In Progress", or "Pending" based on context)
                }

                IMPORTANT: Return ONLY raw JSON. No markdown.
            `;
            const parts = [prompt];
            if (fileBuffer && mimeType) {
                parts.push({
                    inlineData: {
                        data: fileBuffer.toString("base64"),
                        mimeType
                    }
                });
            }
            const result = await model.generateContent(parts);
            const response = await result.response;
            const text = response.text();
            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanText);
        }
        catch (error) {
            console.error("Error analyzing job:", error);
            return {
                taskName: "Work Entry",
                category: "General",
                description: note,
                date: new Date().toISOString().split('T')[0],
                cost: 0,
                status: "Pending"
            };
        }
    }
    static async refineText(text, mode, language = 'th') {
        try {
            const apiKey = process.env.GROQ_API_KEY;
            if (!apiKey)
                throw new Error("Groq API Key is missing. Please set GROQ_API_KEY in .env");
            const Groq = (await Promise.resolve().then(() => __importStar(require('groq-sdk')))).default;
            const groq = new Groq({ apiKey });
            const isThai = language === 'th';
            let instruction = "";
            if (mode === 'title') {
                // Generate short task name only
                const titleLang = isThai
                    ? "สร้างชื่องานสั้นๆ กระชับ ไม่เกิน 8 คำ จากเนื้อหาต่อไปนี้ ตอบเป็นภาษาไทยเท่านั้น ไม่ต้องขึ้นต้นด้วยเครื่องหมายหรืออีโมจิ ตอบมาแค่ชื่องานอย่างเดียว"
                    : "Generate a short task name, max 8 words, from the following content. Reply in English only. No emoji, no punctuation prefix. Just the task name.";
                const completion = await groq.chat.completions.create({
                    messages: [
                        { role: "system", content: titleLang },
                        { role: "user", content: text }
                    ],
                    model: "llama-3.1-8b-instant",
                    temperature: 0.4,
                    max_tokens: 64,
                });
                return completion.choices[0]?.message?.content?.trim() ?? text;
            }
            if (mode === 'refine') {
                instruction = isThai
                    ? "ปรับแต่งข้อความบันทึกงานต่อไปนี้ให้เป็นภาษาที่เป็นทางการ กระชับ และเป็นมืออาชีพ แก้ไขไวยากรณ์และใช้คำศัพท์ที่เหมาะสม"
                    : "Refine this work log into professional, formal, and concise language. Correct grammar and use industry-standard terminology.";
            }
            else if (mode === 'expand') {
                instruction = isThai
                    ? "ขยายความข้อความบันทึกงานต่อไปนี้โดยเพิ่มรายละเอียดทางเทคนิค วิธีการที่ใช้ และผลกระทบที่เกิดขึ้น ให้เหมาะสำหรับรายงานประจำวัน"
                    : "Expand this work log with additional technical details, methods used, and potential impacts. Make it detailed for a daily progress report.";
            }
            else if (mode === 'organize') {
                instruction = isThai
                    ? "จัดระเบียบข้อความบันทึกงานต่อไปนี้ให้อยู่ในรูปแบบรายการที่ชัดเจน จัดกลุ่มงานที่เกี่ยวข้องและเรียงลำดับตามความสำคัญ"
                    : "Organize this work log into a clear, structured list. Group related tasks and order by priority.";
            }
            else if (mode === 'shorten') {
                instruction = isThai
                    ? "สรุปข้อความต่อไปนี้ให้สั้น กระชับ เข้าใจง่าย ไม่เกิน 3 บรรทัด เลือกเฟ้นเฉพาะส่วนที่สำคัญที่สุด"
                    : "Summarize this work log into a short, easy-to-understand version. Max 3 lines. Keep only the most important points.";
            }
            const templateInstruction = isThai
                ? `ตอบในรูปแบบรายงานงานรายวันดังนี้:
✅ งานที่ทำ:
- [รายละเอียดงาน]

💡 หมายเหตุ / ผลลัพธ์:
- [บันทึกเพิ่มเติม หากมี]

ตอบเป็นภาษาไทยเท่านั้น ไม่ต้องใส่วันที่ ไม่ต้องใส่ markdown code block`
                : `Reply in this daily work log format:
✅ Tasks Completed:
- [Task detail]

💡 Notes / Results:
- [Additional notes if any]

Reply in English only. Do not include the date. No markdown code blocks.`;
            const completion = await groq.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: `You are a professional technical writer and daily work log assistant. ${instruction}\n\n${templateInstruction}`
                    },
                    {
                        role: "user",
                        content: text
                    }
                ],
                model: "llama-3.1-8b-instant",
                temperature: 0.6,
                max_tokens: 1024,
            });
            return completion.choices[0]?.message?.content?.trim() ?? text;
        }
        catch (error) {
            console.error("GeminiService.refineText (Groq) Error:", error.message);
            throw error;
        }
    }
}
exports.GeminiService = GeminiService;
