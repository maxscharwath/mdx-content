import { makeSource } from 'mdx-content'
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypePrettyCode from 'rehype-pretty-code';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';

import { post } from '../content/definitions/Posts'
import {rehypeAutolinkHeadingsOptions, rehypePrettyCodeOptions} from '../lib/rehypeOptions'

async function getPageBundle() {
  const sources = await makeSource({
    documentFolder: 'content',
    documentTypes: [post],
    mdxOptions: {
      remarkPlugins: [[remarkGfm]],
      rehypePlugins: [
        [rehypeSlug],
        [rehypePrettyCode, rehypePrettyCodeOptions],
        [rehypeAutolinkHeadings, rehypeAutolinkHeadingsOptions],
      ],
    },
  })
  return sources.posts
}

export default async function Page() {
  const posts = await getPageBundle();

  return (
    <div>
      {posts.map((post) => (
        <div key={post.path}>
          <h1>{post.metadata.title}</h1>
          <code>
            <pre>{JSON.stringify(post.metadata, null, 2)}</pre>
          </code>
          <post.body.component />
        </div>
      ))}
    </div>
  )
}
