import { post } from '../../content/definitions/Posts'
import { notFound } from 'next/navigation'
import { sources } from '../../mdx-content.config'
import { DocumentComponent } from 'mdx-content'

export const revalidate = 3600;

export async function generateStaticParams() {
  return (await sources.posts).map(({metadata}) => ({
    slug: metadata.slug,
  }));
}

async function getPost(slug: string) {
  return (await sources.posts).find(({metadata}) => metadata.slug === slug);
}



export default async function Page({params}: {params: {slug: string}}) {
  const post = await getPost(params.slug);

  if (!post) {
    notFound();
  }

  const PostComponent = DocumentComponent(post);

  return (
      <div>
        <h1>{post.metadata.title}</h1>
        <code>
          <pre>{JSON.stringify(post.metadata, null, 2)}</pre>
        </code>
        <PostComponent
          components={{
            h1: (props) => <h1 style={{backgroundColor: 'red'}} {...props} />,
          }}
        />
      </div>
  )
}
