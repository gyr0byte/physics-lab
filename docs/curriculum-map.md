# Master Curriculum Map — Physics Lab

**Institution:** Shree Public High School, Dharan-12, Sunsari, Nepal  
**Curriculum Authority:** Government of Nepal, Ministry of Education, Science and Technology, Curriculum Development Centre (CDC), Sanothimi, Bhaktapur  
**Target Level:** Secondary Level (Grades 11 and 12 Science — NEB)  
**Total Chapters:** **51 Official Chapters** (Grade 11: 26 Chapters; Grade 12: 25 Chapters) across 5 Content Areas.

---

## 1. Official Curriculum Reference Documentation

The complete academic mapping for Physics Lab is established in the following detailed companion documents:

- **[Official Curriculum Reference](curriculum/official-curriculum-reference.md):** Academic source credentials, 5 CDC subject competencies vs synthesized goals, teaching hours (128h theory + 32h practical), and the 2026 NEB 25-mark practical exam framework.
- **[Grade 11 Chapter Specifications](curriculum/grade-11-chapters.md):** Detailed breakdown of all 26 Grade 11 chapters (official titles, subtopics, learning objectives, equations, practical activities, and verified textbook start pages 1 to 496).
- **[Grade 12 Chapter Specifications](curriculum/grade-12-chapters.md):** Detailed breakdown of all 25 Grade 12 chapters (official titles, subtopics, learning objectives, equations, practical activities, and verified textbook start pages 1 to 477).
- **[Simulation Opportunity Analysis & Mapping](curriculum/simulation-mapping.md):** Interactive learning experience analysis for every chapter, parameters, visual behaviors, mathematical models, difficulty ratings, and recommended 5-stage learning progression.
- **[Academic Source Discrepancies Report](curriculum/source-discrepancies.md):** Comparative analysis between 2076 curriculum grids, 2024/2025 CDC textbooks, legacy syllabus migrations, and harmonization policy for Physics Lab.

---

## 2. Summary Status Taxonomy

Physics Lab maintains a strict, standardized status lifecycle across all simulations:

- **Verified on Android:** Packaged inside APK, validated on physical hardware (`[ANDROID-TEST-DEVICE]`) and TV D-pad navigation.
- **Tested:** Physics calculations validated through automated unit tests (`vitest`).
- **Implemented:** Simulation physics model and canvas renderer operational.
- **In Development:** Mathematical model or user interface currently under active construction.
- **Planned:** Curriculum concept analyzed, mathematical equations and interface specified in mapping.

---

## 3. Grade 11 Curriculum Map (26 Chapters)

### Content Area 1: Mechanics (8 Chapters)
| Ch | Official Chapter Title | Display Title | Primary Simulation ID | Status | Focus / Concept |
|:---:|---|---|---|:---:|---|
| **1** | Physical Quantities | Physical Quantities | `virtual-metrology` | Planned | Least count, Vernier calipers, screw gauge, errors |
| **2** | Vectors | Vectors | `vector-addition` | Planned | Parallelogram law, components, dot and cross products |
| **3** | Kinematics | Kinematics | `projectile-motion` | Verified on Android | 2D motion under gravity, independent $x/y$, trajectory |
| **4** | Dynamics | Dynamics | `newtons-second-law` | Verified on Android | $F_{\text{net}} = m \cdot a$, static breakaway, kinetic friction arrest |
| **5** | Work, Energy & Power | Work, Energy and Power | `work-energy-incline` | Planned | Work-energy theorem, mechanical energy conservation |
| **6** | Circular Motion | Circular Motion | `circular-motion-banking` | Planned | Centripetal acceleration, road banking, vertical circle |
| **7** | Gravitation | Gravitation | `orbital-mechanics` | Planned | Universal gravitation, orbital velocity, Kepler's laws |
| **8** | Elasticity | Elasticity | `elasticity-tensile` | Planned | Hooke's law, Young's modulus, stress-strain curve |

### Content Area 2: Heat and Thermodynamics (5 Chapters)
| Ch | Official Chapter Title | Display Title | Primary Simulation ID | Status | Focus / Concept |
|:---:|---|---|---|:---:|---|
| **9** | Heat and Temperature | Heat and Temperature | `temperature-scales` | Planned | Zeroth law, Celsius/Fahrenheit/Kelvin, kinetic temperature |
| **10** | Thermal Expansion | Thermal Expansion | `thermal-expansion` | Planned | Linear/volume expansion, bimetallic strip, anomalous water |
| **11** | Quantity of Heat | Quantity of Heat | `calorimetry-phase-change` | Planned | Specific heat capacity, latent heat, method of mixtures |
| **12** | Rate of Heat Flow | Rate of Heat Flow | `thermal-conduction` | Planned | Conduction, conductivity $K$, composite wall gradient, radiation |
| **13** | Ideal Gas | Ideal Gas | `kinetic-gas-simulator` | Planned | Gas laws ($PV=nRT$), molecular kinetic model, RMS velocity |

### Content Area 3: Wave and Optics (5 Chapters)
| Ch | Official Chapter Title | Display Title | Primary Simulation ID | Status | Focus / Concept |
|:---:|---|---|---|:---:|---|
| **14** | Reflection at Curved Mirror | Reflection at Curved Mirrors | `curved-mirrors-optics` | Planned | Concave/convex mirrors, ray tracing, mirror formula |
| **15** | Refraction at Plane Surfaces | Refraction at Plane Surfaces | `snells-law-tir` | Planned | Snell's law, apparent depth, critical angle, optical fiber |
| **16** | Refraction through Prisms | Refraction through Prisms | `prism-minimum-deviation` | Planned | Prism refraction, angle of deviation, $i\text{–}\delta$ curve |
| **17** | Lens | Lenses | `thin-lens-bench` | Planned | Lens maker's formula, converging/diverging rays, magnification |
| **18** | Dispersion | Dispersion | `prism-spectrometer` | Planned | White light dispersion, angular dispersion, rainbow formation |

### Content Area 4: Electricity and Magnetism (5 Chapters)
| Ch | Official Chapter Title | Display Title | Primary Simulation ID | Status | Focus / Concept |
|:---:|---|---|---|:---:|---|
| **19** | Electric Charges | Electric Charges | `coulomb-force-bench` | Planned | Charge quantization, Coulomb's law, superposition |
| **20** | Electric Field | Electric Field | `electric-field-gauss` | Planned | Field lines, dipoles, electric flux, Gauss's law |
| **21** | Electric Potential, Potential Difference and Potential Energy | Potential, Potential Difference & Energy | `equipotential-contours` | Planned | Potential scalar field, gradient $\vec{E} = -\nabla V$, charge acceleration |
| **22** | Capacitors | Capacitor | `parallel-plate-capacitor` | Planned | Capacitance, dielectric medium, energy density, combinations |
| **23** | D.C. Circuits | DC Circuits | `dc-circuits-workbench` | Planned | Ohm's law, drift velocity, internal resistance, Joule heating |

### Content Area 5: Modern Physics (3 Chapters)
| Ch | Official Chapter Title | Display Title | Primary Simulation ID | Status | Focus / Concept |
|:---:|---|---|---|:---:|---|
| **24** | Nuclear Physics | Nuclear Physics | `binding-energy-curve` | Planned | Mass defect, binding energy per nucleon, fission and fusion |
| **25** | Energy Levels | Energy Levels | `energy-levels-transitions` | Planned | Quantized states, excitation/ionization, hydrogen spectral lines |
| **26** | Solids | Solids | `band-theory-solids` | Planned | Energy band gaps, intrinsic/extrinsic semiconductors, doping |

---

## 4. Grade 12 Curriculum Map (25 Chapters)

### Content Area 1: Mechanics (3 Chapters)
| Ch | Official Chapter Title | Display Title | Primary Simulation ID | Status | Focus / Concept |
|:---:|---|---|---|:---:|---|
| **1** | Rotational Dynamics and Oscillatory Motion | Rotational Dynamics | `rotational-inertia-race` | Planned | Moment of inertia, torque, angular momentum, rolling incline |
| **2** | Periodic Motion | Periodic Motion | `simple-harmonic-motion` | Planned | Simple Harmonic Motion, spring-mass, pendulum, phase space |
| **3** | Fluid Mechanics | Fluid Mechanics | `bernoulli-stokes-flow` | Planned | Hydrostatic pressure, surface tension, Bernoulli, Stokes law |

### Content Area 2: Heat and Thermodynamics (2 Chapters)
| Ch | Official Chapter Title | Display Title | Primary Simulation ID | Status | Focus / Concept |
|:---:|---|---|---|:---:|---|
| **4** | First Law of Thermodynamics | First Law of Thermodynamics | `thermodynamic-pv-work` | Planned | Isothermal/adiabatic work, indicator diagrams, Mayer's relation |
| **5** | Second Law of Thermodynamics | Second Law of Thermodynamics | `carnot-cycle-engine` | Planned | Heat engine efficiency, Carnot cycle, entropy increase |

### Content Area 3: Wave and Optics (8 Chapters)
| Ch | Official Chapter Title | Display Title | Primary Simulation ID | Status | Focus / Concept |
|:---:|---|---|---|:---:|---|
| **6** | Wave Motion | Wave Motion | `progressive-wave-motion` | Planned | Plane progressive harmonic waves, wave speed, phase difference |
| **7** | Mechanical Wave | Mechanical Waves | `speed-of-sound-laplace` | Planned | Elastic waves, Laplace correction, sound velocity in air |
| **8** | Waves in Pipes and Strings | Waves in Pipes and Strings | `standing-waves-pipes` | Planned | Standing wave nodes/antinodes, sonometer laws, organ pipes |
| **9** | Acoustic Phenomenon | Acoustic Phenomena | `doppler-acoustic-beats` | Planned | Doppler frequency shifts, acoustic beats, decibel sound levels |
| **10** | Nature and Propagation of Light | Nature and Propagation of Light | `huygens-wavefronts` | Planned | Huygens' wavelet principle, wave reflection and refraction |
| **11** | Interference of Light | Interference of Light | `youngs-double-slit` | Planned | Coherent sources, fringe width, thin film interference |
| **12** | Diffraction | Diffraction | `single-slit-diffraction` | Planned | Fraunhofer single-slit pattern, transmission diffraction grating |
| **13** | Polarisation | Polarisation | `polarisation-brewster` | Planned | Transverse wave polarization, Brewster's law, Malus's law |

### Content Area 4: Electricity and Magnetism (6 Chapters)
| Ch | Official Chapter Title | Display Title | Primary Simulation ID | Status | Focus / Concept |
|:---:|---|---|---|:---:|---|
| **14** | Electrical Circuits | Electrical Circuits | `kirchhoff-potentiometer` | Planned | Kirchhoff's laws, Wheatstone bridge, slide-wire potentiometer |
| **15** | Thermoelectric Effect | Thermoelectric Effect | `thermoelectric-seebeck` | Planned | Seebeck effect, neutral and inversion temperatures, Peltier |
| **16** | Magnetic Fields | Magnetic Fields | `biot-savart-lorentz` | Planned | Biot-Savart law, circular coils, solenoid, Lorentz force |
| **17** | Magnetic Properties of Materials | Magnetic Properties of Materials | `magnetic-hysteresis-loop` | Planned | Diamagnetism, paramagnetism, ferromagnetism, $B\text{–}H$ curve |
| **18** | Electromagnetic Induction | Electromagnetic Induction | `faradays-law-induction` | Planned | Faraday's law, Lenz's law, motional EMF, AC generator |
| **19** | Alternating Current | Alternating Current | `series-lcr-resonator` | Planned | RMS values, inductive/capacitive reactance, $LCR$ resonance |

### Content Area 5: Modern Physics (6 Chapters)
| Ch | Official Chapter Title | Display Title | Primary Simulation ID | Status | Focus / Concept |
|:---:|---|---|---|:---:|---|
| **20** | Electrons | Electrons | `thomson-millikan-chamber` | Planned | Specific charge ($e/m$), velocity selector, Millikan drop |
| **21** | Photons | Photons | `photoelectric-laboratory` | Planned | Photoelectric effect, Einstein equation, stopping potential |
| **22** | Semiconductor Devices | Semiconductor Devices | `diode-rectifier-logic` | Planned | p-n junction, forward/reverse bias, bridge rectifier, logic gates |
| **23** | Quantization of Energy | Quantization of Energy | `bohr-hydrogen-spectrum` | Planned | Bohr atomic model, spectral series, energy levels, X-rays |
| **24** | Radioactivity & Nuclear Reaction | Radioactivity & Nuclear Reactions | `radioactive-decay-chamber`| Planned | Radioactive decay law, half-life, $\alpha/\beta/\gamma$ displacement |
| **25** | Recent Trends in Physics | Recent Trends in Physics | `seismic-waves-nepal` | Planned | Seismic $P/S$-waves in Nepal, epicenters, gravitational waves |

---

## 5. Technical Integration

The complete curriculum hierarchy is exposed programmatically to the TypeScript application in [`simulation-web/src/curriculum/curriculumData.ts`](../simulation-web/src/curriculum/curriculumData.ts), enabling dynamic simulation registration, progress tracking, and D-pad remote navigation on Android TV.
