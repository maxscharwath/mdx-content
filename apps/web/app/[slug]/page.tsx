import { post } from '../../content/definitions/Posts'
import { notFound } from 'next/navigation'
import { sources } from '../../mdx-content.config'

export async function generateStaticParams() {
  const { posts } = await sources;
  return posts.map(({metadata}) => ({
    slug: metadata.slug,
  }));
}

async function getPost(slug: string) {
  const { posts } = await sources;
  return posts.find(({metadata}) => metadata.slug === slug);
}



export default async function Page({params}: {params: {slug: string}}) {
  const post = await getPost(params.slug);

  if (!post) {
    notFound();
  }

  return (
      <div>
        <h1>{post.metadata.title}</h1>
        <code>
          <pre>{JSON.stringify(post.metadata, null, 2)}</pre>
        </code>
        <post.body.component />
      </div>
  )
}
