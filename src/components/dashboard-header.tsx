import { Button } from "@/components/ui/button"
import { Loading } from "@/components/ui/loading"
import Link from "next/link"
import { useRouter } from "next/router"

interface DashboardHeaderProps {
  loading: boolean
  onRefresh: () => void
  onRunMonitor: () => void
  onResetLastProcessed?: () => void
  onCleanupTweets?: () => void
}

export function DashboardHeader({
  loading,
  onRefresh,
  onRunMonitor,
  onResetLastProcessed,
  onCleanupTweets,
}: DashboardHeaderProps) {
  const router = useRouter()
  
  return (
    <div className="flex flex-col space-y-4 mb-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Twitter Monitoring Dashboard</h1>
        <div className="flex space-x-4">
          <Link href="/dashboard" className={`px-4 py-2 rounded-md ${router.pathname === '/dashboard' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            Dashboard
          </Link>
          <Link href="/thread-generator" className={`px-4 py-2 rounded-md ${router.pathname === '/thread-generator' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            Thread Generator
          </Link>
        </div>
      </div>
      <div className="flex justify-end space-x-4">
        <Button onClick={onRefresh} disabled={loading} className="flex items-center gap-2">
          {loading ? (
            <>
              <Loading size="sm" />
              <span>Loading...</span>
            </>
          ) : (
            'Refresh'
          )}
        </Button>
        <Button onClick={onRunMonitor} disabled={loading} variant="default" className="flex items-center gap-2">
          {loading ? (
            <>
              <Loading size="sm" />
              <span>Processing...</span>
            </>
          ) : (
            'Run Monitor Now'
          )}
        </Button>
        {onResetLastProcessed && (
          <Button onClick={onResetLastProcessed} disabled={loading} variant="destructive" className="flex items-center gap-2">
            {loading ? (
              <>
                <Loading size="sm" />
                <span>Resetting...</span>
              </>
            ) : (
              'Reset Last Processed'
            )}
          </Button>
        )}
        {onCleanupTweets && (
          <Button onClick={onCleanupTweets} disabled={loading} variant="outline" className="flex items-center gap-2">
            {loading ? (
              <>
                <Loading size="sm" />
                <span>Cleaning...</span>
              </>
            ) : (
              'Cleanup Tweet Data'
            )}
          </Button>
        )}
      </div>
    </div>
  )
}