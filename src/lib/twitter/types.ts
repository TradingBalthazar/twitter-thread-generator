export interface ProcessedTweet {
  id: string;
  text: string;
  authorUsername: string;
  processedAt: number;
  replied: boolean;
  replyText?: string;
  impressions?: number;
  replyId?: string;
}