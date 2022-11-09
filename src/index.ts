import type {InferDocument} from './lib';
import {defineDocumentType, makeSource} from './lib';

(async () => {
	const postDocumentType = await defineDocumentType({
		name: 'post',
		filePathPattern: 'content/posts/**/*.mdx',
		fields: {
			title: z => z.string().transform(v => v.toUpperCase()),
			publishedAt: z => z.date(),
			status: z => z.enum(['draft', 'published']),
		},
		computedFields: {
			headings(source) {
				return Array.from(source.body.raw.matchAll(/(?<hash>#{1,6})\s+(?<content>.+)/g))
					.map(({groups}) => {
						const content = groups!.content!.trim();
						return ({
							depth: groups!.hash?.length,
							content,
						});
					});
			},
		},
	});

	const blogsDocumentType = await defineDocumentType({
		name: 'blogs',
		filePathPattern: 'content/blogs/**/*.mdx',
		fields: {
			tags: z => z.array(z.string()),
		},
		computedFields: {
			count: source => source.metadata.tags.length,
		},
	});

  type Post = InferDocument<typeof postDocumentType>;

  const {posts} = makeSource({
  	cwd: 'content',
  	documentTypes: [postDocumentType, blogsDocumentType],
  });

  console.log(posts[0]?.metadata);

  const post: Post = posts[0]!;

  console.log(post.metadata);
})();
