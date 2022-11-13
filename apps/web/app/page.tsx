import { sources } from '../mdx-content.config'

async function getPageBundle() {
  return (await sources).posts;
}

export default async function Page() {
  const posts = await getPageBundle();

  return (
    <div>
      {posts.map((post) => (
        <div key={post.file.filename}>
          <h1>{post.metadata.title}</h1>
        </div>
      ))}
    </div>
  )
}
