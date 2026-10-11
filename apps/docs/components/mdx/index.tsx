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
    h2: ({ children, ...props }) => (
      <h2 className="type-h3" {...props}>
        {children}
      </h2>
    ),
    h3: ({ children, ...props }) => (
      <h3 className="type-h4" {...props}>
        {children}
      </h3>
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
