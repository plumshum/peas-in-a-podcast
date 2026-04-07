export interface Episode {
  title: string;
  descr: string;
  imdb_rating: number;
}

export interface Podcast {
  title: string;
  description: string;
  explicit: boolean;
  image_url: string;
  feed_url: string;
  website_url: string;
  author: string;
  categories: string[];
  popularity_score: number;
  score?: number;
  popularity?: number;
}

export interface SearchPayload {
  query: string;
  explicit: boolean;
  genres: string[];
  lengthMetric: "duration_ms" | "total_episodes";
  maxLength: number;
  publisher: string;
  releaseYear: string;
}

/* TODO: add more types as needed

Podcast {
  ...
  Episodes: Episode[]
}

Episode { 
  ...
}

*/
