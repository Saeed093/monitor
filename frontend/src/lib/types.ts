export interface PakEvent {
  id: string;
  event_type: string;
  title: string;
  summary: string | null;
  country: string | null;
  province: string | null;
  district: string | null;
  city: string | null;
  location_text: string | null;
  latitude: number | null;
  longitude: number | null;
  severity: string | null;
  confidence: number | null;
  status: string | null;
  first_seen: string | null;
  last_seen: string | null;
  source_count: number;
  sources: EventSource[] | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface EventSource {
  raw_post_id: string;
  source_type: string;
  text_snippet: string;
  added_at: string;
  /** Direct link from ingest (X/Facebook Graph, etc.) */
  post_url?: string | null;
  /** RawPost.source, e.g. x:1234567890 */
  raw_source?: string | null;
}

export interface RawPost {
  id: string;
  source: string;
  source_type: string;
  source_post_id: string | null;
  author_name: string | null;
  author_handle: string | null;
  text: string;
  media_urls: string[] | null;
  post_url: string | null;
  published_at: string | null;
  collected_at: string | null;
}

export interface RawPostCreateBody {
  source: string;
  source_type: string;
  text: string;
  author_name?: string | null;
  author_handle?: string | null;
  post_url?: string | null;
  published_at?: string | null;
  media_urls?: string[];
  city?: string | null;
  province?: string | null;
}

export interface ProcessResponse {
  raw_post_id: string;
  event_created: boolean;
  event_id: string | null;
  event: PakEvent | null;
}

export interface EventFilters {
  event_type?: string;
  province?: string;
  time_range?: string;
  min_confidence?: number;
  severity?: string;
  status?: string;
  search?: string;
}
