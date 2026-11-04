# Academic Source Discrepancies & Harmonization Report

**Institution:** Shree Public High School, Dharan-12, Sunsari, Nepal  
**Focus:** Comparative analysis of official Curriculum Development Centre (CDC) reference documents, textbook editions, syllabus grids, and pedagogical reconciliation for **Physics Lab**.

---

## 1. Primary Documents Compared

1. **Document A (Textbook 11):** *Physics Grade 11* — CDC Nepal, First Edition 2024 (2080/2081 BS reprint).
2. **Document B (Textbook 12):** *Physics Grade 12* — CDC Nepal, First Edition 2025 (2081/2082 BS reprint).
3. **Document C (Curriculum Grid 2076):** *Secondary Education Curriculum, 2076 Grade 11-12 Part 2 (Optional Subject: Physics)* — CDC Nepal (Subject Codes: Phy. 101 for Grade 11, Phy. 102 for Grade 12).
4. **Document D (Legacy Syllabus):** Pre-2076 HSEB/NEB Physics curriculum (Old Course).

---

## 2. Chapter Organization & Unit Granularity Discrepancies

### The "Unit" vs. "Chapter" Distinction
A primary structural discrepancy exists between the curriculum specification document (Document C) and the official printed textbooks (Documents A & B):

- **Curriculum Document 2076 (Document C):**  
  Groups the syllabus into broad **Content Areas** and instructional **Units** categorized by credit hours (e.g., *Unit 1: Mechanics*, *Unit 2: Heat and Thermodynamics*, etc.). Inside each unit, learning outcomes are listed as competency bullet points without explicitly enumerating standalone chapter boundaries.
- **Official CDC Textbooks (Documents A & B):**  
  Deconstruct the Content Areas into **discrete numbered chapters** designed for day-to-day high school lesson plans:
  - **Grade 11 Textbook:** Exactly **26 Chapters** across 5 Content Areas (start pages 1 to 496).
  - **Grade 12 Textbook:** Exactly **25 Chapters** across 5 Content Areas (start pages 1 to 477).
  - **Total:** **51 distinct chapters**.

### Reconciled Structure:
```
Curriculum Document 2076 (5 Broad Units per Grade, 128 Theory + 32 Practical hours)
                 ↓ (CDC Textbook Subdivision)
Grade 11: 26 Discrete Chapters (pp. 1–496) | Grade 12: 25 Discrete Chapters (pp. 1–477)
                 ↓ (Physics Lab Technical Architecture)
Stable Alphanumeric Node IDs (g11-mech-c01 ... g12-mod-c25)
```

---

## 3. Title Variations Between Sources

Several chapter headings exhibit minor wording variations between textbook contents pages, chapter title banners, and curriculum summary documents:

| Grade & Ch | Official CDC Textbook Title | Curriculum 2076 / Specification Title | Physics Lab Display Title | Harmonization Notes |
|:---:|---|---|---|---|
| **Gr 11, Ch 5** | *Work, Energy & Power* | *Work, Energy and Power* | **Work, Energy and Power** | Amperstand in textbook banner expanded for clean UI typography. |
| **Gr 11, Ch 9** | *Heat and Temperature* | *Zeroth Law and Heat* | **Heat and Temperature** | Textbook title preferred; Zeroth law is taught as Section 9.2. |
| **Gr 11, Ch 14** | *Reflection at Curved Mirror* | *Reflection at Curved Surfaces* | **Reflection at Curved Mirrors** | Textbook uses singular in contents; plural used in display for clarity. |
| **Gr 11, Ch 17** | *Lens* | *Refraction through Lenses* | **Lenses** | Textbook uses singular; plural used in display for consistency. |
| **Gr 11, Ch 19** | *Electric Charges* | *Electrostatics: Charges* | **Electric Charges** | Textbook title used for clean UI readability. |
| **Gr 11, Ch 21** | *Electric Potential, Potential Difference and Potential Energy* | *Electric Potential* | **Potential, Potential Difference & Energy** | Unified display title accurately reflects the triple scope of the chapter. |
| **Gr 11, Ch 22** | *Capacitors* | *Capacitance and Dielectrics* | **Capacitor** | Standard singular component title in UI. |
| **Gr 11, Ch 23** | *D.C. Circuits* | *Direct Current Circuits* | **DC Circuits** | Simplified acronym for modern TV UI. |
| **Gr 11, Ch 25** | *Energy Levels* | *Atomic Spectra and Energy Levels* | **Energy Levels** | Reconciled: Ch 25 in 2024 textbook covers quantized states and spectral transitions. |
| **Gr 11, Ch 26** | *Solids* | *Band Theory of Solids* | **Solids** | Reconciled: Ch 26 in 2024 textbook covers semiconductor band gaps. |
| **Gr 12, Ch 1** | *Rotational Dynamics and Oscillatory Motion* | *Rotational Dynamics* | **Rotational Dynamics** | Textbook Chapter 1 title mentions oscillatory motion in heading, but periodic oscillations are fully detailed in Chapter 2 (*Periodic Motion*). |
| **Gr 12, Ch 3** | *Fluid Mechanics* | *Fluid Statics* | **Fluid Mechanics** | Textbook covers both static pressure (Archimedes, surface tension) and dynamic flow (Bernoulli, Stokes, Poiseuille). |
| **Gr 12, Ch 7** | *Mechanical Wave* | *Velocity of Sound* | **Mechanical Waves** | Textbook title singular; plural used in display. |
| **Gr 12, Ch 9** | *Acoustic Phenomenon* | *Doppler Effect & Acoustics* | **Acoustic Phenomena** | Pluralized for UI standard. |
| **Gr 12, Ch 15** | *Thermoelectric Effect* | *Thermoelectricity* | **Thermoelectric Effect** | Standard textbook singular title retained. |
| **Gr 12, Ch 24** | *Radioactivity & Nuclear Reaction* | *Nuclear Physics (Grade 12)* | **Radioactivity & Nuclear Reactions** | Distinguishes Grade 12 nuclear decay/radioactivity from Grade 11 Chapter 24 (*Nuclear Physics*). |
| **Gr 12, Ch 25** | *Recent Trends in Physics* | *Recent Trends in Physics* | **Recent Trends in Physics** | Contemporary physics: seismology in Nepal, gravitational waves, Higgs boson. |

---

## 4. Modern Physics Correction & Topic Migration Across Grades

### Critical Grade 11 Modern Physics Audit
In preliminary working drafts of the curriculum map, an error existed in the enumeration of Grade 11 Modern Physics:
- *Erroneous Draft:* Listed Chapter 25 as *Solids* and Chapter 26 as *Recent Trends in Physics*.
- *Official 2024 CDC Textbook Verification:* The actual contents page of the official CDC First Edition 2024 textbook proves:
  - **Chapter 24: Nuclear Physics** (p. 459)
  - **Chapter 25: Energy Levels** (p. 487)
  - **Chapter 26: Solids** (p. 496)
  
*Recent Trends in Physics* does **not** appear in Grade 11; it is exclusively **Grade 12 Chapter 25** (p. 477).

**Harmonization implemented for Physics Lab:**
1. Grade 11 Chapter 25 is established as **Energy Levels** (`g11-mod-c25-energy-levels`), focusing on quantized atomic states, Bohr's postulates, excitation/ionization potentials, and hydrogen spectral series. A dedicated simulation opportunity (`energy-levels-transitions`) is mapped.
2. Grade 11 Chapter 26 is established as **Solids** (`g11-mod-c26-solids`), covering energy band structures, forbidden energy gaps, and semiconductor conduction (`band-theory-solids`).
3. Grade 12 Chapter 25 remains exclusively **Recent Trends in Physics** (`g12-mod-c25-recent-trends`), covering seismology in Nepal, earthquake wave propagation, gravitational waves, and nanotechnology (`seismic-waves-nepal`).

### Historical Migration Across Grades (Pre-2076 vs. Post-2076)
1. **Geometrical Optics vs. Wave Optics:**
   - *Legacy Arrangement:* Ray optics and wave optics were partially mixed in both grades.
   - *Official CDC 2076+ Standard:* **Strict pedagogical separation**. Grade 11 covers all of **Geometrical Optics** (Mirrors, Refraction, Prisms, Lenses, Dispersion). Grade 12 covers all of **Physical / Wave Optics** (Wavefronts, Huygens' principle, Interference, Diffraction, Polarization).
2. **Electrostatics & Circuits:**
   - *Legacy Arrangement:* Electrostatics was previously a major component of Grade 12.
   - *Official CDC 2076+ Standard:* **Electrostatics** (Coulomb's law, Gauss's law, Electric potential, Capacitance) and **basic DC circuits** are placed in **Grade 11**. Advanced circuit network theorems (Kirchhoff's laws, Potentiometer, Meter bridge), **Electromagnetism**, and **Alternating Currents** are placed in **Grade 12**.
3. **Nuclear Physics & Radioactivity:**
   - *Legacy Arrangement:* All nuclear physics was taught together in Grade 12.
   - *Official CDC 2076+ Standard:* Split logically: **Nuclear structure, Mass defect, Binding energy, and Fission/Fusion** are placed in **Grade 11** (Chapter 24). **Spontaneous radioactivity, Decay laws ($\alpha, \beta, \gamma$), Half-life, Carbon dating, and Radioisotopes** are placed in **Grade 12** (Chapter 24).

---

## 5. Verified Textbook Starting Pages (All 51 Chapters)

The starting page of every chapter has been verified directly against the official Curriculum Development Centre (CDC) printed textbook contents pages:

### Grade 11 (CDC First Edition 2024, pp. 1–496)
| Ch | Official Chapter Title | Content Area | Start Page |
|:---:|---|---|:---:|
| 1 | Physical Quantities | Mechanics | 1 |
| 2 | Vectors | Mechanics | 21 |
| 3 | Kinematics | Mechanics | 41 |
| 4 | Dynamics | Mechanics | 73 |
| 5 | Work, Energy & Power | Mechanics | 103 |
| 6 | Circular Motion | Mechanics | 132 |
| 7 | Gravitation | Mechanics | 154 |
| 8 | Elasticity | Mechanics | 184 |
| 9 | Heat and Temperature | Heat & Thermodynamics | 208 |
| 10 | Thermal Expansion | Heat & Thermodynamics | 222 |
| 11 | Quantity of Heat | Heat & Thermodynamics | 246 |
| 12 | Rate of Heat Flow | Heat & Thermodynamics | 270 |
| 13 | Ideal Gas | Heat & Thermodynamics | 289 |
| 14 | Reflection at Curved Mirror | Wave & Optics | 307 |
| 15 | Refraction at Plane Surfaces | Wave & Optics | 319 |
| 16 | Refraction through Prisms | Wave & Optics | 336 |
| 17 | Lens | Wave & Optics | 345 |
| 18 | Dispersion | Wave & Optics | 364 |
| 19 | Electric Charges | Electricity & Magnetism | 378 |
| 20 | Electric Field | Electricity & Magnetism | 387 |
| 21 | Electric Potential, Potential Difference and Potential Energy | Electricity & Magnetism | 403 |
| 22 | Capacitors | Electricity & Magnetism | 416 |
| 23 | D.C. Circuits | Electricity & Magnetism | 431 |
| 24 | Nuclear Physics | Modern Physics | 459 |
| 25 | Energy Levels | Modern Physics | 487 |
| 26 | Solids | Modern Physics | 496 |

### Grade 12 (CDC First Edition 2025, pp. 1–477)
| Ch | Official Chapter Title | Content Area | Start Page |
|:---:|---|---|:---:|
| 1 | Rotational Dynamics and Oscillatory Motion | Mechanics | 1 |
| 2 | Periodic Motion | Mechanics | 25 |
| 3 | Fluid Mechanics | Mechanics | 45 |
| 4 | First Law of Thermodynamics | Heat & Thermodynamics | 77 |
| 5 | Second Law of Thermodynamics | Heat & Thermodynamics | 96 |
| 6 | Wave Motion | Wave & Optics | 116 |
| 7 | Mechanical Wave | Wave & Optics | 127 |
| 8 | Waves in Pipes and Strings | Wave & Optics | 137 |
| 9 | Acoustic Phenomenon | Wave & Optics | 152 |
| 10 | Nature and Propagation of Light | Wave & Optics | 175 |
| 11 | Interference of Light | Wave & Optics | 186 |
| 12 | Diffraction | Wave & Optics | 202 |
| 13 | Polarisation | Wave & Optics | 218 |
| 14 | Electrical Circuits | Electricity & Magnetism | 228 |
| 15 | Thermoelectric Effect | Electricity & Magnetism | 255 |
| 16 | Magnetic Fields | Electricity & Magnetism | 265 |
| 17 | Magnetic Properties of Materials | Electricity & Magnetism | 302 |
| 18 | Electromagnetic Induction | Electricity & Magnetism | 313 |
| 19 | Alternating Current | Electricity & Magnetism | 342 |
| 20 | Electrons | Modern Physics | 367 |
| 21 | Photons | Modern Physics | 385 |
| 22 | Semiconductor Devices | Modern Physics | 404 |
| 23 | Quantization of Energy | Modern Physics | 420 |
| 24 | Radioactivity & Nuclear Reaction | Modern Physics | 456 |
| 25 | Recent Trends in Physics | Modern Physics | 477 |

---

## 6. Theory Syllabus vs. Laboratory Practical Discrepancies

1. **Measurement Apparatus Discrepancy:**
   - *Observation:* Instruments such as the **Spherometer** (measuring radius of curvature) and **Traveling Microscope** (measuring glass slab refractive index) have minimal theoretical exposition in textbook chapters, yet they are mandatory laboratory experiments carrying high practical exam weightage under the 2026 NEB 25-mark evaluation scheme ($3+3+3+10+3+3=25$).
   - *Resolution in Physics Lab:* Physics Lab provides dedicated interactive virtual measuring tools for these laboratory apparatus to ensure students can practice instrument readings even without physical lab access.
2. **Abstract Contemporary Topics Without Physical Lab Apparatus:**
   - *Observation:* Topics such as *Recent Trends in Physics* (Earthquake wave propagation in Nepal, Gravitational waves) and *Modern Physics* (Photoelectric effect, Bohr hydrogen atom) cannot be tested with basic school equipment in Dharan due to lack of high-vacuum phototubes or particle detectors.
   - *Resolution in Physics Lab:* These abstract conceptual domains are prioritized for high-impact interactive simulation visualization, bridging the gap between theoretical textbook diagrams and intuitive student understanding.

---

## 7. Official Harmonization Policy for Physics Lab

To ensure 100% academic trust and zero confusion for students and teachers at Shree Public High School:

1. **Chapter Navigation Source of Truth:**  
   The primary application menu and simulation launcher strictly follow the **official 2024 (Grade 11) and 2025 (Grade 12) CDC textbook chapter ordering (1 to 26 and 1 to 25)**. Students navigating the TV application find exact 1:1 parity with the printed textbook on their desks.
2. **Stable Alphanumeric ID Isolation:**  
   All internal TypeScript models, Android navigation routes, and database records use persistent alphanumeric keys (e.g. `g11-mech-c03-kinematics`, `g11-mod-c25-energy-levels`, `g11-mod-c26-solids`, `g12-elec-c19-alternating-current`). If the Ministry of Education alters chapter numbering in future syllabus revisions, UI labels can be updated in data manifests without refactoring any simulation engine code.
3. **Cross-Grade Progression:**  
   When a topic is relevant across grades (e.g. DC Circuits in Grade 11 Chapter 23 and Electrical Circuits in Grade 12 Chapter 14), the underlying simulation engine shares mathematical components (`OhmicSolver`, `ResistorNetwork`) while presenting grade-appropriate parameter presets and curriculum prompts.
4. **Relative Documentation Links:**  
   All documentation cross-references within Physics Lab maintain portable relative paths:
   - [Official Curriculum Reference](official-curriculum-reference.md)
   - [Grade 11 Chapter Specifications](grade-11-chapters.md)
   - [Grade 12 Chapter Specifications](grade-12-chapters.md)
   - [Simulation Opportunity Analysis & Mapping](simulation-mapping.md)
   - [Master Curriculum Map](../curriculum-map.md)
