# Design System Strategy: The Gilded Editorial

## 1. Overview & Creative North Star
**Creative North Star: The Digital Mint**

This design system is not a standard interface; it is a premium digital artifact. It draws inspiration from high-end horology, fine jewelry, and archival editorial design. We are moving away from the "flat web" by reintroducing the tactile physics of precious metals. The experience is defined by **The Digital Mint**—the idea that every UI element is meticulously struck, embossed, or engraved into a surface of champagne marble. 

By leveraging intentional asymmetry, oversized serif typography, and a hyper-sophisticated approach to metallic light-play, we create a sense of permanence and "old-world" luxury within a modern digital framework.

---

## 2. Colors & Surface Philosophy

The palette is a transition from the earthy stability of deep bronze to the ethereal glow of champagne gold.

### The "No-Line" Rule
Traditional 1px borders are strictly prohibited for sectioning. They feel "cheap" and digital. Boundaries must be defined by:
- **Tonal Transitions:** Moving from `surface` to `surface-container-low`.
- **Materiality:** A brushed gold metallic card (`primary-container`) sitting on a matte marble background (`surface`).

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of materials. 
- **Base Level:** `surface` (#fbf9f5) or `surface-container-lowest` (#ffffff). This is your "marble" canvas.
- **Mid Level:** `surface-container` (#efeeea). Use this for secondary content areas or background groupings.
- **Top Level:** `primary-container` (#c5a059). Use this specifically for metallic "hero" cards.

### The "Glass & Gradient" Rule
To achieve the "Brushed Gold" look requested, never use a flat hex code for primary elements. Utilize linear gradients (45-degree angle) transitioning from `primary` (#775a19) to `primary_container` (#c5a059). For floating navigation or action menus, use Glassmorphism: `surface_container_lowest` at 60% opacity with a `40px` backdrop-blur.

---

## 3. Typography: The Editorial Voice

We utilize a high-contrast pairing between **Noto Serif** (The Authority) and **Manrope** (The Utility).

*   **The Display Scale (Noto Serif):** Used for "Hero" moments. Large, bold, and expressive. `display-lg` (3.5rem) should be used sparingly to anchor a page, often with a slight letter-spacing reduction (-2%) to mimic high-end print.
*   **The Headline Scale (Noto Serif):** Establishes the hierarchy of information. These should feel "engraved" into the page.
*   **The Body & Label Scale (Manrope):** A clean, geometric sans-serif that provides a "modern" counterpoint to the traditional serif. This ensures readability in functional areas. Use `label-md` for metadata, always in Uppercase with `0.05rem` letter spacing to maintain a premium feel.

---

## 4. Elevation, Depth & Metallic Effects

### The Layering Principle (Tonal Depth)
Instead of box-shadows, create depth by nesting. A `surface-container-lowest` card placed on a `surface-container` background creates an "inset" or "protruding" effect naturally.

### 3D Embossed Effects
To mimic the provided reference image, use "Inner Shadows" for metallic containers:
- **Inner Shadow (Top-Left):** Light highlight (Champagne / `primary_fixed`) at 20% opacity.
- **Inner Shadow (Bottom-Right):** Deep Bronze shadow (`on_primary_container`) at 15% opacity.
- This creates the illusion that the gold card is a thick, physical slab.

### Ambient Shadows
For floating elements (like the FAB or primary action buttons), use "Diffusion Shadows":
- **Color:** `on_surface` (#1b1c1a) at 6% opacity.
- **Blur:** `32px` to `48px`.
- **Y-Offset:** `8px` to `12px`.
- Avoid harsh "drop shadows." The goal is a soft, ambient glow that suggests the object is levitating off the marble surface.

### The "Ghost Border" Fallback
If a boundary is required for accessibility, use a "Ghost Border": `outline-variant` (#d1c5b4) at 20% opacity. It should be felt, not seen.

---

## 5. Components

### Buttons & Icons
- **Primary Action:** Gradients using `primary` to `primary_container`. Ensure text is `on_primary` (#ffffff) for maximum contrast.
- **3D Tokens/Icons:** Icons should be treated as "Coins." Use a circular container with a 360-degree conic gradient to simulate a 3D metallic "strike."
- **States:** On hover, increase the brightness of the metallic gradient by 5%. On press, apply an inner shadow to simulate the button being physically depressed.

### Input Fields
- Avoid four-sided boxes. Use a "Soft Inset" style: a `surface_container_low` background with a slightly darker top-inner-shadow to make the field feel carved into the marble.

### Cards & Lists
- **The No-Divider Rule:** Never use horizontal lines to separate list items. Use the **Spacing Scale** (specifically `spacing-4` or `spacing-5`) to create breathing room. 
- **Asymmetric Layouts:** Break the grid. Let images or metallic icons "bleed" over the edge of their container (using negative margins) to create a bespoke, high-end look.

### Navigation (The Signature Bar)
- The bottom navigation should utilize a "Continuous Surface" look. Use `surface_dim` with a heavy backdrop blur. The active state should not be a simple color change, but a "Sunken" or "Glow" effect using `primary_fixed`.

---

## 6. Do's and Don'ts

### Do
*   **DO** use whitespace as a luxury. High-end design "wastes" space to signify importance.
*   **DO** use subtle textures. A 5% opacity "Brushed Metal" or "Marble" overlay on the background adds "soul" that flat colors cannot.
*   **DO** treat typography as an image. Let your `display-lg` headings be the main visual driver of the page.

### Don't
*   **DON'T** use pure black (#000000). Use the `on_surface` and `on_primary_container` tones for a softer, more natural appearance.
*   **DON'T** use sharp corners. Always use the **Roundedness Scale** (default `0.5rem` or `lg: 1rem`) to keep the interface feeling approachable and organic.
*   **DON'T** use 100% opaque, high-contrast borders. It breaks the "Minted" illusion.