import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import { ConfigService } from "./configService";

dotenv.config();

export class GeminiService {
    static async analyzeSlip(fileBuffer: Buffer, mimeType: string) {
        try {
            const apiKey = ConfigService.get('geminiApiKey');
            if (!apiKey) {
                throw new Error("Gemini API Key is missing in Config.");
            }
            const genAI = new GoogleGenerativeAI(apiKey);
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
            } catch (parseError) {
                console.error("Failed to parse Gemini response:", cleanText);
                throw new Error("Invalid format returned by AI");
            }

        } catch (error) {
            console.error("Error analyzing slip with Gemini:", error);
            throw new Error("Failed to analyze slip image");
        }
    }

    static async analyzeJob(note: string, fileBuffer?: Buffer, mimeType?: string) {
        try {
            const apiKey = ConfigService.get('geminiApiKey');
            if (!apiKey) throw new Error("Gemini API Key is missing.");

            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            const prompt = `
                Analyze this daily work log entry (text note and optional image) and extract summary data in JSON format:
                
                Note Context: "${note}"
                
                Extract:
                {
                    "taskName": "string", (Short title of the task, e.g., "Fix AC at Meeting Room", "Install Wiring")
                    "category": "string", (Type of work: "Installation", "Repair", "Maintenance", "Survey", "General")
                    "description": "string", (Refined summary of what was done, including progress or issues if mentioned)
                    "date": "YYYY-MM-DD", (Date mentioned or today's date)
                    "cost": number, (Any associated cost mentioned, else 0)
                    "status": "string" (Suggest "Completed", "In Progress", or "Pending" based on context)
                }

                IMPORTANT: Return ONLY raw JSON. No markdown.
            `;

            const parts: any[] = [prompt];

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

        } catch (error) {
            console.error("Error analyzing job:", error);
            // Fallback if AI fails:
            return {
                taskName: "General Task",
                category: "General",
                description: note,
                date: new Date().toISOString().split('T')[0],
                cost: 0,
                status: "Pending"
            };
        }
    }
}
