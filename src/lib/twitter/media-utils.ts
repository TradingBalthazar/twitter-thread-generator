import { rwClient } from './client';
import axios from 'axios';

/**
 * Post a media reply to a tweet with optional text
 * @param mediaUrl URL of the media to post
 * @param inReplyToTweetId ID of the tweet to reply to
 * @param text Optional text to include with the media
 * @returns The ID of the reply tweet, or null if the reply failed
 */
export async function postMediaReply(
  mediaUrl: string,
  inReplyToTweetId: string,
  text?: string
): Promise<string | null> {
  try {
    console.log(`Attempting to post media reply with GIF URL: ${mediaUrl}`);
    
    // For Vercel serverless environment, we need to use a different approach
    // Instead of downloading to a file, we'll fetch the media and upload it directly
    const response = await axios.get(mediaUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);
    
    console.log(`Successfully downloaded media, size: ${buffer.length} bytes`);
    
    // Upload the media to Twitter directly from the buffer
    try {
      const mediaId = await rwClient.v1.uploadMedia(buffer, {
        mimeType: response.headers['content-type'] || 'image/gif'
      });
      
      console.log(`Successfully uploaded media to Twitter, media ID: ${mediaId}`);
      
      // Post the reply with the media and optional text
      const reply = await rwClient.v2.tweet({
        text: text || undefined,
        media: {
          media_ids: [mediaId]
        },
        reply: {
          in_reply_to_tweet_id: inReplyToTweetId
        }
      });
      
      console.log(`Successfully posted reply tweet: ${reply.data.id}`);
      
      return reply.data.id;
    } catch (uploadError) {
      console.error('Error uploading media to Twitter:', uploadError);
      
      // Fallback: If media upload fails, try posting a text reply with the GIF URL
      console.log('Attempting fallback: posting text reply with GIF URL');
      try {
        const fallbackText = text ?
          `${text}\n\nCheck out this GIF: ${mediaUrl}` :
          `Check out this GIF: ${mediaUrl}`;
          
        const textReply = await rwClient.v2.reply(
          fallbackText,
          inReplyToTweetId
        );
        console.log(`Posted fallback text reply: ${textReply.data.id}`);
        return textReply.data.id;
      } catch (textReplyError) {
        console.error('Error posting fallback text reply:', textReplyError);
        return null;
      }
    }
  } catch (error) {
    console.error('Error posting media reply:', error);
    return null;
  }
}