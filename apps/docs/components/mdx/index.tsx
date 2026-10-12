import { Heading, Link } from '@snapshot-ui/react';
import type { MDXComponents } from 'mdx/types';
import { Code } from './code';
import { Keys } from './keys';
import { Preview } from './preview';
import { PropsTable } from './props-table';
import { Rules } from './rules';
import { Section } from './section';

/** Every element and component MDX pages may use, drawn in Snapshot UI. */
export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    a: ({ children, ...props }) => <Link {...props}>{children}</Link>,
    h2: ({ children, ...props }) => (
      <Heading level={2} size={3} {...props}>
        {children}
      </Heading>
    ),
    h3: ({ children, ...props }) => (
      <Heading level={3} size={4} {...props}>
        {children}
      </Heading>
    ),
    Section,
    Preview,
    Code,
    PropsTable,
    Keys,
    Rules,
    ...components,
  };
}

export const useMDXComponents = getMDXComponents;
