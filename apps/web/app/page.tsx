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

  return (
    <div>
      {posts.map((post) => (
        <div key={post.path}>
          <h1>{post.metadata.title}</h1>
          <post.body.component />
        </div>
      ))}
    </div>
  )
}
