// Database Configuration and service layer
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

// Supabase setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface Podcast {
  id?: number;
  collection_id: number;
  collection_name: string;
  artist_name: string;
  artwork_url: string;
  genre: string;
  track_count: number;
  created_at?: string;
}

// To do the process in one endpoint i need this function to fetch then store to prostgres
export const fetchAndStorePodcasts = async (searchTerm: string) => {
  // Fetch
  const response = await fetch(
    `https://itunes.apple.com/search?term=${searchTerm}&media=podcast&entity=podcast&limit=20`
  );
  const data = await response.json();

  // match the data on my desired database table (found columns in stackoverflow)
  const podcasts: Podcast[] = data.results.map((item: any) => ({
    collection_id: item.collectionId,
    collection_name: item.collectionName,
    artist_name: item.artistName,
    artwork_url: item.artworkUrl600 || item.artworkUrl100,
    genre: item.primaryGenreName,
    track_count: item.trackCount,
  }));

  // Check which podcasts already exist
  const existingIds = await supabase
    .from("podcasts")
    .select("collection_id")
    .in(
      "collection_id",
      podcasts.map((p) => p.collection_id)
    );

  if (existingIds.error) {
    return { error: existingIds.error.message };
  }

  const existingCollectionIds = new Set(
    existingIds.data?.map((item) => item.collection_id) || []
  );

  // Filter out podcasts that already exist
  const newPodcasts = podcasts.filter(
    (podcast) => !existingCollectionIds.has(podcast.collection_id)
  );

  // Insert only new podcasts
  if (newPodcasts.length > 0) {
    const { data: insertedData, error } = await supabase
      .from("podcasts")
      .insert(newPodcasts)
      .select();

    if (error) {
      return { error: error.message };
    }
    return { success: true, data: insertedData };
  } else {
    return { success: true, data: [] };
  }
};

// Server-side search function for podcasts
export const searchPodcastsFromDB = async (searchTerm: string) => {
  const { data, error } = await supabase
    .from("podcasts")
    .select("*")
    .or(
      `collection_name.ilike.%${searchTerm}%,artist_name.ilike.%${searchTerm}%,genre.ilike.%${searchTerm}%`
    )
    .order("created_at", { ascending: false });

  if (error) {
    return { error: error.message };
  }

  // Simple deduplication - keep first occurrence of each collection_id
  const uniquePodcasts =
    data?.filter(
      (podcast: any, index: number, self: any[]) =>
        index ===
        self.findIndex((p) => p.collection_id === podcast.collection_id)
    ) || [];

  return { success: true, data: uniquePodcasts };
};

export const getAllPodcasts = async () => {
  const { data, error } = await supabase
    .from("podcasts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return { error: error.message };
  }

  return { success: true, data };
};
