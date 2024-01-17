export interface Task {
    subreddit: string;
    interval: number;
    guildId: string;
    channelId: string;
    posted: string[];
    lastRan: Date;
  }