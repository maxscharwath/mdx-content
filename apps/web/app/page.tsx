import { sources } from '../mdx-content.config'
import Link from 'next/link'

export const revalidate = 3600;

async function getPageBundle() {
  return sources.posts;
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
