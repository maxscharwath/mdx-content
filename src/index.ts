import type {InferDocument} from './lib';
import {defineDocumentType, makeSource} from './lib';

const postDocumentType = defineDocumentType({
	name: 'post',
	filePathPattern: 'posts/**/*.mdx',
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

const blogsDocumentType = defineDocumentType({
	name: 'blogs',
	filePathPattern: 'blogs/**/*.mdx',
	fields: {
		tags: z => z.array(z.string()),
	},
	computedFields: {
		count: source => source.metadata.tags.length as number,
	},
});

  type Post = InferDocument<typeof postDocumentType>;

(async () => {
	const {posts} = await makeSource({
		cwd: 'content',
		documentTypes: [postDocumentType, blogsDocumentType],
	});

	console.log(posts[0]?.metadata);

	const post: Post = posts[0]!;

	console.log(post.metadata);
})();
