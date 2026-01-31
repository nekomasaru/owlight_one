import { createClient } from '@/lib/supabase/server'
import { knowledgeInputSchema } from '@/lib/validations/knowledge'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const sort = searchParams.get('sort') || 'latest'
        const limit = parseInt(searchParams.get('limit') || '10')

        const supabase = await createClient()

        let query = supabase.from('knowledges').select('*')

        switch (sort) {
            case 'rating':
                query = query.order('evaluation_score', { ascending: false })
                break
            case 'updated':
                query = query.order('updated_at', { ascending: false })
                break
            case 'contribution':
                // Needs Contribution: Non-Gold (low score) and older
                query = query
                    .lt('evaluation_score', 80)
                    .order('updated_at', { ascending: true })
                break
            case 'seasonal':
                // Mock Seasonal: Just fetch items with specific tags for now
                // In production, this would use a mapping of current month to tags
                query = query.contains('tags', ['季節'])
                break
            case 'discussion':
            case 'recommended':
                // Placeholders for Phase 2 / Mock
                // For now, just return latest but could be random
                query = query.order('created_at', { ascending: false })
                break
            case 'latest':
            default:
                query = query.order('created_at', { ascending: false })
                break
        }

        const { data, error } = await query.limit(limit)

        if (error) {
            console.error('DB Fetch Error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, data })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient()

        // Auth Check
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const json = await request.json()

        // Validation
        const validationResult = knowledgeInputSchema.safeParse(json)
        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Validation Error', details: validationResult.error.flatten() },
                { status: 400 }
            )
        }

        const {
            title, content, tags, summary, background, rationale, examples, common_mistakes, trust_tier
        } = validationResult.data

        // Save to DB
        const { data, error } = await supabase
            .from('knowledges')
            .insert({
                author_id: user.id,
                title,
                content,
                tags,
                summary,
                background,
                rationale,
                examples,
                common_mistakes,
                evaluation_score: trust_tier === 1 ? 90 : (trust_tier === 2 ? 50 : 10), // Map trust_tier to score
                metadata: { trust_tier } // Store original tier in metadata
            })
            .select()
            .single()

        if (error) {
            console.error('DB Insert Error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, data }, { status: 201 })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
