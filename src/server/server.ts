import Fastify from "fastify";
import cors from "@fastify/cors";
import dotenv from "dotenv";
import path from "path";
import {
  fetchAndStorePodcasts,
  searchPodcastsFromDB,
} from "../dbService/supabase";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const fastify = Fastify({ logger: true });

fastify.register(cors, {
  origin: true,
});

fastify.post("/search", async (request) => {
  const { searchTerm } = request.body as { searchTerm: string };

  // to avoid use external APIs i need to search in my database first
  // Hmmmmmmmm, Why don't we use Redis here instead?
  const existingResults = await searchPodcastsFromDB(searchTerm);

  // If we found results, return them
  if (
    existingResults.success &&
    existingResults.data &&
    existingResults.data.length > 0
  ) {
    return existingResults;
  }

  // If no results found -> fetch from iTunes API and store it in my database
  const storeResult = await fetchAndStorePodcasts(searchTerm);

  if (!storeResult.success) {
    return storeResult;
  }

  // Return the newly stored data from my database
  const newResults = await searchPodcastsFromDB(searchTerm);
  return newResults;
});

const start = async () => {
  try {
    await fastify.listen({ port: 4000 });
    console.log(" Server running on http://localhost:4000");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
