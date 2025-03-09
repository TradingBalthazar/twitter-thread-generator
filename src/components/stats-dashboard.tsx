import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardHeader } from "@/components/dashboard-header"
import { useToast } from "@/hooks/use-toast"

interface AccountStats {
  tweets: number
  replied: number
  failed: number
}

interface TweetStats {
  totalTweets: number
  totalReplied: number
  totalFailed: number
  byAccount: Record<string, AccountStats>
  lastProcessed: string | null
}

export function StatsDashboard() {
  const [stats, setStats] = useState<TweetStats | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const fetchStats = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/twitter/stats")
      const data = await response.json()
      
      if (data.stats) {
        setStats(data.stats)
        toast({
          title: "Statistics refreshed",
          description: `Loaded stats for ${data.stats.totalTweets} tweets`,
        })
      } else {
        setStats(null)
        toast({
          title: "No statistics available",
          description: "No tweet data found",
        })
      }
    } catch (error) {
      console.error("Error fetching statistics:", error)
      toast({
        title: "Error refreshing statistics",
        description: "Failed to load tweet statistics",
        variant: "destructive",
      })
    } finally {
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
      // Refresh stats after running the monitor
      fetchStats()
    } catch (error) {
      toast({
        title: "Error running monitor",
        description: "Failed to process tweets",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  // Fetch stats on component mount
  useEffect(() => {
    fetchStats()
  }, [])

  return (
    <div className="container mx-auto py-8">
      <DashboardHeader
        loading={loading}
        onRefresh={fetchStats}
        onRunMonitor={runMonitor}
      />

      {stats ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Total Tweets</CardTitle>
              <CardDescription>
                All tweets processed by the agent
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{stats.totalTweets}</div>
              <div className="text-sm text-muted-foreground mt-2">
                {stats.totalReplied} replied • {stats.totalFailed} failed
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Last Activity</CardTitle>
              <CardDescription>
                Most recent tweet processing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-medium">
                {stats.lastProcessed 
                  ? new Date(stats.lastProcessed).toLocaleString() 
                  : "No activity yet"}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Success Rate</CardTitle>
              <CardDescription>
                Percentage of successful replies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">
                {stats.totalTweets > 0
                  ? Math.round((stats.totalReplied / stats.totalTweets) * 100)
                  : 0}%
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Statistics Available</CardTitle>
            <CardDescription>
              Run the monitor to start collecting tweet data
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {stats && Object.keys(stats.byAccount).length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Account Breakdown</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(stats.byAccount).map(([account, accountStats]) => (
              <Card key={account}>
                <CardHeader className="pb-2">
                  <CardTitle>{account}</CardTitle>
                  <CardDescription>
                    {accountStats.tweets} tweets processed
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between">
                    <div>
                      <div className="text-sm font-medium">Replied</div>
                      <div className="text-2xl font-bold">{accountStats.replied}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Failed</div>
                      <div className="text-2xl font-bold">{accountStats.failed}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Success</div>
                      <div className="text-2xl font-bold">
                        {accountStats.tweets > 0
                          ? Math.round((accountStats.replied / accountStats.tweets) * 100)
                          : 0}%
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}