import { notFound } from 'next/navigation'
import { sources } from '../../mdx-content.config'
import { useDocument } from 'mdx-content'

export const revalidate = 3600;

export async function generateStaticParams() {
  return (await sources.posts).map(({slug}) => ({
    slug,
  }));
}

async function getPost(slug: string) {
  return (await sources.posts).find((post) => post.slug === slug);
}



export default async function Page({params}: {params: {slug: string}}) {
  const post = await getPost(params.slug);

  if (!post) {
    notFound();
  }

  const PostComponent = useDocument(post);

  return (
      <div>
        <h1>{post.title}</h1>
        <code>
          <pre>{JSON.stringify(post, null, 2)}</pre>
        </code>
        <PostComponent
          components={{
            h1: (props) => <h1 style={{backgroundColor: 'red'}} {...props} />,
          }}
        />
      </div>
  )
}
