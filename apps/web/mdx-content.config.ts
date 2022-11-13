import { makeSource } from 'mdx-content'
import { post } from './content/definitions/Posts'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import rehypePrettyCode from 'rehype-pretty-code'
import { rehypeAutolinkHeadingsOptions, rehypePrettyCodeOptions } from './lib/rehypeOptions'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'

export const sources = makeSource({
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
