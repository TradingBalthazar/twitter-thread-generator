import localFont from "next/font/local"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
})
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
})

export default function Home() {
  return (
    <div
      className={`${geistSans.variable} ${geistMono.variable} grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]`}
    >
      <main className="flex flex-col gap-8 row-start-2 items-center max-w-3xl">
        <h1 className="text-4xl font-bold text-center">Twitter Monitoring Agent</h1>
        <p className="text-xl text-center text-gray-600 dark:text-gray-400">
          Automatically monitor, like, and reply to tweets from key accounts using AI-generated responses
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mt-8">
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Features</h2>
            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Monitors specified Twitter accounts hourly</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Automatically likes new tweets</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Generates contextual replies using OpenRouter AI</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Tracks interaction history</span>
              </li>
            </ul>
          </Card>
          
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Getting Started</h2>
            <p className="mb-4">
              Configure your Twitter API credentials and OpenRouter API key in the environment variables.
              Specify which Twitter accounts to monitor, and the agent will automatically process new tweets.
            </p>
            <div className="flex justify-center">
              <Link href="/dashboard">
                <Button size="lg">
                  View Dashboard
                </Button>
              </Link>
            </div>
          </Card>
        </div>
        
        <div className="mt-8 text-center text-sm text-gray-500">
          Built with Next.js, Twitter API, OpenRouter, and Vercel KV
        </div>
      </main>
    </div>
  )
}
