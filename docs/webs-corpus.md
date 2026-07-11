# Corpus de webs de referencia — links reales por nicho

Todas verificadas desde roundups de diseño (links directos que abren).
Etiquetadas por **nicho** para pasárselas a los agentes de Claude Code.

> **Filtro antes de sumarlas:** abrí cada una y quedate solo con las que cargan rápido en celu. Descartá lo pesado (WebGL, +5s). Buscás diseño fuerte pero liviano.

---

## ☕ Cafés / Coffee shops  (lo más cercano a La Martu — foto + menú claro)

- Avenue Cafe — https://www.avenuecafenola.com/  *(grid limpio, sin animación pesada, muy liviano)*
- Interlude — https://www.interludenyc.com/  *(minimalismo que se siente premium)*
- Stumptown Coffee Roasters — https://www.stumptowncoffee.com/  *(nav simple, store locator vs shop separados)*
- % Arabica — https://arabicacoffeeus.com/  *(fotografía protagonista, "See the world through coffee")*
- Skittle Lane — https://skittlelane.com/  *(video-first, un solo botón al shop)*
- Truth Coffee Roasting — https://www.truth.capetown/  *(imagen de interior manda, con reviews)*
- KAFFE — https://www.kaffe401.com/  *(hero video de marca + ambiente)*
- Merkava Coffee — https://merkavacoffee.co.za/  *(paleta azul/blanco, se sale de lo típico)*
- Oliver's Coffee — https://www.oliverscoffee.ca/  *(nav clarísima, tipografía limpia)*
- True Baristas — https://truebaristas.com/  *(oscuro y simple, playlist de Spotify embebida)*
- Backatown Coffee Parlour — https://backatownnola.com/  *(video de apertura, comunidad)*
- The Wydown — https://thewydown.square.site/home  *(minimalismo extremo, "Order now" al centro)*
- Rachel's Coffee House — https://rachelscoffeehouse.ca/  *(cálido beige/marrón, storytelling de dueña)*
- Manic Coffee — https://maniccoffee.com/  *(personalidad fuerte, parallax, sin romper la usabilidad)*
- Rival Bros. — https://rivalbros.com/  *(diseño fuerte + menú de accesibilidad)*

---

## 💅 Estética / Peluquería / Uñas  (tipo lumina-estetica)

- Artika Salon — https://www.artikasalon.com/  *(minimalista, fotos del interior en el home, "book now" claro)*
- Honey Rose Aesthetics — https://www.hraskin.com/  *(video full-page del servicio + páginas por servicio para SEO)*
- Fringe (NY) — https://www.fringeny.com/  *(home intuitivo, "featured in" para confianza)*
- Yello — https://yello.salon/  *(vibra energética, paleta neón consistente)*
- Ama Salon — https://amathesalon.com/  *(visual, poco texto, marca coherente online/offline)*

---

## 🦷 Clínicas / Dental / Estética médica  (confianza + reserva)

- Arbor Dental (NY) — https://www.arbordentalnyc.com/  *(se siente un design studio: oscuro, tipografía refinada)*
- Boulder Smiles — https://www.bouldersmiles.com/  *(luz natural, lifestyle, paleta calma)*
- Luca Aesthetic — https://www.lucaaesthetic.com/  *(rosa fuerte + hero video de alto impacto)*
- Dr. Molly Rosen — https://www.mydentistmolly.com/  *(serif + acentos vibrantes, "elevated warmth")*
- Edwards Family Dental — https://www.edwardsfamilydental.com/  *(colores bold, formas artísticas, logo distintivo)*
- Santa Rosa Dental Suite — https://www.santarosadentalsuite.com/  *(calmo, texto que scrollea vertical, editorial)*
- Summit Dental Studio — https://www.summit-dentalstudio.com/  *(clean con sorpresas de layout, uso del logo)*
- Sweet Magnolia Dentistry — https://www.sweetmagnoliadentistry.com/  *(paleta muteada, scroll "cinematográfico" en bio)*
- Casco Bay Smiles — https://www.cascobaysmiles.com/  *(feel costero, colores náuticos, familiar)*

---

## 🍽️ Restaurantes premium  (para estos, mejor navegar las galerías vivas)
Cada ficha tiene el link al sitio real; elegí ahí los que te gusten:

- Awwwards — Food & Drink: https://www.awwwards.com/websites/food-drink/
- Awwwards — Hotel/Restaurant: https://www.awwwards.com/websites/hotel-restaurant/
- Awwwards — Beauty (más estética): https://www.awwwards.com/websites/beauty/

---

## Más para completar (cuando quieras)
- godly.website  — muy buen gusto, filtrable
- land-book.com  — landing pages por categoría
- lapa.ninja  — landings por rubro

---

## Cómo usarlo con Claude Code (orden que evita el error clásico)
1. **Primero definí el contrato de salida**: design tokens (colores, tipografías, espaciados, radios, sombras) + esquema de secciones con nombres fijos (nav, hero, galería, menú/servicios, reserva/CTA, footer). Cada agente escribe *hacia ese esquema*.
2. **Skill `web-reverseengineering.md`**: define QUÉ extrae cada agente (layout, tokens, mapeo sección→componente) y en qué formato.
3. **Recién ahí lanzás los agentes en paralelo**, uno por web, cada uno etiquetado con su nicho.
4. **Extraé patrones abstractos**, no código/assets verbatim: los patrones componen entre sí, los clones no.
