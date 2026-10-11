import { Badge, Eyebrow, Link } from '@snapshot-ui/react';
import pkg from '@snapshot-ui/react/package.json';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { ReactElement } from 'react';
import { getMDXComponents } from '@/components/mdx';
import { DocsHeader } from '@/components/shell/header';
import { Toc } from '@/components/shell/toc';
import { source } from '@/lib/source';

const GITHUB = 'https://github.com/amirehsan/snapshot-ui';

export default async function Page(props: PageProps<'/docs/[[...slug]]'>): Promise<ReactElement> {
  const { slug } = await props.params;
  const page = source.getPage(slug);
  if (!page) notFound();
  const MDX = page.data.body;
  const group = page.slugs[0] === 'components' ? 'Components' : 'Getting started';

  return (
    <>
      <DocsHeader group={group} title={page.data.title} />
      <main className="content" id="main">
        {page.data.description ? <p className="page-lede">{page.data.description}</p> : null}
        <div className="panel">
          <div className="panel-main">
            <MDX components={getMDXComponents()} />
          </div>
          <aside className="panel-side" aria-label="On this page">
            {page.data.toc.length > 0 ? (
              <section className="card toc-card">
                <Eyebrow style={{ marginBottom: 18 }}>On this page</Eyebrow>
                <Toc items={page.data.toc} />
              </section>
            ) : null}
            <section className="card">
              <Eyebrow style={{ marginBottom: 18 }}>Package</Eyebrow>
              <div className="meta">
                <div className="meta-row">
                  <span>Version</span>
                  <Badge>{pkg.version}</Badge>
                </div>
                <div className="meta-row">
                  <span>Source</span>
                  <Link href={`${GITHUB}/edit/main/apps/docs/content/docs/${page.path}`}>Edit this page</Link>
                </div>
                <div className="meta-row">
                  <span>Built on</span>
                  <Link href="https://react-aria.adobe.com">React Aria</Link>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </main>
    </>
  );
}

export function generateStaticParams(): { slug?: string[] }[] {
  return source.generateParams();
}

export async function generateMetadata(props: PageProps<'/docs/[[...slug]]'>): Promise<Metadata> {
  const { slug } = await props.params;
  const page = source.getPage(slug);
  if (!page) notFound();
  return { title: page.data.title, description: page.data.description };
}
