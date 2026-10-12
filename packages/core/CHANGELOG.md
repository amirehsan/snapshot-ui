# @snapshot-ui/core

## 0.1.0

### Minor Changes

- d030c30: Add Card, a static lifted surface with CardHeader, CardTitle, CardNote and CardBody parts.
- d9924f7: Add Checkbox and CheckboxGroup: a 20px box in a 40px row that is the whole label, with an ink fill and a canvas mark that reads in both themes, and a group that follows the field contract.
- d3e6e6c: Add the field parts: Label, Description, FieldError, FieldCounter and FieldChanged, with the `field` classes and the `data-changed` state.
- bd4637d: First release. Design tokens with the color mode and corner shape axes, the Tailwind v4 theme, and the Button and Spinner components.
- f117ed7: Add the `--focus-ring-color` token, which every focus ring now reads, so a theme can recolor all rings from one variable. Declare `@snapshot-ui/core` as an optional peer of `@snapshot-ui/react`, so an install that includes both keeps them on matching versions.
- 34cc6ca: Add IconButton.
- 28971f6: Add Link, Kbd and Badge. Link is an inline link in Link Blue with hover, press and focus states. Kbd is a key hint. Badge is a short outlined label in neutral, info, success or error.
- 97aafd5: Add RadioGroup and Radio: full-pill option rows with the chosen row as the ink pill and a check in its ring, a label row with the Changed chip, a hint, an error line, and an error edge on the rows.
- d6f8c03: Add SegmentedControl and SegmentedControlItem: a few short options in a 48px pill track, stacked one per row when the row does not fit.
- 891cf04: Add Switch: the 52px track and round thumb with its label, optional hint and Changed chip, whose thumb keeps the same gap at both ends and whose disabled look differs when it is on.
- 12620fe: Add TextArea: the multi-line field, with the label row, hint, error line, changed and invalid edges and optional length count of TextField on a 6rem box that resizes vertically.
- a61167d: Add TextField and Input: the 48px pill input with its label row, hint, error line, changed and invalid edges and optional length count.
- f156054: Add Heading, Text and Eyebrow.

### Patch Changes

- 922e069: List the components in the READMEs.
