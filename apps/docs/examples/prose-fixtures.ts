/*
 * The Markdown the Prose page's examples render, as fixtures: the docs site makes no request, so what an app would
 * fetch or a model would write is written here. Each starts at an h2, so the page keeps its one h1.
 */

/** A monthly report the app writes itself, so its links stay links. */
export const REPORT = `## October

You spent **$3,284.10** in October, $212.00 less than in September. Most of the drop came from *eating out*, which fell by a third.

### Where it went

1. Rent, $1,450.00, the same as every month.
2. Groceries, $612.40, up from $588.15.
3. Eating out, $286.90, down from $431.00.

> A month with fewer evenings out is a month with more room for the travel fund.

See [Budgets](/docs/components/prose#rendering-markdown-safely) to change a limit, or export the month with \`snapshot export --month 2026-10\`.

\`\`\`
date,category,amount
2026-10-01,Rent,-1450.00
2026-10-04,Groceries,-82.15
\`\`\`
`;

/**
 * A report as a model writes it, with what the reader must never follow or load: a link, a bare address, an
 * image with alt text and one with none, HTML inline and as a block, a table of six columns, and a GFM footnote,
 * whose in-page links the map keeps.
 */
export const MODEL_OUTPUT = `## October at a glance

You spent **$3,284.10** in October. Most of the drop came from *eating out*, while groceries rose a little.[^refunds]

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

[^refunds]: Refunds are counted in the month they arrive.
`;

/** A weekly coaching note, which the consumer shows in a card. */
export const COACHING_NOTE = `## Your week

You stayed under your groceries budget for the third week running. Eating out is at $96.40 of $75.00, so the weekend is the place to save.

1. Plan two dinners at home before Friday.
2. Move $20.00 to the travel fund on payday, before it is spent.

\`\`\`
Travel fund: $1,240.00 of $2,000.00
\`\`\`
`;

/**
 * The goals guide in Persian, the app's own content, so its link stays a link. The amount sits in a
 * left-to-right isolate, U+2066 to U+2069: after Persian letters a currency sign before figures is otherwise
 * drawn on their right.
 */
export const GOALS_GUIDE_FA = `## راهنمای هدف‌ها

هدف، مبلغی است که برای چیزی کنار می‌گذارید: یک سفر، صندوق اضطراری یا یک لپ‌تاپ تازه. هر ماه سهمی از درآمدتان به آن می‌رسد و پیشرفتش را *هر هفته* می‌بینید.

### ساختن یک هدف

1. در صفحه‌ی هدف‌ها، **هدف تازه** را بزنید.
2. نام هدف و مبلغ آن را بنویسید، مثلاً «سفر بهاری».
3. تاریخی را که می‌خواهید به هدف برسید انتخاب کنید.

- هدف‌ها را از پرونده‌ی \`goals.csv\` هم می‌توانید وارد کنید.
- مبلغ‌ها از چپ به راست نوشته می‌شوند، مانند \u2066$1,250.00\u2069 در ماه.

> هدفی که تاریخ دارد، زودتر به دست می‌آید.

برای جزئیات بیشتر، [راهنمای بودجه‌ها](/docs/components/prose#persian) را ببینید.[^fresh]

[^fresh]: بودجه‌ها هر ماه از نو شروع می‌شوند.
`;
