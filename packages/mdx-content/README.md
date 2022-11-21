# MDX Content

A super fully typed MDX loader for your project.

## Installation

```bash
$ npm install --save-dev mdx-content

$ yarn add -D mdx-content
```

## Usage

### Create some documents definitions
```ts
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
  },
});
```

### Load documents
```ts
export const sources = makeSource({
  documentFolder: 'content',
  documentTypes: [post],
});
```

### Use documents
```tsx
import { useDocument } from 'mdx-content'
const { posts } = sources;

(await posts).forEach(post => {
  console.log(post.title);
  console.log(post.slug);
  console.log(post.publishedAt);

  const PostComponent = useDocument(post);
});
```
