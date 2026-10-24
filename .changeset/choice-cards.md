---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Add ChoiceCards and ChoiceCard: a single choice drawn as cards, each with a title, an optional sentence, a detail such as a price, and an icon or a picture. It is a radio group: `name`, `value`, `isRequired` and form reset work as on RadioGroup, and a card is chosen by a press anywhere on it, even before the page's scripts run. Each radio is named by its title alone and described by its sentence and detail. Pictures are decoration: give them `alt=""`. Put no links or buttons inside a card. `layout="grid"` for tiles; the default `list` for rows. In a Card every card takes the card's concentric corner. `choice-cards.css` in `styles.css`.
