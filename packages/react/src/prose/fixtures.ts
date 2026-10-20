/*
 * The Markdown the Prose tests and stories render, written as the consumer's model writes it: a monthly report
 * and a weekly coaching note in English, and the goals guide in Persian. Test and story data only; nothing
 * imports it from src/index.ts, so it never ships.
 */

/**
 * A monthly report as a model writes it, with everything a model may send that the reader must not follow or
 * load: a link, a bare address, an image with alt text, one with none, inline and block HTML, and a table of six
 * columns that is wider than a phone; and a GFM footnote, whose in-page links the map keeps.
 */
export const MONTHLY_REPORT = `## October at a glance

You spent **$3,284.10** in October, $212.00 less than in September. Most of the drop came from *eating out*, which fell by a third, while groceries rose a little.

### Where it went

1. Rent, $1,450.00, the same as every month.
2. Groceries, $612.40, up from $588.15.
3. Eating out, $286.90, down from $431.00.[^refunds]

- Corner Mart was your most frequent stop, with 14 visits.
- Two refunds came back: $42.00 from Hardware Hub and $18.50 from City Books.

> A month with fewer evenings out is a month with more room for the travel fund.

See [your transactions](https://example.com/transactions) for every entry, or https://example.com/reports/2026/october/spending-by-category?view=table&compare=september for the full table.

![Spending by category in October, rent first](https://example.com/charts/october.png)

The chart above ![](https://example.com/pixel.gif) is drawn from the same figures as the table below, and <b>this bold</b> was written as HTML.

<div onclick="alert('report')">A block of HTML the model wrote, which never reaches the page.</div>

| Category | September | October | Change | Share | Budget |
| --- | ---: | ---: | ---: | ---: | ---: |
| Rent | $1,450.00 | $1,450.00 | $0.00 | 44% | $1,450.00 |
| Groceries | $588.15 | $612.40 | +$24.25 | 19% | $650.00 |
| Eating out | $431.00 | $286.90 | -$144.10 | 9% | $300.00 |
| Transport | $214.60 | $198.30 | -$16.30 | 6% | $250.00 |
| Utilities | $176.20 | $181.75 | +$5.55 | 6% | $200.00 |

To change a limit, open \`Budgets\` and edit the category.

[^refunds]: Refunds are counted in the month they arrive.
`;

/** A weekly coaching note, shorter: a heading, a few sentences, steps and a tip. */
export const COACHING_NOTE = `## Your week

You stayed under your groceries budget for the third week running. Eating out is at $96.40 of $75.00, so the weekend is the place to save.

### Three things to try

1. Plan two dinners at home before Friday.
2. Move $20.00 to the travel fund on payday, before it is spent.
3. Check your subscriptions: two renew next week.

> Small, regular moves add up faster than one big cut.
`;

/**
 * The goals guide in Persian, the app's own content, so it keeps its real link: numbered steps, emphasis,
 * inline code and a code block that stay left to right, a figure that reads left to right, and a small table. Each
 * amount sits in a left-to-right isolate, U+2066 to U+2069: after Persian letters a currency sign before figures is
 * otherwise drawn on their right, as "1,250.00$".
 */
export const GOALS_GUIDE_FA = `## راهنمای هدف‌ها

هدف، مبلغی است که برای چیزی کنار می‌گذارید: یک سفر، صندوق اضطراری یا یک لپ‌تاپ تازه. هر ماه سهمی از درآمدتان به آن می‌رسد و پیشرفتش را *هر هفته* می‌بینید.

### ساختن یک هدف

1. در صفحه‌ی هدف‌ها، **هدف تازه** را بزنید.
2. نام هدف و مبلغ آن را بنویسید، مثلاً «سفر بهاری».
3. تاریخی را که می‌خواهید به هدف برسید انتخاب کنید.

### پیش از شروع

- هدف‌ها را از پرونده‌ی \`goals.csv\` هم می‌توانید وارد کنید.
- مبلغ‌ها از چپ به راست نوشته می‌شوند، مانند \u2066$1,250.00\u2069 در ماه.

\`\`\`
date,name,amount
2026-11-01,Spring trip,1250.00
\`\`\`

> هدفی که تاریخ دارد، زودتر به دست می‌آید.

| ماه | پس‌انداز | باقی‌مانده |
| --- | ---: | ---: |
| مهر | \u2066$1,250.00\u2069 | \u2066$3,750.00\u2069 |
| آبان | \u2066$1,250.00\u2069 | \u2066$2,500.00\u2069 |

برای جزئیات بیشتر، [راهنمای بودجه‌ها](#budgets) را ببینید.
`;

/** Lists, quotes, code and a table nested four levels deep, which must not push a 320px screen sideways. */
export const NESTED = `## Nested content

- Every account you connect
  - is read each night
    - and every transaction in it
      - is sorted into a category.
- A quote in an item:

  > A rule for a quote in a list.
  >
  > > And a quote in that quote, with a second rule.

1. An ordered item
   1. holds an ordered list
      1. that counts in letters
         1. and then in numerals.

- A code block in an item keeps the item's indent:

  \`\`\`
  export const budget = { groceries: 650, eatingOut: 300, transport: 250, utilities: 200 };
  \`\`\`

> A table in a quote:
>
> | Week | Spent | Left |
> | --- | ---: | ---: |
> | 1 | $182.40 | $467.60 |
> | 2 | $156.10 | $311.50 |
`;
