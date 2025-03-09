import { ProcessedTweet } from "@/lib/twitter/types"
import { TweetCard } from "@/components/tweet-card"
import { EmptyState } from "@/components/empty-state"

interface TweetGridProps {
  tweets: ProcessedTweet[]
  loading: boolean
  emptyMessage: string
  filter?: (tweet: ProcessedTweet) => boolean
}

export function TweetGrid({
  tweets,
  loading,
  emptyMessage,
  filter,
}: TweetGridProps) {
  // Handle case when tweets is undefined
  if (!tweets) {
    return <EmptyState loading={loading} message="Error loading tweets" />
  }
  
  const filteredTweets = filter ? tweets.filter(filter) : tweets
  
  if (filteredTweets.length === 0) {
    return <EmptyState loading={loading} message={emptyMessage} />
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredTweets.map((tweet) => (
        <TweetCard key={tweet.id} tweet={tweet} />
      ))}
    </div>
  )
}