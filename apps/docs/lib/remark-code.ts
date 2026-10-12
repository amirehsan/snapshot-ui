/** The part of an mdast node this plugin reads and writes. The full types live in @types/mdast, which the docs do not depend on. */
interface MdastNode {
  type: string;
  value?: string;
  lang?: string | null;
  children?: MdastNode[];
  [key: string]: unknown;
}

/**
 * Turns every fenced block in an MDX page into the docs' own `<Code>` block.
 *
 * Code is written in a fence and not in `<Code code={`...`} />` because MDX
 * strips up to two columns of indentation from every continuation line of a JS
 * expression, a template literal included (micromark-extension-mdx-expression
 * eats `indentSize` = 2 so that an expression nested in markdown reads like the
 * JS around it). A fence is markdown and is not touched, so the code on the page
 * is the code in the file, and so is the text the copy button copies.
 */
export function remarkCode(): (tree: MdastNode) => void {
  const convert = (parent: MdastNode): void => {
    const { children } = parent;
    if (!children) return;
    children.forEach((child, index) => {
      if (child.type !== 'code') {
        convert(child);
        return;
      }
      const attributes = [{ type: 'mdxJsxAttribute', name: 'code', value: child.value ?? '' }];
      if (child.lang) attributes.push({ type: 'mdxJsxAttribute', name: 'lang', value: child.lang });
      children[index] = { type: 'mdxJsxFlowElement', name: 'Code', attributes, children: [] };
    });
  };
  return convert;
}
