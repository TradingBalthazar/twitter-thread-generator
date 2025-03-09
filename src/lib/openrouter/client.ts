import { config } from '@/config';
import axios from 'axios';

/**
 * Generate a statistical post inspired by a tweet
 * @param inspirationText The text of the tweet to use as inspiration
 * @param inspirationAccount The username of the account that posted the inspiration tweet
 * @returns A statistical post for your own timeline
 */
export async function generateStatisticalReply(inspirationText: string, inspirationAccount: string): Promise<string> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'HTTP-Referer': process.env.VERCEL_URL || 'http://localhost:3000',
      'X-Title': 'Twitter Monitoring Agent'
    },
    body: JSON.stringify({
      model: config.openrouter.model,
      messages: [
        {
          role: 'system',
          content: `You are an expert at creating original statistical posts inspired by trending topics.

ABOUT YOUR INSPIRATION SOURCE:
- @MarioNawfal is a prominent thought leader who tweets about global issues, technology, finance, and future trends
- You'll use his tweets as inspiration for your own original content
- You are NOT replying to him - you're creating your own standalone content

YOUR TASK:
Analyze the inspiration tweet and create ONE powerful statistical post related to the main topic.

GUIDELINES:
- Focus on global issues, economics, technology, or future trends mentioned in the tweet
- Include a specific number or percentage
- Make it surprising, counterintuitive, or unexpected when possible
- Ensure it's factually accurate and from reliable sources
- Keep it under 200 characters for optimal Twitter display
- No hashtags, @mentions, or emojis
- No questions or calls to action - just the statistic itself
- Avoid generic statements - be specific and data-driven
- For technology tweets → focus on adoption rates, impact statistics, or future projections
- For economic tweets → focus on wealth distribution, growth rates, or comparative statistics
- For social issues → focus on demographic data, trend statistics, or comparative global data
- For future trends → focus on projection data, expert consensus figures, or historical comparison data

OUTPUT FORMAT:
Create a standalone statistical post that can be understood without any context. No introduction, no commentary, no conclusion - just the powerful statistic itself.

Examples:
"94% of Fortune 500 CEOs believe AI will transform their industry within 5 years, yet only 17% have implemented any AI strategy."
"Just 100 companies are responsible for 71% of global carbon emissions since 1988."
"The world's 26 richest people own as much wealth as the poorest 50% of humanity - approximately 3.8 billion people."`
        },
        {
          role: 'user',
          content: `Generate a statistical post inspired by this tweet from ${inspirationAccount}: "${inspirationText}"`
        }
      ],
      max_tokens: 200,
    }),
  });

  const data = await response.json();
  const statisticalReply = data.choices[0].message.content.trim();
  
  console.log(`Raw statistical post from Claude: ${statisticalReply}`);
  
  // Remove any quotes that might be in the response
  return statisticalReply.replace(/^["']|["']$/g, '');
}

/**
 * Generate a GIF suggestion based on a tweet
 * @param tweetText The text of the tweet to respond to
 * @param accountName The username of the account that posted the tweet
 * @returns A search query for finding an appropriate GIF
 */
export async function generateGifSuggestion(tweetText: string, accountName: string): Promise<string> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'HTTP-Referer': process.env.VERCEL_URL || 'http://localhost:3000',
      'X-Title': 'Twitter Monitoring Agent'
    },
    body: JSON.stringify({
      model: config.openrouter.model,
      messages: [
        {
          role: 'system',
          content: `You are an expert at suggesting the perfect GIF or reaction image to respond to tweets.

Your task is to analyze a tweet and suggest a search query that would find the most appropriate, contextual, and engaging GIF to reply with.

GUIDELINES:
- Suggest search terms that will find GIFs that are humorous, relevant, and engaging
- Focus on reaction GIFs that convey emotion or opinion without needing text
- Be mindful of the tweet's tone and respond appropriately
- Keep suggestions concise (1-5 words is ideal for search terms)
- Avoid controversial, political, or potentially offensive suggestions
- Do not include hashtags, @mentions, or emojis in your suggestions

OUTPUT FORMAT:
Provide ONLY the search query text with no additional explanation, commentary, or formatting.
Example outputs: "mind blown", "applause", "thumbs up", "facepalm", "excited dance"`
        },
        {
          role: 'user',
          content: `Suggest a GIF search query to respond to this tweet from ${accountName}: "${tweetText}"`
        }
      ],
      max_tokens: 50, // We only need a short response
    }),
  });

  const data = await response.json();
  const suggestion = data.choices[0].message.content.trim();
  
  // Remove any quotes or extra formatting that might be in the response
  return suggestion.replace(/^["']|["']$/g, '');
}

/**
 * Generate an image using OpenRouter's image generation capabilities
 * @param fact The statistical fact to visualize
 * @returns URL of the generated image
 */
export async function generateImageForFact(fact: string): Promise<string | null> {
  try {
    console.log(`Generating image for fact: ${fact}`);
    
    // Create a prompt for image generation
    const prompt = `Create a conceptual, minimalist visualization representing this statistical fact: "${fact}".
    Use a clean, professional style with simple shapes, icons, or data visualization elements.
    No text should be included in the image. Focus on creating a symbolic representation that captures the essence of the statistic.
    Use a color palette that evokes trust and authority. Make it suitable for a professional Twitter post.`;
    
    const response = await fetch('https://openrouter.ai/api/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.VERCEL_URL || 'http://localhost:3000',
        'X-Title': 'Twitter Monitoring Agent'
      },
      body: JSON.stringify({
        model: "stability-ai/stable-diffusion-xl-1024-v1-0", // Using Stable Diffusion XL via OpenRouter
        prompt: prompt,
        n: 1,
        size: "1024x1024",
      }),
    });
    
    const data = await response.json();
    
    if (!data.data || !data.data[0] || !data.data[0].url) {
      console.error('Invalid response from OpenRouter image generation:', data);
      throw new Error('Failed to generate image');
    }
    
    const imageUrl = data.data[0].url;
    console.log(`Generated image URL: ${imageUrl}`);
    
    // Download the image to a buffer so we can upload it to Twitter
    const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(imageResponse.data);
    
    return imageUrl;
  } catch (error) {
    console.error('Error generating image:', error);
    return null;
  }
}

/**
 * Legacy function for generating text replies (kept for backward compatibility)
 */
export async function generateReply(tweetText: string, accountName: string) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'HTTP-Referer': process.env.VERCEL_URL || 'http://localhost:3000',
      'X-Title': 'Twitter Monitoring Agent'
    },
    body: JSON.stringify({
      model: config.openrouter.model,
      messages: [
        {
          role: 'system',
          content: `You are a sophisticated, forward-thinking assistant that generates replies to tweets from thought leaders.

TONE AND STYLE:
- Use a conversational, professional tone with a touch of humor or intrigue
- Be intellectually curious and open-minded
- Embrace progressive, innovative thinking
- Avoid archaic or conventional viewpoints
- Spark curiosity and drive engagement
- Be concise yet impactful

IMPORTANT RULES:
1. DO NOT use hashtags (#) or cashtags ($) in your replies
2. DO NOT mention or tag other users (@username)
3. DO NOT use emojis
4. DO NOT include links or URLs
5. Use only plain text
6. Keep responses under 280 characters (can be very short replies)
7. Avoid overt self-promotion
8. Focus on natural, value-adding dialogue that encourages retweets and replies

Remember that you're engaging with thought leaders who are at the cutting edge of their fields. Your responses should reflect forward-thinking perspectives.`
        },
        {
          role: 'user',
          content: `Generate a reply to this tweet from ${accountName}: "${tweetText}"`
        }
      ],
      max_tokens: config.openrouter.maxTokens,
    }),
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Generate a Twitter thread based on historical tweets
 * @param username The Twitter username
 * @param sampleTweets A sample of historical tweets to analyze
 * @returns An array of thread posts
 */
export async function generateTwitterThread(username: string, sampleTweets: any[]): Promise<any> {
  try {
    console.log(`Generating Twitter thread for @${username} based on ${sampleTweets.length} tweets`);
    
    // Prepare tweet data for the AI
    const tweetData = sampleTweets.map(tweet => ({
      id: tweet.id,
      text: tweet.text,
      createdAt: tweet.createdAt,
      likeCount: tweet.likeCount || 0,
      retweetCount: tweet.retweetCount || 0,
      replyCount: tweet.replyCount || 0
    }));
    
    // Sort tweets by date (oldest first)
    tweetData.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    // Get the date range
    const oldestTweet = tweetData[0];
    const newestTweet = tweetData[tweetData.length - 1];
    const dateRange = `${new Date(oldestTweet.createdAt).toLocaleDateString()} to ${new Date(newestTweet.createdAt).toLocaleDateString()}`;
    
    // Calculate some basic stats
    const totalLikes = tweetData.reduce((sum, tweet) => sum + (tweet.likeCount || 0), 0);
    const totalRetweets = tweetData.reduce((sum, tweet) => sum + (tweet.retweetCount || 0), 0);
    const avgLikes = totalLikes / tweetData.length;
    const avgRetweets = totalRetweets / tweetData.length;
    
    // Find top tweets by engagement
    const topTweets = [...tweetData]
      .sort((a, b) => (b.likeCount + b.retweetCount) - (a.likeCount + a.retweetCount))
      .slice(0, 5);
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.VERCEL_URL || 'http://localhost:3000',
        'X-Title': 'Twitter Thread Generator'
      },
      body: JSON.stringify({
        model: config.openrouter.model,
        messages: [
          {
            role: 'system',
            content: `You are an expert social media analyst who creates insightful Twitter threads about a user's Twitter history and patterns.

YOUR TASK:
Create a cohesive, engaging Twitter thread that analyzes @${username}'s Twitter history, highlighting interesting patterns, topics, and evolution over time.

THREAD STRUCTURE:
1. Introduction post - Introduce the thread and what followers will learn
2. Timeline posts (3-5) - Key milestones or evolution in their Twitter journey
3. Topic analysis posts (3-5) - Main topics/themes they tweet about with insights
4. Engagement analysis posts (1-2) - What content performs best and why
5. Conclusion post - Wrap up the thread with a final insight

GUIDELINES:
- Each post should be under 280 characters (Twitter limit)
- Include specific data points and insights (dates, numbers, percentages)
- Make observations about their evolution as a Twitter user
- Identify patterns in their most successful content
- Keep a professional, analytical tone
- Number each post (1/12, 2/12, etc.)
- You can use emojis sparingly for visual organization
- Mention @${username} in each post

OUTPUT FORMAT:
Return a JSON array where each element is an object with:
- position: number (position in the thread)
- text: string (the text of the post)
- category: string (introduction, timeline, topic, engagement, or conclusion)

Example post object:
{
  "position": 1,
  "text": "THREAD: A deep dive into @username's Twitter journey and insights 🧵",
  "category": "introduction"
}`
          },
          {
            role: 'user',
            content: `Generate a Twitter thread analyzing @${username}'s Twitter history based on this data:

Date range: ${dateRange}
Total tweets analyzed: ${tweetData.length}
Average likes per tweet: ${avgLikes.toFixed(1)}
Average retweets per tweet: ${avgRetweets.toFixed(1)}

Top 5 tweets by engagement:
${topTweets.map(tweet => `- "${tweet.text.substring(0, 100)}..." (${tweet.likeCount} likes, ${tweet.retweetCount} retweets, posted on ${new Date(tweet.createdAt).toLocaleDateString()})`).join('\n')}

Sample of tweet texts (for topic analysis):
${tweetData.slice(0, 20).map(tweet => `- "${tweet.text.substring(0, 100)}..."`).join('\n')}

Create a cohesive thread that tells the story of @${username}'s Twitter journey.`
          }
        ],
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid response from OpenRouter:', data);
      throw new Error('Failed to generate thread');
    }
    
    const threadContent = data.choices[0].message.content;
    console.log('Generated thread content:', threadContent);
    
    // Parse the JSON response
    try {
      // The AI might wrap the JSON in markdown code blocks, so we need to extract it
      const jsonMatch = threadContent.match(/```(?:json)?([\s\S]+?)```/) || [null, threadContent];
      const jsonContent = jsonMatch[1].trim();
      
      return JSON.parse(jsonContent);
    } catch (parseError) {
      console.error('Error parsing thread JSON:', parseError);
      console.error('Raw content:', threadContent);
      
      // Fallback: If we can't parse the JSON, create a basic thread
      return [
        {
          position: 1,
          text: `THREAD: A deep dive into @${username}'s Twitter journey and insights 🧵`,
          category: 'introduction'
        },
        {
          position: 2,
          text: `Looking at @${username}'s tweets from ${dateRange}, we can see an average of ${avgLikes.toFixed(1)} likes and ${avgRetweets.toFixed(1)} retweets per post.`,
          category: 'engagement'
        },
        {
          position: 3,
          text: `@${username}'s most popular tweet received ${topTweets[0]?.likeCount || 0} likes and was posted on ${new Date(topTweets[0]?.createdAt || Date.now()).toLocaleDateString()}.`,
          category: 'engagement'
        },
        {
          position: 4,
          text: `That's a wrap on @${username}'s Twitter journey! Follow for more insights and analyses like this.`,
          category: 'conclusion'
        }
      ];
    }
  } catch (error) {
    console.error('Error generating Twitter thread:', error);
    throw error;
  }
}