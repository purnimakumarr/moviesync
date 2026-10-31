// Embeds every cached movie that has no embedding yet, fetching its plot from
// TMDB first when it was cached without one.
//   npm run backfill:embeddings
import 'dotenv/config';
import pool from '../db';
import { embedMovies, toSqlVector } from '../services/embeddings';
import { getDetails, MediaType } from '../services/tmdb';

const BATCH_SIZE = 16;
// TMDB allows around 50 requests a second.
const TMDB_DELAY_MS = 50;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type Row = {
  tmdb_id: number;
  media_type: MediaType;
  title: string;
  genre: string;
  plot: string | null;
};

const fillMissingPlots = async (rows: Row[]) => {
  for (const row of rows.filter((r) => !r.plot)) {
    try {
      const details = await getDetails(row.media_type, row.tmdb_id);
      if (details?.overview) {
        row.plot = details.overview;
        await pool.query(
          'UPDATE movie_cache SET plot = $1 WHERE media_type = $2 AND tmdb_id = $3',
          [row.plot, row.media_type, row.tmdb_id],
        );
      }
    } catch (error) {
      console.warn(
        `Could not fetch plot for ${row.media_type} ${row.tmdb_id}:`,
        (error as Error).message,
      );
    }
    await sleep(TMDB_DELAY_MS);
  }
};

const main = async () => {
  const { rows } = await pool.query<Row>(
    'SELECT tmdb_id, media_type, title, genre, plot FROM movie_cache WHERE embedding IS NULL ORDER BY media_type, tmdb_id',
  );
  console.log(`${rows.length} movies need embeddings`);

  let done = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    await fillMissingPlots(batch);

    const embeddings = await embedMovies(
      batch.map((row) => ({ title: row.title, genre: row.genre, plot: row.plot })),
    );
    for (const [index, row] of batch.entries()) {
      await pool.query(
        'UPDATE movie_cache SET embedding = $1 WHERE media_type = $2 AND tmdb_id = $3',
        [toSqlVector(embeddings[index]), row.media_type, row.tmdb_id],
      );
    }

    done += batch.length;
    console.log(`Embedded ${done}/${rows.length}`);
  }

  const missingPlots = rows.filter((row) => !row.plot).length;
  if (missingPlots > 0) {
    console.log(`${missingPlots} movies have no plot; embedded from title and genre only.`);
  }
};

main()
  .catch((error) => {
    console.error('Backfill failed:', error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
