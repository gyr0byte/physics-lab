# Simulation Opportunity Analysis and Mapping — Physics Lab

**Institution:** Shree Public High School, Dharan-12, Sunsari, Nepal  
**Scope:** Complete simulation mapping across all 51 chapters of Nepal CDC Grade 11 and Grade 12 Physics.  
**Core Engine:** TypeScript Canvas/WebGL 2D/3D modular engine.

---

## 1. Simulation Architecture & Status Taxonomy

Every simulation in Physics Lab is tracked with one of five discrete lifecycle statuses defined in `curriculumData.ts`:
- **`Planned`:** Curriculum concept analyzed, mathematical model, parameters, and display interface specified.
- **`In Development`:** Physics equations and canvas renderer implementation underway.
- **`Implemented`:** Core simulation loop, parameter controls, measurements, and graphs functional.
- **`Tested`:** Automated unit tests and browser execution validated.
- **`Verified on Android`:** Packaged inside APK, validated on physical Samsung Galaxy S21 FE hardware (`[ANDROID-TEST-DEVICE]`) and TV D-pad navigation.

---

## 2. Grade 11 Simulation Opportunity Mapping (26 Chapters)

### Content Area 1: Mechanics

| Chapter | Proposed Simulation | Core Concept | Parameters | Visual Behavior | Key Equations | Graphs | Difficulty | Reusable Components | Status |
|---|---|---|---|---|---|---|:---:|---|:---:|
| **1. Physical Quantities** | *Virtual Precision Metrology* (Interactive Tool) | Least count, zero error, vernier/micrometer readings | Jaw opening, screw rotation, object thickness ($0\text{--}25\text{ mm}$) | 3D-shaded rendered caliper jaws and thimble sleeve with aligned scale vernier graduations | Reading $= \text{MSR} + (\text{VSR} \times \text{LC}) - \text{ZE}$ | Error vs. trial count | Low | `CanvasRenderer`, `Camera2D`, `InputManager` | Planned |
| **2. Vectors** | *Vector Addition & Resolution Laboratory* | Vector addition, rectangular components, dot & cross products | Vector magnitudes $P, Q$ ($0\text{--}50\text{ N}$), angles $\theta_1, \theta_2$ ($0\text{--}360^\circ$), dot/cross toggle | Interactive dynamic arrows, component projections on $x/y$ axes, resultant parallelogram formation | $R = \sqrt{P^2 + Q^2 + 2PQ\cos\theta}$, $\vec{A}\cdot\vec{B}$, $\vec{A}\times\vec{B}$ | Resultant magnitude vs. angle $\theta$ | Low | `Vector2`, `CanvasRenderer`, `InputManager` | Planned |
| **3. Kinematics** | **Kinematics — Projectile Motion** | 2D motion under gravity, independence of $x/y$ components, trajectory | Launch velocity ($1\text{--}80\text{ m/s}$), angle ($0\text{--}90^\circ$), gravity ($1\text{--}25\text{ m/s}^2$) | Cannon fires projectile along parabolic path; live velocity and acceleration vector arrows; trajectory trail | $x(t) = v_0\cos\theta \cdot t$, $y(t) = v_0\sin\theta \cdot t - \frac{1}{2}gt^2$ | $y(x)$, $v(t)$, $h(t)$ | Medium | `Vector2`, `SimulationClock`, `Camera2D`, `CanvasRenderer`, `Graph`, `TVSlider` | **Verified on Android** |
| **4. Dynamics** | **Newton's Second Law of Motion** | $F_{\text{net}} = m \cdot a$, static breakaway threshold, kinetic sliding friction | Applied force ($-50\text{ to }+50\text{ N}$), mass ($1\text{--}20\text{ kg}$), friction coeff $\mu$ ($0\text{--}0.5$) | Sliding crate on graduation track; color-coded force vectors ($F_{\text{app}}$, $f$, $F_{\text{net}}$); dynamic tracking camera | $f_s \le \mu_s N$, $f_k = \mu_k N$, $a = F_{\text{net}} / m$ | $v(t)$, $a(t)$ | Medium | `Vector2`, `SimulationClock`, `Camera2D`, `CanvasRenderer`, `Graph`, `SimulationRegistry` | **Verified on Android** |
| **5. Work, Energy & Power** | *Mechanical Energy Conservation & Incline* | Work-energy theorem, potential $\leftrightarrow$ kinetic transfer, dissipative work | Incline angle ($0\text{--}60^\circ$), track height ($1\text{--}10\text{ m}$), mass ($1\text{--}10\text{ kg}$), track friction $\mu$ | Cart rolling along customizable track/ramp into spring bumper; dynamic energy bar charts ($K, U, E_{\text{lost}}$) | $W = \Delta K$, $E_{\text{total}} = mgh + \frac{1}{2}mv^2 + \frac{1}{2}kx^2$ | Energy vs. position $E(x)$, $v(x)$ | Medium | `Vector2`, `SimulationClock`, `Camera2D`, `CanvasRenderer`, `Graph` | Planned |
| **6. Circular Motion** | *Centripetal Dynamics & Banking Highway* | Centripetal acceleration, friction threshold, optimal highway banking | Car speed ($5\text{--}50\text{ m/s}$), curve radius ($20\text{--}200\text{ m}$), banking angle ($0\text{--}45^\circ$), road friction $\mu$ | Dual view: 2D overhead road curve and 3D cross-sectional vehicle incline showing normal, weight, and friction vectors | $a_c = v^2/r$, $\tan\theta = v^2/rg$, $v_{\max} = \sqrt{rg\frac{\mu + \tan\theta}{1 - \mu\tan\theta}}$ | Required friction vs. speed $v$ | Medium | `Vector2`, `SimulationClock`, `Camera2D`, `CanvasRenderer` | Planned |
| **7. Gravitation** | *Orbital Mechanics & Planetary Satellites* | Universal gravitation, orbital velocity, escape speed, Kepler's laws | Central mass $M$, satellite altitude ($200\text{--}40,000\text{ km}$), launch speed ($1\text{--}15\text{ km/s}$) | Planet with orbiting satellite tracing elliptical/circular/hyperbolic orbits; Kepler equal-area sweep wedges | $F = G\frac{Mm}{r^2}$, $v_o = \sqrt{\frac{GM}{r}}$, $v_e = \sqrt{\frac{2GM}{R}}$, $T^2 = \frac{4\pi^2}{GM}r^3$ | $r(t)$, $v(r)$, $K(t)$ and $U(t)$ | High | `Vector2`, `SimulationClock`, `Camera2D`, `CanvasRenderer` | Planned |
| **8. Elasticity** | *Stress-Strain & Searle's Tensile Tester* | Hooke's law, Young's modulus, elastic limit, plastic deformation | Wire material (Steel, Copper, Brass), wire length ($1\text{--}5\text{ m}$), diameter ($0.2\text{--}2\text{ mm}$), hanging load ($1\text{--}50\text{ kg}$) | Stretched suspended wire beside reference wire with spirit level; live stress-strain curve plotted in real time | $\sigma = F/A$, $\epsilon = \Delta L / L$, $Y = \sigma/\epsilon$, $U/V = \frac{1}{2}Y\epsilon^2$ | Dynamic Stress vs. Strain $\sigma(\epsilon)$ | Medium | `SimulationClock`, `CanvasRenderer`, `Graph` | Planned |

---

### Content Area 2: Heat and Thermodynamics

| Chapter | Proposed Simulation | Core Concept | Parameters | Visual Behavior | Key Equations | Graphs | Difficulty | Reusable Components | Status |
|---|---|---|---|---|---|---|:---:|---|:---:|
| **9. Heat & Temp** | *Temperature Scales & Molecular Thermometer* | Thermal equilibrium, kinetic theory of temperature, scale conversions | System temperature ($0\text{--}500\text{ K}$), thermometer liquid (Mercury, Alcohol, Gas) | Side-by-side Celsius, Fahrenheit, Kelvin columns with vibrating atomic lattice whose jitter frequency mirrors $T$ | $\frac{C}{5} = \frac{F-32}{9} = \frac{K-273.15}{5}$, $E_{\text{avg}} = \frac{3}{2}k_BT$ | Thermometric property vs. $T$ | Low | `CanvasRenderer`, `Camera2D`, `InputManager` | Planned |
| **10. Thermal Expansion** | *Thermal Expansion & Bimetallic Strip* | Linear/areal/volumetric expansion, bimetallic bending, anomalous water | Temperature ($-20\text{ to }+200^\circ\text{C}$), metal pair (Brass/Iron, Cu/Steel), liquid volume | Heated metallic rod lengthening; bimetallic strip curving to trigger electrical contact; water volume curve with minimum at $4^\circ\text{C}$ | $\Delta L = L_0\alpha\Delta T$, $\Delta V = V_0\gamma\Delta T$, $\gamma = 3\alpha$, $F/A = Y\alpha\Delta T$ | $\Delta L$ vs. $\Delta T$, Water density vs. $T$ | Low | `CanvasRenderer`, `Graph`, `TVSlider` | Planned |
| **11. Quantity of Heat** | *Calorimetry & Phase Change Laboratory* | Specific heat capacity, latent heats of fusion/vaporization, heat exchange | Initial mass & temperature of ice, water, steam; calorimeter material and mass | Insulated calorimeter with thermometer; heat exchange animation with ice cubes melting into liquid and steam bubbling | $Q = ms\Delta T$, $Q = mL$, $\sum Q_{\text{lost}} = \sum Q_{\text{gained}}$ | Temperature vs. Time $T(t)$ heating curve | Medium | `SimulationClock`, `CanvasRenderer`, `Graph` | Planned |
| **12. Rate of Heat Flow** | *Thermal Conduction & Composite Walls* | Thermal conductivity, temperature gradient, steady-state heat flux | Slab materials (Copper, Glass, Wood, Brick), thicknesses ($x_1, x_2$), boundary temperatures | Color thermal gradient mapped across multi-layer slab; moving heat flux particle dots indicating heat transfer rate | $\frac{dQ}{dt} = \frac{KA(T_1 - T_2)}{x} = \frac{\Delta T}{R_{\text{th}}}$, $E = \sigma\epsilon A T^4$ | Temperature profile $T(x)$ across composite wall | Medium | `CanvasRenderer`, `Graph`, `Camera2D` | Planned |
| **13. Ideal Gas** | *Kinetic Gas Simulator (Maxwell-Boltzmann)* | Gas laws ($PV = nRT$), molecular pressure, RMS speed distribution | Volume (movable piston), gas temperature ($50\text{--}600\text{ K}$), particle count ($50\text{--}500$), molecular mass | Hard-sphere gas particles bouncing elastically in 2D container; pressure gauge registering wall momentum impacts | $PV = Nk_BT$, $P = \frac{1}{3}\rho v_{\text{rms}}^2$, $v_{\text{rms}} = \sqrt{3k_BT/m}$ | $P\text{–}V$ isothermal/isobaric, Velocity distribution $f(v)$ | High | `Vector2`, `SimulationClock`, `CanvasRenderer`, `Graph` | Planned |

---

### Content Area 3: Waves and Optics

| Chapter | Proposed Simulation | Core Concept | Parameters | Visual Behavior | Key Equations | Graphs | Difficulty | Reusable Components | Status |
|---|---|---|---|---|---|---|:---:|---|:---:|
| **14. Curved Mirror** | *Spherical Mirror Ray Optics* | Reflection, real/virtual images, mirror equation, spherical aberration | Mirror type (Concave/Convex), focal length ($5\text{--}30\text{ cm}$), object position ($u$), object height ($h_o$) | Interactive candle object; three principal rays (parallel, focal, center) dynamically traced to form real/virtual image | $\frac{1}{f} = \frac{1}{u} + \frac{1}{v}$, $m = -\frac{v}{u}$, $f = R/2$ | $v$ vs. $u$, $m$ vs. $u$ | Medium | `Vector2`, `Camera2D`, `CanvasRenderer`, `TVSlider` | Planned |
| **15. Refraction at Plane** | *Snell's Law & Total Internal Reflection* | Refraction, refractive index, apparent depth, critical angle, optical fiber | Medium 1 & 2 indices ($n_1, n_2$), incident angle ($0\text{--}90^\circ$), water pool depth | Rotatable incident laser beam refracting across interface; total internal reflection transition at $\theta_c$; submerged coin apparent depth | $n_1\sin\theta_1 = n_2\sin\theta_2$, $\sin\theta_c = n_2/n_1$, $d_{\text{app}} = d_{\text{real}}/n$ | Angle of refraction $r$ vs. incidence $i$ | Low | `Vector2`, `Camera2D`, `CanvasRenderer` | Planned |
| **16. Prisms** | *Prism Refraction & Minimum Deviation* | Deviation angle, minimum deviation condition, refractive index | Prism angle $A$ ($30\text{--}75^\circ$), glass refractive index ($1.3\text{--}1.8$), incident angle $i$ ($0\text{--}90^\circ$) | Triangular prism refracting light ray through both faces; ray path bends dynamically as $i$ sweeps; min deviation symmetry highlighted | $A = r_1 + r_2$, $\delta = i + e - A$, $n = \frac{\sin\left(\frac{A+\delta_m}{2}\right)}{\sin(A/2)}$ | Angle of deviation $\delta$ vs. incident angle $i$ ($i\text{–}\delta$ curve) | Medium | `Vector2`, `Camera2D`, `CanvasRenderer`, `Graph` | Planned |
| **17. Lens** | *Thin Lens & Compound Optical Bench* | Lens maker's formula, converging/diverging refraction, real/virtual images | Lens type (Convex/Concave), focal length ($f$), object distance ($u$), two-lens spacing | Interactive illuminated arrow; three principal rays converge/diverge through lens; dual-lens compound microscope configuration | $\frac{1}{f} = \frac{1}{v} - \frac{1}{u}$, $\frac{1}{f} = (n-1)\left(\frac{1}{R_1} - \frac{1}{R_2}\right)$, $P = 1/f$ | Image distance $v$ vs. $u$, Magnification $m(u)$ | Medium | `Vector2`, `Camera2D`, `CanvasRenderer`, `TVSlider` | Planned |
| **18. Dispersion** | *Prism Spectrometer & Rainbow Optics* | Dispersion, wavelength-dependent index $n(\lambda)$, rainbow formation | Glass type (Crown, Flint), white light vs. laser, water droplet mode | White light incident on prism fans out into colored rainbow spectrum (Red to Violet); internal reflection inside spherical raindrop | $n(\lambda) = A + B/\lambda^2$, $\theta = (n_v - n_r)A$, $\omega = \frac{n_v - n_r}{n_y - 1}$ | Deviation $\delta$ vs. wavelength $\lambda$ | Medium | `Vector2`, `Camera2D`, `CanvasRenderer` | Planned |

---

### Content Area 4: Electricity and Magnetism

| Chapter | Proposed Simulation | Core Concept | Parameters | Visual Behavior | Key Equations | Graphs | Difficulty | Reusable Components | Status |
|---|---|---|---|---|---|---|:---:|---|:---:|
| **19. Electric Charges** | *Coulomb Electrostatic Force Workbench* | Charge quantization, inverse-square law, vector force superposition | Charge magnitudes $q_1, q_2, q_3$ ($-20\text{ to }+20\text{ }\mu\text{C}$), spatial coordinates, medium dielectric $\epsilon_r$ | Draggable point charges with mutual attractive/repulsive force vectors scaled dynamically; net force vector on target charge | $F = \frac{1}{4\pi\epsilon_0\epsilon_r}\frac{\|q_1 q_2\|}{r^2}$, $\vec{F}_{\text{net}} = \sum \vec{F}_i$ | Force $F$ vs. distance $r$ ($1/r^2$ curve) | Low | `Vector2`, `Camera2D`, `CanvasRenderer` | Planned |
| **20. Electric Field** | *Electric Field Lines & Gauss's Law* | Field intensity, lines of force, electric flux through closed Gaussian surfaces | Charge configuration (single, dipole, quad, charged sheet), Gaussian surface radius/shape | Vector field arrows or continuous stream lines radiating from $+q$ to $-q$; live flux integration across 3D Gaussian sphere | $\vec{E} = \frac{1}{4\pi\epsilon_0}\frac{q}{r^2}\hat{r}$, $\Phi_E = \oint \vec{E}\cdot d\vec{A} = \frac{Q_{\text{enc}}}{\epsilon_0}$ | Field magnitude $E$ vs. distance $r$ | Medium | `Vector2`, `Camera2D`, `CanvasRenderer` | Planned |
| **21. Potential & Energy** | *Equipotential Contours & Particle Accelerator* | Electric potential scalar field, gradient relation $\vec{E} = -\nabla V$, charge acceleration | Charge positions, potential voltage grid, released charged particle ($q, m$) | 2D color contour topography map of electric potential; charged particle accelerates down potential hill along parabolic arc | $V(r) = \frac{1}{4\pi\epsilon_0}\frac{q}{r}$, $\vec{E} = -\frac{dV}{dr}\hat{r}$, $\Delta K = q\Delta V$ | Potential $V(r)$, Particle kinetic energy $K(t)$ | Medium | `Vector2`, `SimulationClock`, `Camera2D`, `CanvasRenderer` | Planned |
| **22. Capacitors** | *Parallel Plate Capacitor & Dielectrics* | Capacitance, dielectric polarization, stored electrostatic energy | Plate area $A$ ($100\text{--}500\text{ cm}^2$), plate separation $d$ ($1\text{--}10\text{ mm}$), dielectric constant $\kappa$ ($1\text{--}10$), DC battery voltage | Parallel plates with movable dielectric slab; field lines intensify inside dielectric; charge meter and energy bar gauges | $C = \frac{\kappa\epsilon_0 A}{d}$, $Q = CV$, $U = \frac{1}{2}CV^2$, $u = \frac{1}{2}\epsilon_0 E^2$ | $C$ vs. separation $d$, $Q$ vs. voltage $V$ | Medium | `CanvasRenderer`, `Camera2D`, `Graph`, `TVSlider` | Planned |
| **23. D.C. Circuits** | *Ohm's Law & Resistor Network Workbench* | Ohm's law, resistivity, series/parallel combinations, battery internal resistance | Supply EMF $E$ ($1\text{--}24\text{ V}$), internal resistance $r$ ($0\text{--}5\text{ }\Omega$), load resistors $R_1, R_2, R_3$ ($1\text{--}100\text{ }\Omega$) | Breadboard circuit with virtual ammeter and voltmeter; animated electron drift dots whose speed reflects current $I$ | $V = E - Ir$, $I = \frac{E}{R_{\text{eq}} + r}$, $R = \rho\frac{L}{A}$, $P = I^2 R$ | Terminal $V$ vs. current $I$, Power vs. load $R$ | Medium | `CanvasRenderer`, `Graph`, `InputManager` | Planned |

---

### Content Area 5: Modern Physics

| Chapter | Proposed Simulation | Core Concept | Parameters | Visual Behavior | Key Equations | Graphs | Difficulty | Reusable Components | Status |
|---|---|---|---|---|---|---|:---:|---|:---:|
| **24. Nuclear Physics** | *Binding Energy Curve & Nuclear Reactions* | Mass defect, binding energy per nucleon curve, fission chain reaction | Atomic mass number $A$ ($1\text{--}250$), incident neutron speed, moderator density | Interactive $BE/A$ curve highlighting Fusion (light) and Fission (heavy); chain reaction chamber showing U-235 neutron split | $\Delta m = [Zm_p + (A-Z)m_n] - M_{\text{nuc}}$, $BE = \Delta m \times 931.5\text{ MeV}$, $Q = \Delta m \cdot c^2$ | $BE/A$ vs. Mass Number $A$ | Medium | `CanvasRenderer`, `Graph`, `TVSlider` | Planned |
| **25. Energy Levels** | *Energy Levels & Spectral Transitions* | Quantized atomic energy states, electron transitions, photon emission/absorption | Initial level $n_i$ ($1\text{--}6$), final level $n_f$ ($1\text{--}6$), incident photon wavelength ($100\text{--}800\text{ nm}$) | Interactive energy-level ladder diagram; electron leaps emit/absorb colored photon wave packets; line spectrum generates live | $E_n = -\frac{13.6\text{ eV}}{n^2}$, $\Delta E = h\nu = \frac{hc}{\lambda}$, $\lambda = \frac{hc}{\|\Delta E\|}$ | Energy Level Diagram $E(n)$, Absorption/Emission Line Spectrum | Medium | `CanvasRenderer`, `Camera2D`, `Graph`, `TVSlider` | Planned |
| **26. Solids** | *Band Theory & Semiconductor Conduction* | Valence and conduction energy bands, forbidden gap $E_g$, donor/acceptor doping | Material (Conductor, Insulator, Semiconductor), doping level (n-type, p-type), temperature ($100\text{--}500\text{ K}$) | Energy band diagrams with Fermi level; thermal excitation of electrons crossing band gap into conduction band, leaving holes | $n_e n_h = n_i^2$, $\sigma = e(n_e \mu_e + n_h \mu_h)$, $E_g$ band gap | Conductivity $\sigma$ vs. temperature $T$ | Medium | `CanvasRenderer`, `Graph`, `TVSlider` | Planned |

---

## 3. Grade 12 Simulation Opportunity Mapping (25 Chapters)

### Content Area 1: Mechanics

| Chapter | Proposed Simulation | Core Concept | Parameters | Visual Behavior | Key Equations | Graphs | Difficulty | Reusable Components | Status |
|---|---|---|---|---|---|---|:---:|---|:---:|
| **1. Rotational Dynamics** | *Moment of Inertia & Incline Race* | Rotational inertia, torque, angular momentum, rolling without slipping | Incline angle $\theta$, object geometry (Solid sphere, Hollow sphere, Solid cylinder, Ring), mass, radius | Race of different shaped bodies rolling down inclined ramp; rotating flywheel with applied brake torque | $I = Mk^2$, $\tau = I\alpha$, $a = \frac{g\sin\theta}{1 + k^2/R^2}$, $K = \frac{1}{2}Mv^2 + \frac{1}{2}I\omega^2$ | $\omega(t)$, $\theta(t)$, Energy distribution bar | Medium | `Vector2`, `SimulationClock`, `Camera2D`, `CanvasRenderer`, `Graph` | Planned |
| **2. Periodic Motion** | **Simple Harmonic Motion (Spring & Pendulum)** | Restoring force, harmonic oscillation, period, energy interchange | Mass ($0.1\text{--}10\text{ kg}$), spring constant $k$ ($5\text{--}200\text{ N/m}$), pendulum length $l$ ($0.2\text{--}5\text{ m}$), damping $b$ | Oscillating spring-mass and simple pendulum side-by-side with velocity/acceleration vectors and phase circle | $F = -kx$, $T = 2\pi\sqrt{m/k}$, $T = 2\pi\sqrt{l/g}$, $E = \frac{1}{2}kA^2$ | $x(t)$, $v(t)$, $a(t)$, $K(t)$ and $U(t)$ | Medium | `Vector2`, `SimulationClock`, `Camera2D`, `CanvasRenderer`, `Graph`, `TVSlider` | Planned (Priority #1) |
| **3. Fluid Mechanics** | *Bernoulli Flow & Stokes Viscometer* | Fluid continuity, Bernoulli pressure drop, terminal velocity in viscous fluid | Pipe diameters $d_1, d_2$, fluid flow rate, sphere radius $r$, liquid viscosity $\eta$, density $\rho$ | Fluid flowing through constricted Venturi pipe with vertical pressure manometers; metal ball falling to terminal velocity | $A_1 v_1 = A_2 v_2$, $P + \frac{1}{2}\rho v^2 + \rho gh = \text{const}$, $v_t = \frac{2}{9}\frac{r^2(\rho - \sigma)g}{\eta}$ | Pressure vs. velocity, Fall speed $v(t)$ | High | `Vector2`, `SimulationClock`, `Camera2D`, `CanvasRenderer`, `Graph` | Planned |

---

### Content Area 2: Heat and Thermodynamics

| Chapter | Proposed Simulation | Core Concept | Parameters | Visual Behavior | Key Equations | Graphs | Difficulty | Reusable Components | Status |
|---|---|---|---|---|---|---|:---:|---|:---:|
| **4. 1st Law of Thermo** | *Thermodynamic Processes & PV Work* | Isothermal, adiabatic, isobaric, isochoric gas processes, internal energy | Initial $P_1, V_1, T_1$, target process type, gas ratio $\gamma$ (1.67, 1.40, 1.33), final volume $V_2$ | Gas cylinder with moving piston and heat reservoir; work done visualized as dynamic shaded area on $P\text{–}V$ plane | $\Delta Q = \Delta U + W$, $W_{\text{iso}} = nRT\ln(V_2/V_1)$, $PV^\gamma = \text{const}$, $C_p - C_v = R$ | Real-time Indicator Diagram $P(V)$ | Medium | `SimulationClock`, `CanvasRenderer`, `Graph`, `TVSlider` | Planned |
| **5. 2nd Law of Thermo** | *Carnot Heat Engine & Refrigerator Cycle* | Heat engine efficiency, Carnot cycle, entropy increase, refrigerator COP | Hot reservoir temp $T_H$ ($300\text{--}1000\text{ K}$), cold reservoir temp $T_C$ ($100\text{--}400\text{ K}$), working gas volume | 4-stage Carnot animation (Isothermal exp $\to$ Adiabatic exp $\to$ Isothermal comp $\to$ Adiabatic comp); energy flow Sankey diagram | $\eta = 1 - T_C/T_H$, $\text{COP} = \frac{T_C}{T_H - T_C}$, $\Delta S = \oint \frac{dQ}{T} = 0$ | Cyclic $P\text{–}V$ and $T\text{–}S$ diagrams | Medium | `SimulationClock`, `CanvasRenderer`, `Graph` | Planned |

---

### Content Area 3: Waves and Optics

| Chapter | Proposed Simulation | Core Concept | Parameters | Visual Behavior | Key Equations | Graphs | Difficulty | Reusable Components | Status |
|---|---|---|---|---|---|---|:---:|---|:---:|
| **6. Wave Motion** | *Progressive Wave & Superposition* | Traveling harmonic wave, wavelength, wave speed, phase difference | Amplitude $A$, frequency $f$, wavelength $\lambda$, propagation direction ($+x / -x$) | Oscillating sine wave with color-coded particle markers moving vertically while wave profile travels horizontally | $y(x, t) = A\sin(\omega t \mp kx)$, $v = f\lambda = \omega/k$, $\Delta\phi = \frac{2\pi}{\lambda}\Delta x$ | $y(x)$ at fixed $t$, $y(t)$ at fixed $x$ | Medium | `SimulationClock`, `CanvasRenderer`, `Graph` | Planned |
| **7. Mechanical Wave** | *Speed of Sound & Laplace Gas Dynamics* | Sound propagation in air, temperature and humidity dependence | Gas temperature ($-20\text{ to }+60^\circ\text{C}$), gas type (Air, He, $\text{CO}_2$), relative humidity | Acoustic compressions and rarefactions propagating through gas particle grid; acoustic velocity gauge | $v = \sqrt{\frac{\gamma P}{\rho}} = \sqrt{\frac{\gamma RT}{M}}$, $v_t \approx v_0 + 0.61 t$ | Sound velocity $v$ vs. temperature $T$ | Medium | `SimulationClock`, `CanvasRenderer`, `Graph` | Planned |
| **8. Pipes & Strings** | *Standing Waves & Acoustic Resonators* | Standing wave nodes and antinodes, harmonics in strings, open/closed pipes | Resonator type (String, Open pipe, Closed pipe), length $L$, harmonic mode $n$ ($1\text{--}6$), end correction $e$ | Stationary waveform with fixed nodes and fluttering antinodes; acoustic pressure distribution inside organ pipes | $f_n = n \frac{v}{2L}$ (string/open), $f_n = (2n-1)\frac{v}{4L}$ (closed) | Frequency spectrum harmonics bar chart | Medium | `SimulationClock`, `CanvasRenderer`, `Graph` | Planned |
| **9. Acoustic Phenomenon** | *Doppler Effect & Acoustic Beats* | Frequency shifts due to source motion, acoustic beats | Source speed $v_s$ ($-100\text{ to }+100\text{ m/s}$), observer speed $v_o$, frequencies $f_1, f_2$ | Moving sound emitter compressing circular wavefronts ahead and stretching behind; audio beat envelope waveform | $f' = f\left(\frac{v \pm v_o}{v \mp v_s}\right)$, $f_{\text{beat}} = \|f_1 - f_2\|$ | Received frequency $f'$ vs. time $t$ | Medium | `Vector2`, `SimulationClock`, `CanvasRenderer`, `Graph` | Planned |
| **10. Nature of Light** | *Huygens' Wavefront Construction* | Huygens' secondary wavelets, reflection and refraction wave geometry | Incident angle $i$, medium wave speeds $v_1, v_2$ | Advancing plane wavefront emitting circular secondary wavelets along boundary; reflected and refracted wavefront envelope | $\frac{\sin i}{\sin r} = \frac{v_1}{v_2} = \frac{n_2}{n_1}$, $c = \frac{1}{\sqrt{\mu_0\epsilon_0}}$ | Wavefront angles across interface | Medium | `Vector2`, `CanvasRenderer`, `Camera2D` | Planned |
| **11. Interference** | *Young's Double-Slit & Thin Films* | Optical interference, constructive/destructive fringes, fringe width | Slit separation $d$ ($0.1\text{--}2\text{ mm}$), screen distance $D$ ($0.5\text{--}3\text{ m}$), wavelength $\lambda$ ($400\text{--}700\text{ nm}$), thin film $t$ | Monochromatic wave passing through double slits generating alternating bright/dark fringe intensity bands on screen | $\Delta x = \frac{y d}{D}$, $\beta = \frac{\lambda D}{d}$, $I = 4I_0\cos^2(\phi/2)$ | Screen Intensity Distribution $I(y)$ | High | `CanvasRenderer`, `Camera2D`, `Graph`, `TVSlider` | Planned |
| **12. Diffraction** | *Single Slit & Diffraction Grating* | Wave diffraction, central maximum spreading, grating spectral lines | Slit width $a$ ($0.05\text{--}0.5\text{ mm}$), grating lines/mm $N$ ($100\text{--}600$), wavelength $\lambda$ | Single-slit broad central diffraction peak; multi-slit grating producing razor-sharp spectral color line dispersion | $a\sin\theta = n\lambda$ (minima), $(a+b)\sin\theta = n\lambda$ (grating) | Diffraction intensity curve $I(\theta)$ | High | `CanvasRenderer`, `Camera2D`, `Graph` | Planned |
| **13. Polarisation** | *Malus's Law & Brewster's Polarizer* | Transverse wave polarization, Brewster's angle, analyzer transmission | Polarizer angle $\theta_1$, analyzer angle $\theta_2$, interface refractive index $n$ | Linearly polarized light passing through two rotating polaroids; light intensity dims according to $\cos^2\theta$ | $I = I_0\cos^2\theta$ (Malus), $\tan i_p = n$ (Brewster) | Transmitted intensity $I$ vs. angle $\theta$ | Low | `CanvasRenderer`, `Graph`, `TVSlider` | Planned |

---

### Content Area 4: Electricity and Magnetism

| Chapter | Proposed Simulation | Core Concept | Parameters | Visual Behavior | Key Equations | Graphs | Difficulty | Reusable Components | Status |
|---|---|---|---|---|---|---|:---:|---|:---:|
| **14. Circuits** | *Kirchhoff's Laws & Potentiometer* | Multi-loop circuit analysis, Wheatstone bridge, potentiometer balancing | Resistors $P, Q, R, X$, battery voltages $E_1, E_2$, slide wire jockey contact position $l$ | Interactive bridge network; sliding jockey along 1-meter wire to achieve galvanometer null deflection ($I_g = 0$) | $\sum I = 0$, $\sum \Delta V = 0$, $\frac{P}{Q} = \frac{R}{S}$, $\frac{E_1}{E_2} = \frac{l_1}{l_2}$ | Galvanometer current $I_g$ vs. jockey $l$ | Medium | `CanvasRenderer`, `Graph`, `InputManager` | Planned (Priority #5) |
| **15. Thermoelectric** | *Thermocouple & Seebeck Effect* (Model) | Thermoelectric EMF, neutral temperature, inversion temperature | Hot junction temperature $T_H$ ($0\text{--}600^\circ\text{C}$), cold junction $T_C$, metal pair (Fe-Cu, Bi-Sb) | Thermocouple junctions in hot oil and ice baths with parabolic EMF voltmeter; polarity flips past inversion temp | $E = \alpha\theta + \frac{1}{2}\beta\theta^2$, $\theta_n = -\alpha/\beta$, $\theta_i = 2\theta_n - \theta_c$ | Thermoelectric EMF $E$ vs. temperature $\theta$ | Low | `CanvasRenderer`, `Graph`, `TVSlider` | Planned |
| **16. Magnetic Fields** | *Biot-Savart & Lorentz Force Chamber* | Magnetic field of coils/solenoids, Lorentz helical force on charge | Current $I$ ($1\text{--}20\text{ A}$), coil radius $R$, magnetic field $\vec{B}$, particle charge $q$, velocity $\vec{v}$ | Magnetic field vector lines around circular coil; charged particle spiraling in magnetic field along helical trajectory | $B = \frac{\mu_0 N I}{2R}$, $\vec{F} = q(\vec{v}\times\vec{B})$, $r = \frac{mv}{qB}$ | $B(x)$ along coil axis, Radius $r$ vs. $v$ | High | `Vector2`, `SimulationClock`, `Camera2D`, `CanvasRenderer` | Planned |
| **17. Magnetic Properties** | *Magnetic Hysteresis ($B\text{–}H$) Loop* | Domain alignment, retentivity, coercivity, soft vs. hard ferromagnets | Magnetizing field $H$ amplitude, material selection (Soft Iron, Steel, Alnico) | Magnetic domains flipping orientation inside metallic crystal lattice; live trace of $B\text{–}H$ hysteresis loop | $\vec{B} = \mu_0(\vec{H} + \vec{M})$, Energy Loss $= \oint H dB$ | Dynamic Hysteresis Curve $B(H)$ | Medium | `CanvasRenderer`, `Graph`, `TVSlider` | Planned |
| **18. Induction** | *Faraday's Induction & AC Generator* | Magnetic flux change, Lenz's law opposing current, sinusoidal AC EMF | Magnet speed $v$, coil turns $N$, armature rotation frequency $\omega$, magnetic field $B$ | Bar magnet plunging into coil inducing current in galvanometer; rotating rectangular loop generating AC sine wave | $\mathcal{E} = -N \frac{d\Phi_B}{dt} = -N B A \omega \cos(\omega t)$, $\mathcal{E} = B l v$ | Induced EMF $\mathcal{E}(t)$, Flux $\Phi_B(t)$ | Medium | `SimulationClock`, `Camera2D`, `CanvasRenderer`, `Graph` | Planned |
| **19. Alternating Current** | *Series LCR Resonator & Phasors* | Inductive/capacitive reactance, resonance frequency, phase angle, power factor | Resistance $R$ ($10\text{--}500\text{ }\Omega$), inductance $L$ ($10\text{--}500\text{ mH}$), capacitance $C$ ($1\text{--}100\text{ }\mu\text{F}$), AC frequency $f$ | Rotating phasor diagrams ($V_R, V_L, V_C$); voltage and current sinusoidal waveforms demonstrating phase lead/lag | $Z = \sqrt{R^2 + (X_L - X_C)^2}$, $f_0 = \frac{1}{2\pi\sqrt{LC}}$, $Q = \frac{\omega_0 L}{R}$ | Current $I$ vs. frequency $f$ (Resonance curve) | Medium | `SimulationClock`, `CanvasRenderer`, `Graph` | Planned |

---

### Content Area 5: Modern Physics

| Chapter | Proposed Simulation | Core Concept | Parameters | Visual Behavior | Key Equations | Graphs | Difficulty | Reusable Components | Status |
|---|---|---|---|---|---|---|:---:|---|:---:|
| **20. Electrons** | *J.J. Thomson $e/m$ & Millikan Oil Drop* | Specific charge, crossed fields velocity selector, charge quantization | Electric field $E$, magnetic field $B$, accelerating voltage $V_a$, oil droplet radius and charge | Green electron beam bending in crossed fields; oil droplets suspended stationery in electric field or falling under gravity | $\frac{e}{m} = \frac{E^2}{2 V_a B^2}$, $v = E/B$, $q = \frac{6\pi\eta r (v_1 + v_2)}{E} = ne$ | Beam deflection $y(E, B)$, Droplet charge histogram | High | `Vector2`, `SimulationClock`, `Camera2D`, `CanvasRenderer` | Planned |
| **21. Photons** | *Photoelectric Effect Laboratory* | Photon quantization, work function, threshold frequency, stopping potential | Incident light frequency $\nu$ ($300\text{--}800\text{ nm}$), light intensity ($0\text{--}100\%$), target metal (Cs, Na, Zn, Pt) | Monochromatic photons striking cathode ejecting photoelectrons; electrons retarding against stopping voltage $V_0$ | $K_{\max} = eV_0 = h\nu - \Phi_0 = h(\nu - \nu_0)$, $I_{\text{photo}} \propto \text{Intensity}$ | Stopping potential $V_0$ vs. frequency $\nu$, Current vs. Voltage | Medium | `Vector2`, `SimulationClock`, `CanvasRenderer`, `Graph` | Planned |
| **22. Semiconductors** | *Diode Rectification & Logic Gates* | p-n junction $V\text{–}I$ curve, AC half/full-wave rectification, logic gates | Diode biasing voltage ($-10\text{ to }+2\text{ V}$), AC input voltage, filter capacitor, logic gate inputs (0/1) | $V\text{–}I$ curve tracing knee and breakdown; bridge rectifier converting AC sine to smooth DC output; interactive logic gates | $I = I_0(e^{eV/\eta k_BT} - 1)$, $V_{\text{dc}} = \frac{2V_m}{\pi}$ | Diode $I\text{–}V$ curve, Input/Output voltage $V(t)$ | Medium | `SimulationClock`, `CanvasRenderer`, `Graph` | Planned |
| **23. Quantization** | *Bohr Hydrogen Atom & Spectral Series* | Quantized angular momentum, discrete energy levels, spectral emissions | Principal quantum level transitions ($n_i \to n_f$), incident photon energy | Electron orbiting in discrete circular Bohr shells; quantum jump emits colored photon; live emission spectrum line appears | $L = n\frac{h}{2\pi}$, $E_n = -\frac{13.6\text{ eV}}{n^2}$, $\frac{1}{\lambda} = R_H\left(\frac{1}{n_1^2} - \frac{1}{n_2^2}\right)$ | Energy level ladder diagram, Hydrogen emission spectrum | Medium | `CanvasRenderer`, `Camera2D`, `Graph` | Planned |
| **24. Radioactivity** | *Radioactive Decay & Half-Life Chamber* | Spontaneous decay, exponential decay law, half-life, random simulation | Parent radioisotope ($^{14}\text{C}$, $^{131}\text{I}$, $^{238}\text{U}$), initial nuclei count ($100\text{--}5000$), time step | Array of unstable nuclei randomly decaying into daughter nuclei with emission flashes ($\alpha, \beta, \gamma$); live count curve | $-\frac{dN}{dt} = \lambda N$, $N(t) = N_0 e^{-\lambda t}$, $T_{1/2} = \frac{\ln 2}{\lambda} \approx \frac{0.693}{\lambda}$ | Remaining nuclei $N(t)$ vs. time $t$ | Low | `SimulationClock`, `CanvasRenderer`, `Graph` | Planned |
| **25. Recent Trends** | *Seismic Wave Propagation in Nepal* (Interactive Model) | $P$- and $S$-waves, epicenter determination, earthquake hazard in Nepal | Focus depth, epicenter distance, tectonic fault slip amplitude | Longitudinal $P$-waves and transverse $S$-waves radiating through Earth crust layers; seismograph pen recording trace | $d = \frac{v_P v_S}{v_P - v_S}(t_S - t_P)$, $h = \frac{2\Delta L}{L}$ | Seismogram recording $A(t)$ with $P/S$ arrival | Medium | `Vector2`, `SimulationClock`, `CanvasRenderer`, `Camera2D` | Planned |

---

## 4. Development Prioritization & Recommended Learning Progression

### Completed Baseline
1. **Kinematics — Projectile Motion (`projectile-motion`)** — *Grade 11, Chapter 3 (Kinematics)*  
   - Status: **Verified on Android** (Tested and verified on physical Samsung Galaxy S21 FE `[ANDROID-TEST-DEVICE]`).
   - Core engine: Kinematics, trajectory trails, vector rendering, 1080p responsive canvas layout.

2. **Newton's Second Law of Motion (`newtons-second-law`)** — *Grade 11, Chapter 4 (Dynamics)*  
   - Status: **Verified on Android** (Tested and verified on physical Samsung Galaxy S21 FE `[ANDROID-TEST-DEVICE]`).
   - Core engine: Force equilibrium, static breakaway, kinetic friction arrest, dynamic tracking camera.

---

### Recommended Next 5 Simulations in Learning Progression

To systematically expand Physics Lab while maximizing engine component reuse and curriculum impact, the next 5 simulations should be developed in the following pedagogical order:

```
[Completed] Projectile Motion (Kinematics)
     │
[Completed] Newton's Second Law (Dynamics)
     │
     ▼
1. Simple Harmonic Motion (Spring & Pendulum) [Grade 12, Chapter 2: Periodic Motion]
   → Exercises periodic clock, restoring force math, phase space, dual systems.
     │
     ▼
2. Mechanical Energy Conservation & Incline [Grade 11, Chapter 5: Work, Energy & Power]
   → Exercises path integration, energy exchanges (K + U), variable forces.
     │
     ▼
3. Centripetal Dynamics & Highway Banking [Grade 11, Chapter 6: Circular Motion]
   → Exercises 2D/3D composite views, normal & centripetal acceleration vectors.
     │
     ▼
4. Geometric Optics: Curved Mirrors & Lenses [Grade 11, Chapters 14 & 17: Waves and Optics]
   → Introduces light ray-tracing engine, virtual/real image formation, focal math.
     │
     ▼
5. DC Circuits & Potentiometer Laboratory [Grade 11, Chapter 23 & Grade 12, Chapter 14]
   → Introduces multi-loop circuit topologies, Kirchhoff solvers, null-deflection balance.
```

#### Detailed Rationale for Next 5 Simulations:

1. **Simple Harmonic Motion (`simple-harmonic-motion` — Grade 12, Chapter 2):**
   - *Curriculum Weight:* Heavily tested in NEB exams; direct conceptual continuation of dynamics.
   - *Engine Reusability:* Reuses `SimulationClock`, `Vector2`, and `Graph`. Adds sinusoidal vector oscillations and phase space orbits.
   - *Educational Value:* Students struggle with the $90^\circ$ phase lag between velocity and displacement and $180^\circ$ acceleration inversion; visualization makes this immediately intuitive.

2. **Mechanical Energy Conservation & Incline (`work-energy-incline` — Grade 11, Chapter 5):**
   - *Curriculum Weight:* Central unifying principle of mechanics; directly connects Grade 11 Kinematics and Dynamics.
   - *Engine Reusability:* Reuses `Camera2D` and `CanvasRenderer`. Introduces dynamic stacked energy bar charts.
   - *Educational Value:* Visually demonstrates that total mechanical energy remains constant in conservative systems while friction irreversibly converts work into thermal dissipation.

3. **Centripetal Dynamics & Highway Banking (`circular-motion-banking` — Grade 11, Chapter 6):**
   - *Curriculum Weight:* High practical relevance to Nepal's mountainous highway engineering (e.g. BP Highway, Prithvi Highway).
   - *Engine Reusability:* Reuses vector arrow renderers from Newton's Second Law for normal force and friction components.
   - *Educational Value:* Clarifies that centripetal force is not an independent mysterious force, but the resultant of real physical forces (normal, gravity, friction).

4. **Geometric Optics: Curved Mirrors & Lenses (`curved-mirrors-optics` / `thin-lens-bench` — Grade 11, Chapters 14 & 17):**
   - *Curriculum Weight:* Bridges Grade 11 geometrical optics; highly tested numerical and ray diagram exam questions.
   - *Engine Reusability:* Establishes a reusable 2D Ray Tracing engine applicable to Mirrors, Prisms, and Lenses.
   - *Educational Value:* Allows real-time interactive moving of objects past $2F$, $F$, and between $F$ and $P$, instantly demonstrating real vs. virtual image transitions.

5. **DC Circuits & Potentiometer Laboratory (`dc-circuits-workbench` / `kirchhoff-potentiometer` — Grade 11, Chapter 23 & Grade 12, Chapter 14):**
   - *Curriculum Weight:* Spans both Grade 11 (Ohm's law, internal resistance) and Grade 12 (Kirchhoff's laws, Potentiometer).
   - *Engine Reusability:* Establishes a circuit diagram renderer and linear equation solver for circuit branch currents.
   - *Educational Value:* Students frequently make laboratory errors with sliding potentiometer jockeys and galvanometer connections; a virtual lab provides safe, risk-free pre-lab training.
