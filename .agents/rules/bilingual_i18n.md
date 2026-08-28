---
trigger: manual
description: "Permanent Bilingual (English + Hindi) Frontend Requirement for Nirikshak AI"
globs: ["frontend/**", "src/**"]
---

# Nirikshak AI Bilingual (English + Hindi) Requirement

Bilingual support (**English + Hindi**) is a **PERMANENT CORE REQUIREMENT** for Nirikshak AI.

## Core Rules

1. **Default & Selectable Languages**:
   - **English (`en`)** is the default language.
   - **Hindi (`hi`)** is the selectable language.
   - The active language must persist across page navigation and reloads using `localStorage` key `'nirikshak_language'`.

2. **Zero Hardcoded User-Facing Strings**:
   - Never hardcode user-facing strings, headers, labels, placeholders, button text, alert dialogs, tooltips, or descriptions directly in JSX/HTML.
   - All text must be sourced from the centralized dictionaries:
     - `frontend/src/i18n/locales/en.js`
     - `frontend/src/i18n/locales/hi.js`
   - Use the `useLanguage()` hook in React components:
     ```jsx
     import { useLanguage } from '../context/LanguageContext';
     const { t, language, isHindi } = useLanguage();
     // Access: {t('section.key')}
     ```

3. **Mandatory 1:1 Translation for Every New Feature / Screen**:
   - Whenever any new screen, modal, drawer, form, chart, table, card, report, or component is added, you MUST add its corresponding English (`en.js`) and Hindi (`hi.js`) key-value pairs simultaneously.

4. **Strict Non-Translation Exceptions (Preserve Exactly)**:
   The following terms, IDs, numbers, and currencies must **NEVER** be translated into Hindi or transliterated:
   - Brand names: `"Nirikshak AI"`, `"NIRIKSHΛK ΛI"`
   - Scheme name: `"MPLADS"`, `"MPLΛDS"`
   - Project IDs / References: e.g. `"MPLADS-2026-8871"`, `"MPLADS-8871"`, `"MPLADS-4412"`
   - Technical model & scheme identifiers: e.g. `"SIH26102"`, `"MoSPI"`
   - Numerals, percentages & metrics: e.g. `"2,847"`, `"87"`, `"90%"`, `"40%"`, `"01"`, `"02"`
   - Currency values: e.g. `"₹1,245 Cr"`, `"₹45,00,000"`, `"₹28.4 Cr"`

5. **Language Switcher Consistency**:
   - The `<LanguageSwitcher />` component must remain accessible across all navigation headers and mobile drawers.
   - Visual styling, color palettes, micro-animations, and retro-ink aesthetic must remain identical in both languages.