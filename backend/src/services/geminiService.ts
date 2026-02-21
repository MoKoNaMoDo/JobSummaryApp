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

    static async refineText(text: string, mode: 'refine' | 'expand' | 'organize') {
        try {
            const apiKey = process.env.GROQ_API_KEY;
            if (!apiKey) throw new Error("Groq API Key is missing. Please set GROQ_API_KEY in .env");

            const Groq = (await import('groq-sdk')).default;
            const groq = new Groq({ apiKey });

            let instruction = "";
            if (mode === 'refine') {
                instruction = "Refine this developer work log into professional, formal, and concise language. Correct grammar and use industry-standard terminology.";
            } else if (mode === 'expand') {
                instruction = "Expand this developer work log with additional likely technical details, best practices involved, or potential impacts. Make it detailed for a technical report.";
            } else if (mode === 'organize') {
                instruction = "Organize this work log into a clear, structured list with bullet points. Group related items and make it easy to scan.";
            }

            const completion = await groq.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: `You are a professional technical writer. ${instruction} Return ONLY the refined text, no explanations or markdown code blocks.`
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
        } catch (error: any) {
            console.error("GeminiService.refineText (Groq) Error:", error.message);
            throw error;
        }
    }
}
