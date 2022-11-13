import type {Options as PrettyCodeOptions} from 'rehype-pretty-code';
import type {Options as AutolinkHeadingsOptions} from 'rehype-autolink-headings';
import {h} from 'hastscript';

export const rehypePrettyCodeOptions: Partial<PrettyCodeOptions> = {
	theme: 'one-dark-pro',
	onVisitHighlightedLine(node) {
		node.properties.className.push('highlighted');
	},
};

export const rehypeAutolinkHeadingsOptions: Partial<AutolinkHeadingsOptions> = {
	behavior: 'wrap',
	properties: {className: ['anchor']},
	content: h('span', {className: ['anchor-icon']}, '#'),
};
