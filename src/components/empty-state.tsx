import { Loading } from "@/components/ui/loading"

interface EmptyStateProps {
  loading: boolean
  message: string
  loadingMessage?: string
}

export function EmptyState({
  loading,
  message,
  loadingMessage = "Loading tweets...",
}: EmptyStateProps) {
  if (loading) {
    return (
      <div className="text-center py-8">
        <Loading size="lg" className="mb-4" />
        <p className="text-gray-500">{loadingMessage}</p>
      </div>
    )
  }

  return (
    <div className="text-center py-8">
      <p className="text-gray-500">{message}</p>
    </div>
  )
}