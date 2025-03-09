import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"

interface ThreadPost {
  text: string
  position: number
  category: string
}

interface Thread {
  username: string
  posts: ThreadPost[]
  generatedAt: number
}

export function ThreadGenerator() {
  const [username, setUsername] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [fetchProgress, setFetchProgress] = useState<number | null>(null)
  const [thread, setThread] = useState<Thread | null>(null)
  const { toast } = useToast()

  const fetchHistoricalTweets = async () => {
    if (!username) {
      toast({
        title: "Username required",
        description: "Please enter a Twitter username",
        variant: "destructive",
      })
      return
    }

    setIsFetching(true)
    setFetchProgress(0)

    try {
      const response = await fetch("/api/twitter/fetch-historical", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Tweets fetched",
          description: data.message,
        })
        setFetchProgress(100)
      } else {
        toast({
          title: "Error fetching tweets",
          description: data.error || "An unknown error occurred",
          variant: "destructive",
        })
        setFetchProgress(null)
      }
    } catch (error) {
      console.error("Error fetching historical tweets:", error)
      toast({
        title: "Error fetching tweets",
        description: "Failed to fetch historical tweets",
        variant: "destructive",
      })
      setFetchProgress(null)
    } finally {
      setIsFetching(false)
    }
  }

  const generateThread = async () => {
    if (!username) {
      toast({
        title: "Username required",
        description: "Please enter a Twitter username",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)

    try {
      const response = await fetch("/api/twitter/generate-thread", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username }),
      })

      const data = await response.json()

      if (response.ok) {
        setThread(data.thread)
        toast({
          title: data.isNew ? "Thread generated" : "Thread loaded",
          description: `Thread for @${username} ${data.isNew ? "generated" : "loaded"} successfully`,
        })
      } else {
        toast({
          title: "Error generating thread",
          description: data.error || "An unknown error occurred",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error generating thread:", error)
      toast({
        title: "Error generating thread",
        description: "Failed to generate Twitter thread",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  // Simulate progress for UX purposes
  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (isFetching && fetchProgress !== null && fetchProgress < 95) {
      interval = setInterval(() => {
        setFetchProgress(prev => {
          if (prev === null) return null
          
          // Slow down progress as it gets higher
          const increment = prev < 30 ? 5 : prev < 60 ? 3 : prev < 80 ? 1 : 0.5
          return Math.min(95, prev + increment)
        })
      }, 1000)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isFetching, fetchProgress])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Twitter Thread Generator</CardTitle>
          <CardDescription>
            Generate insightful Twitter threads based on historical tweets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <div className="grid flex-1 gap-2">
              <Input
                placeholder="Enter Twitter username (without @)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isFetching || isGenerating}
              />
            </div>
            <Button 
              onClick={fetchHistoricalTweets} 
              disabled={isFetching || isGenerating || !username}
              variant="outline"
            >
              {isFetching ? "Fetching..." : "Fetch Tweets"}
            </Button>
            <Button 
              onClick={generateThread} 
              disabled={isFetching || isGenerating || !username}
            >
              {isGenerating ? "Generating..." : "Generate Thread"}
            </Button>
          </div>

          {fetchProgress !== null && (
            <div className="mt-4 space-y-2">
              <div className="text-sm text-muted-foreground">
                Fetching historical tweets: {Math.round(fetchProgress)}%
              </div>
              <div className="h-2 w-full bg-secondary overflow-hidden rounded-full">
                <div 
                  className="h-full bg-primary transition-all duration-500 ease-in-out" 
                  style={{ width: `${fetchProgress}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground">
                This process fetches up to 1500 historical tweets and may take a few minutes
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {thread && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Thread for @{thread.username}</CardTitle>
            <CardDescription>
              Generated on {new Date(thread.generatedAt).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList className="mb-4">
                <TabsTrigger value="all">All Posts</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="topics">Topics</TabsTrigger>
                <TabsTrigger value="engagement">Engagement</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="space-y-4">
                {thread.posts.map((post, index) => (
                  <Card key={index} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-4">
                        <div className="min-w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                          {post.position}
                        </div>
                        <div className="space-y-1">
                          <p className="whitespace-pre-line">{post.text}</p>
                          <p className="text-xs text-muted-foreground capitalize">{post.category}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
              
              <TabsContent value="timeline" className="space-y-4">
                {thread.posts
                  .filter(post => post.category === 'timeline')
                  .map((post, index) => (
                    <Card key={index} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-4">
                          <div className="min-w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                            {post.position}
                          </div>
                          <div>
                            <p className="whitespace-pre-line">{post.text}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </TabsContent>
              
              <TabsContent value="topics" className="space-y-4">
                {thread.posts
                  .filter(post => post.category === 'topic')
                  .map((post, index) => (
                    <Card key={index} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-4">
                          <div className="min-w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                            {post.position}
                          </div>
                          <div>
                            <p className="whitespace-pre-line">{post.text}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </TabsContent>
              
              <TabsContent value="engagement" className="space-y-4">
                {thread.posts
                  .filter(post => post.category === 'engagement')
                  .map((post, index) => (
                    <Card key={index} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-4">
                          <div className="min-w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                            {post.position}
                          </div>
                          <div>
                            <p className="whitespace-pre-line">{post.text}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => {
              const threadText = thread.posts.map(post => post.text).join("\n\n");
              navigator.clipboard.writeText(threadText);
              toast({
                title: "Thread copied",
                description: "Thread text copied to clipboard",
              });
            }}>
              Copy All Text
            </Button>
            <Button variant="outline" onClick={() => {
              const threadText = thread.posts.map(post => `${post.position}. ${post.text}`).join("\n\n");
              const blob = new Blob([threadText], { type: "text/plain" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `${thread.username}-twitter-thread.txt`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
              toast({
                title: "Thread downloaded",
                description: "Thread text downloaded as a file",
              });
            }}>
              Download as Text
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}