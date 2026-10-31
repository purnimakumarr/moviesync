import path from 'path';

// Small (33 MB quantized) English embedding model that runs locally on CPU,
// so mood search needs no paid API. Picked over all-MiniLM-L6-v2 because it
// matched short mood queries to movie plots more reliably in testing.
const MODEL = 'Xenova/bge-small-en-v1.5';
// bge models expect this instruction on queries (not on documents).
const QUERY_PREFIX = 'Represent this sentence for searching relevant passages: ';

type Extractor = (
  texts: string[],
  options: { pooling: 'cls'; normalize: boolean },
) => Promise<{ tolist: () => number[][] }>;

let extractorPromise: Promise<Extractor> | null = null;

// Loaded lazily so the API starts (and tests run) without the model.
const getExtractor = () => {
  if (!extractorPromise) {
    extractorPromise = import('@huggingface/transformers')
      .then(({ env, pipeline }) => {
        env.cacheDir =
          process.env.MODEL_CACHE_DIR || path.join(process.cwd(), '.model-cache');
        return pipeline('feature-extraction', MODEL, { dtype: 'q8' });
      })
      .then((extractor) => extractor as unknown as Extractor)
      .catch((error) => {
        // Allow a later call to retry, e.g. after a network blip.
        extractorPromise = null;
        throw error;
      });
  }
  return extractorPromise;
};

const embedTexts = async (texts: string[]) => {
  const extractor = await getExtractor();
  const output = await extractor(texts, { pooling: 'cls', normalize: true });
  return output.tolist();
};

export type EmbeddableMovie = {
  title?: string | null;
  genre?: string | null;
  plot?: string | null;
};

export const movieEmbeddingText = ({ title, genre, plot }: EmbeddableMovie) =>
  [title, genre, plot].filter((part) => part && part !== 'N/A').join('. ');

export const embedQuery = async (query: string) =>
  (await embedTexts([QUERY_PREFIX + query]))[0];

export const embedMovies = (movies: EmbeddableMovie[]) =>
  embedTexts(movies.map(movieEmbeddingText));

// pgvector's text format: '[0.1,0.2,...]'
export const toSqlVector = (vector: number[]) => `[${vector.join(',')}]`;

export const warmUpEmbeddings = () =>
  getExtractor().then(
    () => console.log(`Embedding model ready: ${MODEL}`),
    (error) => console.error('Embedding model failed to load:', error),
  );
