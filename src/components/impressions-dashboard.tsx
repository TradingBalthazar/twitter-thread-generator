import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardHeader } from "@/components/dashboard-header"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"

interface ImpressionStats {
  totalImpressions: number
  totalTweets: number
  repliedTweets: number
  accountCounts: Record<string, number>
  lastUpdated: string
}

export function ImpressionsDashboard() {
  const [stats, setStats] = useState<ImpressionStats | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const fetchImpressions = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/twitter/impressions")
      const data = await response.json()
      
      setStats(data)
      toast({
        title: "Impressions refreshed",
        description: `Total impressions: ${data.totalImpressions.toLocaleString()}`,
      })
    } catch (error) {
      console.error("Error fetching impressions:", error)
      toast({
        title: "Error refreshing impressions",
        description: "Failed to load impression data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const updateImpressions = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/twitter/update-impressions", {
        method: "POST",
      })
      const data = await response.json()
      toast({
        title: "Impressions updated",
        description: `Updated ${data.updatedCount} tweets, total impressions: ${data.totalImpressions.toLocaleString()}`,
      })
      // Refresh impressions after updating
      fetchImpressions()
    } catch (error) {
      toast({
        title: "Error updating impressions",
        description: "Failed to update impression data",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  const runMonitor = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/twitter/monitor", {
        method: "POST",
      })
      const data = await response.json()
      toast({
        title: "Monitor executed",
        description: `Processed ${data.processed} tweets`,
      })
      // Refresh impressions after running the monitor
      fetchImpressions()
    } catch (error) {
      toast({
        title: "Error running monitor",
        description: "Failed to process tweets",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  const resetLastProcessed = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/reset-last-processed", {
        method: "POST",
      })
      const data = await response.json()
      toast({
        title: "Reset successful",
        description: data.message,
      })
      setLoading(false)
    } catch (error) {
      toast({
        title: "Error resetting",
        description: "Failed to reset last processed ID",
        variant: "destructive",
      })
      setLoading(false)
    }
  }
  
  const cleanupTweets = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/cleanup-tweets", {
        method: "POST",
      })
      const data = await response.json()
      toast({
        title: "Cleanup successful",
        description: data.message,
      })
      // Refresh impressions after cleanup
      fetchImpressions()
    } catch (error) {
      toast({
        title: "Error cleaning up",
        description: "Failed to clean up tweet data",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  // Fetch impressions on component mount
  useEffect(() => {
    fetchImpressions()
  }, [])

  return (
    <div className="container mx-auto py-8">
      <DashboardHeader
        loading={loading}
        onRefresh={fetchImpressions}
        onRunMonitor={runMonitor}
        onResetLastProcessed={resetLastProcessed}
        onCleanupTweets={cleanupTweets}
      />

      <div className="flex justify-end mb-4">
        <Button 
          onClick={updateImpressions} 
          disabled={loading}
          variant="outline"
        >
          Update Impression Counts
        </Button>
      </div>

      {stats ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="col-span-full md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle>Total Impressions</CardTitle>
              <CardDescription>
                Total views across all tweets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-6xl font-bold">{stats.totalImpressions.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground mt-2">
                Last updated: {new Date(stats.lastUpdated).toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Tweet Count</CardTitle>
              <CardDescription>
                Total tweets processed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{stats.totalTweets}</div>
              <div className="text-sm text-muted-foreground mt-2">
                {stats.repliedTweets} tweets replied to
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Impression Data Available</CardTitle>
            <CardDescription>
              Run the monitor to start collecting tweet data
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {stats && Object.keys(stats.accountCounts).length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Account Breakdown</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(stats.accountCounts).map(([account, count]) => (
              <Card key={account}>
                <CardHeader className="pb-2">
                  <CardTitle>{account}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{count} tweets</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}