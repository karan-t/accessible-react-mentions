import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';

export default defineConfig({
  // TODO(deploy): replace this placeholder with the real production URL before
  // deploying — sitemap, RSS, and canonical URLs all reference it.
  site: 'https://example.invalid',
  integrations: [
    starlight({
      title: 'accessible-react-mentions',
      description:
        'A modern, strictly WCAG 2.2-compliant React mentions library that works with any text input surface.',
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/karan-t/accessible-react-mentions',
        },
      ],
      sidebar: [
        { label: 'Introduction', slug: 'index' },
        {
          label: 'Guides',
          items: [
            { label: 'Getting started', slug: 'guides/getting-started' },
            { label: 'Migrating from react-mentions', slug: 'guides/migrating' },
            { label: 'TanStack Query adapter', slug: 'guides/tanstack' },
          ],
        },
        {
          label: 'Reference',
          items: [
            { label: 'Mention component', slug: 'reference/mention' },
            { label: 'useMention hook', slug: 'reference/use-mention' },
            { label: 'Adapter interface', slug: 'reference/adapter' },
          ],
        },
        { label: 'WCAG 2.2 receipts', slug: 'wcag', badge: { text: 'a11y', variant: 'success' } },
      ],
      tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 3 },
      lastUpdated: true,
      pagefind: true,
    }),
  ],
});
