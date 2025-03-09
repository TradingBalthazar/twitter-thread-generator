import { ProcessedTweet } from "@/lib/twitter/types"
import { Card } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"

interface TweetCardProps {
  tweet: ProcessedTweet
}

export function TweetCard({ tweet }: TweetCardProps) {
  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 mr-3">
            {tweet.authorUsername.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-bold">@{tweet.authorUsername}</div>
            <div className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(tweet.processedAt), { addSuffix: true })}
            </div>
          </div>
        </div>
        <div className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
          {tweet.replied ? "Replied" : "Failed"}
        </div>
      </div>
      
      <div className="mb-4 text-sm">
        {tweet.text}
      </div>
      
      {tweet.replied ? (
        <div className="border-t pt-3 mt-3">
          <div className="flex items-center mb-2">
            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 mr-2 text-xs">
              AI
            </div>
            <div className="text-xs font-medium">Reply</div>
          </div>
          <div className="text-sm pl-8">{tweet.replyText}</div>
        </div>
      ) : (
        <div className="border-t pt-3 mt-3">
          <div className="text-sm text-red-500">Failed to reply</div>
        </div>
      )}
      
      <div className="mt-3 text-right">
        <a
          href={`https://twitter.com/${tweet.authorUsername}/status/${tweet.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-500 hover:underline inline-flex items-center"
        >
          View on Twitter
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="ml-1"
          >
            <path d="M7 7h10v10" />
            <path d="M7 17 17 7" />
          </svg>
        </a>
      </div>
    </Card>
  )
}