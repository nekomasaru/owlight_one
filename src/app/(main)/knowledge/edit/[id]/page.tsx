import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { KnowledgeEditor } from '@/components/features/knowledge/KnowledgeEditor'

export default async function KnowledgeEditPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const supabase = await createClient()

    const { data: knowledge, error } = await supabase
        .from('knowledges')
        .select('*')
        .eq('id', params.id)
        .single()

    if (error || !knowledge) {
        return notFound()
    }

    // Ensure tags is always an array
    const formattedKnowledge = {
        ...knowledge,
        tags: knowledge.tags || []
    }

    return (
        <KnowledgeEditor initialData={formattedKnowledge} />
    )
}
