
import { KnowledgeEditor } from '@/components/features/knowledge/KnowledgeEditor'

export default async function KnowledgeCreatePage(props: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const searchParams = await props.searchParams;

    return (
        <KnowledgeEditor initialTitle={searchParams?.title as string} />
    )
}
