import { sources } from '../mdx-content.config'
import Link from 'next/link'

async function getPageBundle() {
  return (await sources).posts;
}

export default async function Page() {
  const posts = await getPageBundle();

  return (
    <div>
      {posts.map((post) => (
        <div key={post.file.filename}>
          <Link href={`/${post.metadata.slug}`}>
            {post.metadata.title}
          </Link>
        </div>
      ))}
    </div>
  )
}
