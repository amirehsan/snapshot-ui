# Vazirmatn

The Persian face the right-to-left Prose stories draw in, served from Storybook's static folder so the
visual baselines, which run in a Docker image with no network, draw it and not the image's fallback
Arabic face. `apps/storybook/.storybook/fonts.css` declares it.

- **Font:** Vazirmatn, the variable font with one weight axis (100 to 900), so 450 and 500 draw.
- **Version:** 33.003, the project's release published to npm as `vazirmatn@33.0.3` by its author
  (git head `83629f877e8f084cc07b47030b5d3a0ff06c76ec` of https://github.com/rastikerdar/vazirmatn).
  The tarball's sha512 matched the registry's integrity,
  `sha512-fbjNc0CMjazZpIegWzz9OHGzI1APFboT+x7ZecXlUCtDe/nkyx7gtCTZnWS/+eeXG7fbfXymCPKJI8EsnM3iqw==`.
- **Files,** copied unchanged from the package:
  - `Vazirmatn[wght].woff2`, from `fonts/webfonts/`, 111152 bytes, sha256
    `4e3fa217d38fdafc1fea4414ceb58ca5e662cf0ab5fa735a8c8c20e8b42cad92`.
  - `OFL.txt`, the SIL Open Font License 1.1 the font is released under, sha256
    `17e355067c8284f47743a1ee3b1ef7ff684ff0601eda357f9353b10b3016ab31`.

To update, take the new release's `fonts/webfonts/Vazirmatn[wght].woff2` and `OFL.txt`, record the
version and both checksums here, and regenerate the right-to-left Prose baselines.
