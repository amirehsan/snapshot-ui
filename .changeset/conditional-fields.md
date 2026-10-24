---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Add ConditionalFields: fields that show when a gate, such as a Switch, turns on. Place it right after the gate and point the gate's `aria-controls` at its `id`. While hidden the fields keep what was typed, so turning the gate back on brings it back, but they are left out of the form's submission and its browser checks, so a hidden required field never blocks a save and a hidden secret is never sent. Read the gate on the server to know what an absent field means, or pass `submitsWhenHidden` to send hidden fields. Switch and Checkbox pass `aria-controls` to their input; a RadioGroup or a Select drops it, so a group it gates warns in development. If the group hides while focus is in it, focus goes to the gate, or to the control before the group when the gate cannot take focus. `field-extras.css` in `styles.css`.
