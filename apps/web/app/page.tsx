import { getMDXComponent } from 'mdx-bundler/client'
import { post } from '../content/definitions/Posts'
import { makeSource } from 'mdx-content'

async function getPageBundle() {
  const sources = await makeSource({
    documentFolder: 'content',
    documentTypes: [post],
    mdxOptions: {
      remarkPlugins: [],
      rehypePlugins: [],
    }
  })
  return sources.posts
}

export default async function Page() {
  const posts = await getPageBundle();

  const Component = getMDXComponent(posts[0].body.code);

  return <Component />
}
