import { defineDocumentType, InferDocument } from 'mdx-content'

export const post = defineDocumentType({
  name: 'post',
  filePathPattern: 'posts/**/*.mdx',
  fields: {
    title: z => z.string().transform(v => v.toUpperCase()),
    publishedAt: z => z.date(),
    status: z => z.enum(['draft', 'published']),
  },
  computedFields: {
    slug(source) {
      return source.file.filename.replace(/\.mdx$/, '')
    },
    headings(source) {
      return Array.from(source.body.raw.matchAll(/(?<hash>#{1,6})\s+(?<content>.+)/g))
        .map(({groups}) => {
          const content = groups!.content!.trim();
          return ({
            depth: groups!.hash?.length,
            content,
          });
        });
    },
  },
});

export type Post = InferDocument<typeof post>;
