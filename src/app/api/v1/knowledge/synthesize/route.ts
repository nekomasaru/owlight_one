
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { VertexAI } from '@google-cloud/vertexai'
import { getAccessToken } from '@/lib/google-auth'
// Helper: Parse File
import { knowledgeInputSchema } from '@/lib/validations/knowledge'

// Initialize Vertex AI
const project = process.env.GOOGLE_PROJECT_ID || 'owlight-one'
let location = process.env.GOOGLE_LOCATION || 'us-central1'
if (location === 'global') location = 'us-central1'

const vertex_ai = new VertexAI({ project: project, location: location });

async function parseFile(base64Data: string, fileType: string): Promise<string> {
    const buffer = Buffer.from(base64Data, 'base64')
    try {
        if (fileType.includes('pdf')) {
            // Dynamic import to prevent top-level crash. Cast to any to handle CJS/ESM interop types.
            const pdfModule = await import('pdf-parse') as any
            const pdf = pdfModule.default || pdfModule
            const data = await pdf(buffer)
            return data.text
        } else if (fileType.includes('spreadsheet') || fileType.includes('excel') || fileType.endsWith('xls') || fileType.endsWith('xlsx')) {
            const XLSX = await import('xlsx')
            const workbook = XLSX.read(buffer, { type: 'buffer' })
            let text = ''
            workbook.SheetNames.forEach(sheetName => {
                const sheet = workbook.Sheets[sheetName]
                text += `\n--- Sheet: ${sheetName} ---\n`
                text += XLSX.utils.sheet_to_csv(sheet)
            })
            return text
        } else if (fileType.includes('document') || fileType.includes('word') || fileType.endsWith('docx')) {
            const mammoth = (await import('mammoth')).default
            const result = await mammoth.extractRawText({ buffer: buffer })
            return result.value
        }
    } catch (e) {
        console.error('File parsing error:', e)
        return `(File parsing failed: ${e})`
    }
    return ""
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { intent, chat_history, file_data, file_type } = body

        // Prepare context
        let contextText = ""
        let systemInstruction = `
You are an expert Knowledge Management Assistant for "OWLight".
Your goal is to help users create high-quality, structured knowledge articles.

**Your Output Format**:
You must ALWAYS return a JSON object with this structure:
{
  "message": "String (Your conversational response to the user)",
  "data": { ... } // A structured knowledge object matchin the schema below.
}

**Knowledge Schema**:
${JSON.stringify(knowledgeInputSchema)}

**Intents**:
- "Generate": IDK much, just generate a draft from the keyword.
- "Refine": Fix my messy notes into a professional document.
- "Summarize": Read the attached file/text and distill it into knowledge.

**Behavior Rules**:
1. Be polite and professional ("Gentle Professionalism").
2. When "data" is provided, ensure it fills as many fields as possible based on context.
3. If information is missing, ask for it in the "message" field, but still provide a partial "data" draft.
4. For "rationale", try to cite laws or rules if context implies them.
5. "common_mistakes" should be practical pitfalls.
`

        // 1. Process File if present
        if (file_data && file_type) {
            const extractedText = await parseFile(file_data, file_type)
            contextText += `\n\n## Uploaded File Content (${file_type})\n${extractedText.substring(0, 30000)}` // Limit limit
        }

        // 2. Process Chat History
        if (chat_history && Array.isArray(chat_history)) {
            contextText += "\n\n## Conversation History\n"
            chat_history.forEach((msg: any) => {
                contextText += `${msg.role}: ${msg.text}\n`
                if (msg.role === 'model' && msg.data) {
                    contextText += `(Model also proposed data: ${JSON.stringify(msg.data).substring(0, 200)}...)\n`
                }
            })
        }

        // 3. User Intent specific instructions
        if (intent === 'Summarize') {
            contextText += "\n\n[Instruction]: Summarize the file content above into the knowledge structure."
        } else if (intent === 'Refine') {
            contextText += "\n\n[Instruction]: Refine the user's latest input into a formal administrative document style."
        } else if (intent === 'SuggestTags') {
            contextText += "\n\n[Instruction]: Suggest 3-7 relevant tags based on the title and content provided. Return them in the 'tags' array of the 'data' object."
        } else {
            contextText += "\n\n[Instruction]: Generate a draft based on the conversation."
        }

        // Instantiate Gemini Model via Direct REST API (User specified curl approach)
        // const model = vertex_ai.getGenerativeModel({ ... }); // Disabled to use API Key

        const modelId = 'gemini-2.5-flash-lite'
        const project = process.env.GOOGLE_PROJECT_ID || 'owlight-one'
        // Construct URL without API Key, including project ID for OAuth
        // Force us-central1 to avoid "asia-southeast1" 404 error
        const apiUrl = `https://us-central1-aiplatform.googleapis.com/v1/projects/${project}/locations/us-central1/publishers/google/models/${modelId}:generateContent`

        console.log("Calling Gemini 2.5 Flash Lite via REST (OAuth Auth)...")

        try {
            const token = await getAccessToken()
            const fetchRes = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    contents: [{ role: 'user', parts: [{ text: contextText }] }],
                    generationConfig: { responseMimeType: 'application/json' },
                    systemInstruction: { parts: [{ text: systemInstruction }] } // REST API structure
                })
            })

            if (!fetchRes.ok) {
                const errorBody = await fetchRes.text()
                throw new Error(`Vertex API Error (${fetchRes.status}): ${errorBody}`)
            }

            const result = await fetchRes.json()
            console.log("Gemini Response Recieved structure:", JSON.stringify(result))

            const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text
            console.log("Gemini Output Char Length:", responseText?.length)

            if (!responseText) throw new Error('No response content from Gemini')

            return NextResponse.json(JSON.parse(responseText))

        } catch (genError: any) {
            console.error("Gemini Generation Error:", genError)
            return NextResponse.json({
                message: "Gemini / Vertex API Error",
                error: genError.toString(),
                details: genError.message || JSON.stringify(genError)
            }, { status: 500 })
        }

    } catch (err: any) {
        console.error('Synthesis Error:', err)
        return NextResponse.json({
            message: "申し訳ありません、処理中にエラーが発生しました。",
            error: err.toString()
        }, { status: 500 })
    }
}
