import typescript from '@rollup/plugin-typescript';
const keysTransformerFactory = (await import('ts-transformer-keys/transformer.js')).default.default; // exported in a weird way so the only way to import it is like this

export default {
  input: 'index.ts',
  output: {
    file: '../dist/_worker.js',
  },
  external: ['lodash/pick'],
  plugins: [
    typescript({
      transformers: {
        before: [
          {
            type: 'program',
            factory: keysTransformerFactory,
          },
        ],
      },
    }),
  ],
};
