export interface FeedSource {
  sourceId: string;
  name: string;
  feedUrl: string;
  defaultTags: string[];
}

export const feedSources: FeedSource[] = [
  {
    sourceId: "fox-news",
    name: "Fox News",
    feedUrl: "https://moxie.foxnews.com/google-publisher/latest.xml",
    defaultTags: ["politics", "conservative"],
  },
  {
    sourceId: "cnn",
    name: "CNN",
    feedUrl: "https://rss.cnn.com/rss/cnn_topstories.rss",
    defaultTags: ["politics", "liberal"],
  },
  {
    sourceId: "bbc",
    name: "BBC News",
    feedUrl: "https://feeds.bbci.co.uk/news/rss.xml",
    defaultTags: ["world", "international"],
  },
  {
    sourceId: "reuters",
    name: "Reuters",
    feedUrl: "https://www.reutersagency.com/feed/",
    defaultTags: ["world", "wire service"],
  },
  {
    sourceId: "msnbc",
    name: "MSNBC",
    feedUrl: "https://www.msnbc.com/feeds/latest",
    defaultTags: ["politics", "liberal"],
  },
  {
    sourceId: "ap-news",
    name: "AP News",
    feedUrl: "https://rsshub.app/apnews/topics/apf-topnews",
    defaultTags: ["world", "wire service"],
  },
  {
    sourceId: "new-york-post",
    name: "New York Post",
    feedUrl: "https://nypost.com/feed/",
    defaultTags: ["politics", "tabloid"],
  },
  {
    sourceId: "the-guardian",
    name: "The Guardian",
    feedUrl: "https://www.theguardian.com/world/rss",
    defaultTags: ["world", "liberal"],
  },
];
