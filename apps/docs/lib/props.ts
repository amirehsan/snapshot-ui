import { createFileSystemGeneratorCache, createGenerator } from 'fumadocs-typescript';

/** Reads prop types and their JSDoc from the library's source. One instance, cached on disk. */
export const generator = createGenerator({
  cache: createFileSystemGeneratorCache('.next/fumadocs-typescript'),
});
