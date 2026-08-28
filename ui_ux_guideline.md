# Nirikshak AI — Frontend Theme Guidelines

> **Rule:** All future frontend work must follow the existing Nirikshak AI visual theme. Do not introduce a new visual style unless explicitly requested.

## 1. Visual Identity
- Product: **Nirikshak AI**
- Purpose: AI-powered intelligence for MPLADS monitoring.
- Overall feel: **premium, minimal, trustworthy, analytical, government-tech focused**.
- Keep the interface clean and spacious; avoid overly flashy UI.

## 2. Colors
Use the existing theme first and reuse existing CSS variables/tokens whenever available.

- Background: warm **cream / off-white**
- Primary text: dark **navy / near-black**
- Accent: **teal / mint**
- Secondary accent: **yellow / gold**
- Risk colors:
  - Low → teal/green
  - Medium → yellow/gold
  - High → orange
  - Critical → red
- Avoid introducing unrelated bright colors.

## 3. Typography
- Keep the existing typography hierarchy.
- Headings: elegant serif/display style where already used.
- Navigation, labels and body text: clean sans-serif.
- Use strong hierarchy without excessive font sizes.
- Do not randomly change fonts between sections.

## 4. Layout & Spacing
- Prefer wide, balanced layouts with generous whitespace.
- Maintain consistent horizontal page margins.
- Keep sections visually separated without excessive decoration.
- Use responsive grids that collapse naturally on smaller screens.
- Reuse existing container widths and spacing tokens.

## 5. Cards & Containers
- Thin dark/subtle borders.
- Moderate rounded corners.
- Very subtle shadows only where useful.
- Cream/white surfaces against the cream page background.
- Keep cards minimal and information-focused.

## 6. Buttons
- Teal primary buttons with dark border/outline where consistent with the current design.
- Secondary buttons should remain minimal and outlined.
- Preserve existing button dimensions and typography unless a change is required.
- All buttons should have:
  - smooth hover transition
  - slight lift on hover
  - visible press-down effect on mouse/touch press
  - reduced shadow/translate on press
- Do not use exaggerated bounce effects.

## 7. Navigation & Logo
- **NIRIKSHAK AI logo must remain consistent everywhere.**
- Do not redesign or replace the logo when working on another section.
- Keep the existing header/navigation styling and alignment unless explicitly asked to change placement.
- Navigation should remain clean, centered/balanced and responsive.

## 8. Icons
- Prefer the existing icon library/style.
- Use simple line icons that match the current visual language.
- Keep icon sizes and stroke weights consistent.
- Do not mix unrelated icon styles.

## 9. Animations
Use subtle, premium motion:
- Scroll-reveal for sections entering the viewport.
- Smooth fade/slide transitions.
- Stagger cards/text when appropriate.
- Buttons use the existing hover/press interaction.
- Avoid excessive parallax, bouncing, spinning or distracting effects.
- Animations must not affect layout stability.

## 10. Risk & Data Visualizations
- Data should look analytical and trustworthy.
- Use the established risk colors consistently.
- Charts, maps, scores and indicators should visually belong to the same design system.
- Prefer clear labels and restrained decoration.

## 11. Footer & Pre-Footer
- Keep the same Nirikshak AI theme as the rest of the website.
- Pre-footer sections may use large visual storytelling, high-quality MPLADS/government-project imagery and strong typography.
- Footer should remain clean, structured and responsive.
- Do not reuse unrelated reference-site content; only reuse its layout inspiration when explicitly requested.

## 12. Responsive Design
- Desktop, tablet and mobile layouts must all be supported.
- Prevent navigation/button overlap.
- Cards should stack cleanly on mobile.
- Preserve readable typography and comfortable touch targets.
- Never solve responsiveness by breaking the desktop layout.

## 13. Implementation Rules
- **Reuse existing components, CSS variables, tokens and utility classes first.**
- Do not create duplicate styles for something that already exists.
- Keep existing functionality unchanged unless the task specifically requires it.
- Do not unnecessarily modify unrelated sections.
- New components must visually integrate with existing Nirikshak AI components.
- Keep demo data easy to replace with real API/database data later.

## 14. Do Not
- Do not introduce a completely new color palette.
- Do not introduce a different typography system.
- Do not redesign the logo.
- Do not randomly change existing spacing/layout.
- Do not add excessive gradients, glassmorphism or neon effects.
- Do not add unrelated decorative elements.
- Do not change existing sections while implementing an isolated feature.

## 15. Bilingual (English + Hindi) Support Requirement
- **English is the default language (`en`)**; **Hindi is the selectable language (`hi`)**.
- **100% Internationalization**: Every screen, card, modal, drawer, form, tooltip, alert, footer, and navigation element must support both English and Hindi.
- **Never Hardcode User-Facing Text**: Always use the centralized dictionaries (`frontend/src/i18n/locales/en.js` & `hi.js`) and the `useLanguage()` hook.
- **Strict Non-Translation Rule**: The following items must NEVER be translated into Hindi or altered:
  - `"Nirikshak AI"` / `"NIRIKSHΛK ΛI"`
  - `"MPLADS"` / `"MPLΛDS"`
  - Project IDs (e.g., `"MPLADS-2026-8871"`)
  - Technical model and scheme codes (e.g., `"SIH26102"`, `"MoSPI"`)
  - Numbers and percentages (e.g., `"2,847"`, `"87"`, `"90%"`, `"40%"`)
  - Currency values (e.g., `"₹1,245 Cr"`, `"₹45,00,000"`, `"₹28.4 Cr"`)
- **Persistence**: Selected language choice must persist across page navigation and refresh (`localStorage` key: `'nirikshak_language'`).
- **Devanagari Typography**: Font fallbacks include `'Noto Sans Devanagari'` with balanced line heights and letter-spacing for optimal legibility.

## Final Rule
**Every future frontend change must look like it was designed as part of the same Nirikshak AI website. Reuse the existing theme and components first; extend the design system only when necessary.**

