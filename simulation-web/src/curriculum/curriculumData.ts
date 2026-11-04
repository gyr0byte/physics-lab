/**
 * Official Nepal CDC Physics Curriculum Data Model
 * Institution: Shree Public High School, Dharan-12, Sunsari, Nepal
 * Academic Authority: Curriculum Development Centre (CDC), Sanothimi, Bhaktapur
 * Standard: Secondary Level Physics (Grades 11 & 12 Science)
 */

export type SimulationStatus =
  | 'Planned'
  | 'In Development'
  | 'Implemented'
  | 'Tested'
  | 'Verified on Android';

export type ContentAreaId =
  | 'mechanics'
  | 'heat-and-thermodynamics'
  | 'waves-and-optics'
  | 'electricity-and-magnetism'
  | 'modern-physics';

export interface CurriculumSimulationRef {
  id: string;
  title: string;
  description: string;
  status: SimulationStatus;
  difficulty: 'Low' | 'Medium' | 'High';
}

export interface ChapterObjectives {
  conceptual: string[];
  mathematical: string[];
  numerical: string[];
  practical: string[];
  applications: string[];
}

export interface ChapterSourceTraceability {
  document: string;
  edition: string;
  startPage: number;
  status: 'Official CDC Chapter';
}

export interface CurriculumChapter {
  id: string;
  chapterNumber: number;
  officialTitle: string;
  displayTitle: string;
  title: string;
  grade: 11 | 12;
  contentAreaId: ContentAreaId;
  textbookEdition: string;
  textbookStartPage: number;
  sourceTraceability: ChapterSourceTraceability;
  subtopics: string[];
  objectives: ChapterObjectives;
  keyEquations: string[];
  practicals: string[];
  simulations: CurriculumSimulationRef[];
}

export interface CurriculumContentArea {
  id: ContentAreaId;
  name: string;
  grade: 11 | 12;
  order: number;
  chapterCount: number;
  chapters: CurriculumChapter[];
}

export interface CurriculumGrade {
  grade: 11 | 12;
  title: string;
  totalChapters: number;
  contentAreas: CurriculumContentArea[];
}

// ==========================================
// GRADE 11 CHAPTER DEFINITIONS (26 Chapters)
// ==========================================

export const GRADE_11_CHAPTERS: CurriculumChapter[] = [
  // --- Content Area 1: Mechanics (Chapters 1-8) ---
  {
    id: 'g11-mech-c01-physical-quantities',
    chapterNumber: 1,
    officialTitle: 'Physical Quantities',
    displayTitle: 'Physical Quantities',
    title: 'Physical Quantities',
    textbookEdition: 'CDC First Edition 2024',
    textbookStartPage: 1,
    sourceTraceability: {
      document: 'Physics Grade 11',
      edition: 'CDC First Edition 2024',
      startPage: 1,
      status: 'Official CDC Chapter',
    },
    grade: 11,
    contentAreaId: 'mechanics',
    subtopics: [
      'Fundamental and derived units',
      'Dimensions and dimensional formulas',
      'Principle of homogeneity',
      'Uses and limitations of dimensional analysis',
      'Errors in measurement (absolute, relative, percentage)',
      'Significant figures and rounding off',
    ],
    objectives: {
      conceptual: ['Distinguish base from derived physical quantities', 'Understand homogeneity of physical dimensions'],
      mathematical: ['Express dimensions as [M^a L^b T^c I^d]', 'Calculate percentage propagation of errors'],
      numerical: ['Check correctness of physical formulas', 'Deduce empirical relation exponents'],
      practical: ['Measure dimensions with Vernier calipers and micrometer screw gauge'],
      applications: ['Standardized industrial measurement and scientific unit conversion'],
    },
    keyEquations: [
      '[Q] = [M^a L^b T^c I^d]',
      'Delta Z / Z = sqrt((a Delta A / A)^2 + (b Delta B / B)^2)',
    ],
    practicals: [
      'Measurement of length, diameter, and depth using Vernier calipers',
      'Measurement of diameter and thickness using micrometer screw gauge',
      'Measurement of radius of curvature using spherometer',
    ],
    simulations: [
      {
        id: 'virtual-metrology',
        title: 'Virtual Precision Metrology',
        description: 'Interactive Vernier caliper and micrometer screw gauge with zero error adjustment.',
        status: 'Planned',
        difficulty: 'Low',
      },
    ],
  },
  {
    id: 'g11-mech-c02-vectors',
    chapterNumber: 2,
    officialTitle: 'Vectors',
    displayTitle: 'Vectors',
    title: 'Vectors',
    textbookEdition: 'CDC First Edition 2024',
    textbookStartPage: 21,
    sourceTraceability: {
      document: 'Physics Grade 11',
      edition: 'CDC First Edition 2024',
      startPage: 21,
      status: 'Official CDC Chapter',
    },
    grade: 11,
    contentAreaId: 'mechanics',
    subtopics: [
      'Scalars and vectors',
      'Vector representation and unit vectors',
      'Triangle, parallelogram, and polygon laws of vector addition',
      'Resolution of vectors in 2D and 3D',
      'Scalar (dot) product and applications',
      'Vector (cross) product and applications',
    ],
    objectives: {
      conceptual: ['Understand magnitude and direction properties', 'Visualize dot and cross product orientations'],
      mathematical: ['Derive parallelogram resultant formula', 'Compute vector components and scalar/vector products'],
      numerical: ['Resolve coplanar forces into x/y axes', 'Calculate angle between 3D vectors via dot product'],
      practical: ['Verify parallelogram law of vector addition using Gravesand apparatus'],
      applications: ['Structural truss force calculations and aerial navigation'],
    },
    keyEquations: [
      'R = sqrt(P^2 + Q^2 + 2PQ cos theta)',
      'tan alpha = (Q sin theta) / (P + Q cos theta)',
      'A . B = Ax Bx + Ay By + Az Bz',
    ],
    practicals: [
      'Verification of parallelogram law of forces using Gravesand force board',
    ],
    simulations: [
      {
        id: 'vector-addition',
        title: 'Vector Addition & Resolution Laboratory',
        description: 'Interactive vector addition, 2D component resolution, and dot/cross product visualization.',
        status: 'Planned',
        difficulty: 'Low',
      },
    ],
  },
  {
    id: 'g11-mech-c03-kinematics',
    chapterNumber: 3,
    officialTitle: 'Kinematics',
    displayTitle: 'Kinematics',
    title: 'Kinematics',
    textbookEdition: 'CDC First Edition 2024',
    textbookStartPage: 41,
    sourceTraceability: {
      document: 'Physics Grade 11',
      edition: 'CDC First Edition 2024',
      startPage: 41,
      status: 'Official CDC Chapter',
    },
    grade: 11,
    contentAreaId: 'mechanics',
    subtopics: [
      'Position, displacement, speed, and instantaneous velocity',
      'Uniform and accelerated rectilinear motion',
      'Kinematic equations of motion under constant acceleration',
      'Free fall under gravity',
      'Relative velocity in 1D and 2D',
      'Projectile motion: horizontal and oblique projections',
    ],
    objectives: {
      conceptual: ['Understand frame of reference', 'Grasp independence of orthogonal horizontal and vertical motions'],
      mathematical: ['Derive constant acceleration kinematic equations', 'Derive parabolic trajectory y(x), time of flight, range, max height'],
      numerical: ['Solve multi-body chase and relative velocity problems', 'Calculate projectile coordinates and strike angles'],
      practical: ['Determine acceleration due to gravity (g) using a simple pendulum'],
      applications: ['Ballistics, athletic projectile throwing sports, and vehicle stopping distance estimation'],
    },
    keyEquations: [
      'v = u + at',
      's = ut + 0.5 a t^2',
      'v^2 = u^2 + 2as',
      'T = 2u sin theta / g',
      'R = u^2 sin(2 theta) / g',
      'H = (u sin theta)^2 / (2g)',
    ],
    practicals: [
      'Determination of acceleration due to gravity using a simple pendulum',
    ],
    simulations: [
      {
        id: 'projectile-motion',
        title: 'Kinematics — Projectile Motion',
        description: 'Idealized 2D projectile motion under gravity with launch angle, velocity, trajectories, and real-time graphs.',
        status: 'Verified on Android',
        difficulty: 'Medium',
      },
    ],
  },
  {
    id: 'g11-mech-c04-dynamics',
    chapterNumber: 4,
    officialTitle: 'Dynamics',
    displayTitle: 'Dynamics',
    title: 'Dynamics',
    textbookEdition: 'CDC First Edition 2024',
    textbookStartPage: 73,
    sourceTraceability: {
      document: 'Physics Grade 11',
      edition: 'CDC First Edition 2024',
      startPage: 73,
      status: 'Official CDC Chapter',
    },
    grade: 11,
    contentAreaId: 'mechanics',
    subtopics: [
      "Newton's three laws of motion",
      'Inertia, linear momentum, and impulse',
      'Principle of conservation of linear momentum and recoil of gun',
      'Static and kinetic friction',
      'Laws of limiting friction and coefficient of friction',
      'Angle of friction and angle of repose',
      'Motion along smooth and rough inclined planes',
    ],
    objectives: {
      conceptual: ['Relate net force to rate of change of momentum', 'Distinguish static threshold from kinetic friction'],
      mathematical: ['Derive F = ma', 'Formulate incline acceleration a = g(sin theta - mu cos theta)'],
      numerical: ['Solve coupled Atwood pulley systems', 'Calculate force required to initiate and maintain motion'],
      practical: ['Determine coefficient of static and dynamic friction using an inclined plane'],
      applications: ['Automotive braking systems, ABS control, conveyor belts, and rock climbing shoe friction'],
    },
    keyEquations: [
      'F_net = m * a',
      'J = Integral(F dt) = Delta p',
      'f_s_max = mu_s * N',
      'f_k = mu_k * N',
      'mu = tan(theta_repose)',
    ],
    practicals: [
      'Verification of Newton second law using trolley and photogates',
      'Determination of coefficient of friction using inclined plane',
    ],
    simulations: [
      {
        id: 'newtons-second-law',
        title: "Newton's Second Law of Motion",
        description: 'Sliding crate on distance track with mass, applied force, static/kinetic friction, vectors, and live F_net = m*a verification.',
        status: 'Verified on Android',
        difficulty: 'Medium',
      },
    ],
  },
  {
    id: 'g11-mech-c05-work-energy-power',
    chapterNumber: 5,
    officialTitle: 'Work, Energy & Power',
    displayTitle: 'Work, Energy and Power',
    title: 'Work, Energy and Power',
    textbookEdition: 'CDC First Edition 2024',
    textbookStartPage: 103,
    sourceTraceability: {
      document: 'Physics Grade 11',
      edition: 'CDC First Edition 2024',
      startPage: 103,
      status: 'Official CDC Chapter',
    },
    grade: 11,
    contentAreaId: 'mechanics',
    subtopics: [
      'Work done by constant and variable forces',
      'Kinetic energy and work-energy theorem',
      'Potential energy (gravitational and spring elastic)',
      'Conservative and non-conservative forces',
      'Conservation of mechanical energy',
      'Power: average and instantaneous (P = F . v)',
      'Elastic and inelastic collisions in 1D and coefficient of restitution',
    ],
    objectives: {
      conceptual: ['Comprehend work as scalar energy transfer', 'Analyze mechanical energy interchange in isolated systems'],
      mathematical: ['Derive work-energy theorem W = Delta K', 'Derive final velocities after 1D elastic collision'],
      numerical: ['Calculate energy dissipated in inelastic impacts', 'Compute pump and engine power requirements'],
      practical: ['Verify mechanical energy conservation using rolling spheres or pendulums'],
      applications: ['Hydropower generation in Nepal and automotive crash crumple zones'],
    },
    keyEquations: [
      'W = Integral(F dx)',
      'K = 0.5 m v^2',
      'U_spring = 0.5 k x^2',
      'P = F . v',
      'e = (v2 - v1) / (u1 - u2)',
    ],
    practicals: [
      'Verification of conservation of mechanical energy using rolling spheres on an incline',
    ],
    simulations: [
      {
        id: 'work-energy-incline',
        title: 'Mechanical Energy Conservation & Incline',
        description: 'Track ramp with kinetic, potential, and thermal energy stacked bar charts and spring bumpers.',
        status: 'Planned',
        difficulty: 'Medium',
      },
    ],
  },
  {
    id: 'g11-mech-c06-circular-motion',
    chapterNumber: 6,
    officialTitle: 'Circular Motion',
    displayTitle: 'Circular Motion',
    title: 'Circular Motion',
    textbookEdition: 'CDC First Edition 2024',
    textbookStartPage: 132,
    sourceTraceability: {
      document: 'Physics Grade 11',
      edition: 'CDC First Edition 2024',
      startPage: 132,
      status: 'Official CDC Chapter',
    },
    grade: 11,
    contentAreaId: 'mechanics',
    subtopics: [
      'Angular displacement, velocity, and acceleration',
      'Centripetal acceleration and centripetal force',
      'Motion on level circular roads',
      'Banking of roads and railway tracks',
      'Conical pendulum',
      'Motion in a vertical circle and tension variations',
    ],
    objectives: {
      conceptual: ['Understand circular motion as accelerated motion', 'Understand centripetal force as resultant of physical forces'],
      mathematical: ['Derive a_c = v^2/r', 'Derive banking angle tan theta = v^2/rg', 'Derive vertical loop tension critical speeds'],
      numerical: ['Compute maximum safe speed on curves with friction', 'Calculate string tension at highest and lowest points'],
      practical: ['Measure centripetal force using whirling stopper kit'],
      applications: ['Highway engineering in hilly Nepal terrains and centrifuge separation'],
    },
    keyEquations: [
      'a_c = v^2 / r = omega^2 * r',
      'F_c = m * v^2 / r',
      'tan theta = v^2 / (r * g)',
      'v_max_banked = sqrt(r * g * (mu + tan theta) / (1 - mu * tan theta))',
    ],
    practicals: [
      'Study of circular motion and centripetal force using a conical pendulum',
    ],
    simulations: [
      {
        id: 'circular-motion-banking',
        title: 'Centripetal Dynamics & Highway Banking',
        description: 'Vehicle traversing curved highway with banking angle, friction, and vertical loop tension visualization.',
        status: 'Planned',
        difficulty: 'Medium',
      },
    ],
  },
  {
    id: 'g11-mech-c07-gravitation',
    chapterNumber: 7,
    officialTitle: 'Gravitation',
    displayTitle: 'Gravitation',
    title: 'Gravitation',
    textbookEdition: 'CDC First Edition 2024',
    textbookStartPage: 154,
    sourceTraceability: {
      document: 'Physics Grade 11',
      edition: 'CDC First Edition 2024',
      startPage: 154,
      status: 'Official CDC Chapter',
    },
    grade: 11,
    contentAreaId: 'mechanics',
    subtopics: [
      "Newton's universal law of gravitation",
      'Gravitational constant and field intensity',
      'Variation of g with altitude, depth, and latitude',
      'Gravitational potential and potential energy',
      'Escape velocity and orbital velocity of satellites',
      'Geostationary satellites and weightlessness',
      "Kepler's laws of planetary motion",
    ],
    objectives: {
      conceptual: ['Understand gravitational field lines and potential wells', 'Interpret orbital free-fall weightlessness'],
      mathematical: ['Derive g variation with height and depth', 'Derive escape velocity v_e = sqrt(2gR)', 'Prove Kepler third law'],
      numerical: ['Compute geostationary orbit altitudes', 'Calculate planetary escape velocities'],
      practical: ['Determine g using bar pendulum or Kater reversible pendulum'],
      applications: ['Satellite communications, GPS constellation tracking, and space missions'],
    },
    keyEquations: [
      'F = G * m1 * m2 / r^2',
      'g = G * M / R^2',
      'v_e = sqrt(2 * G * M / R)',
      'v_o = sqrt(G * M / r)',
      'T^2 = (4 * pi^2 / (G * M)) * r^3',
    ],
    practicals: [
      'Determination of acceleration due to gravity using a compound bar pendulum',
    ],
    simulations: [
      {
        id: 'orbital-mechanics',
        title: 'Orbital Mechanics & Planetary Satellites',
        description: 'Planetary satellite orbits with Kepler equal-area sweep wedges, escape speed, and potential energy wells.',
        status: 'Planned',
        difficulty: 'High',
      },
    ],
  },
  {
    id: 'g11-mech-c08-elasticity',
    chapterNumber: 8,
    officialTitle: 'Elasticity',
    displayTitle: 'Elasticity',
    title: 'Elasticity',
    textbookEdition: 'CDC First Edition 2024',
    textbookStartPage: 184,
    sourceTraceability: {
      document: 'Physics Grade 11',
      edition: 'CDC First Edition 2024',
      startPage: 184,
      status: 'Official CDC Chapter',
    },
    grade: 11,
    contentAreaId: 'mechanics',
    subtopics: [
      'Stress and strain (tensile, shear, volume)',
      "Hooke's law and elastic limit",
      'Stress-strain curve for metallic wire',
      "Moduli of elasticity: Young's, Bulk, Shear moduli",
      'Poisson ratio and strain energy density',
    ],
    objectives: {
      conceptual: ['Distinguish elastic recovery from plastic yield', 'Interpret stress-strain curve regions'],
      mathematical: ['Formulate Y, B, eta moduli', 'Derive strain energy density u = 0.5 * stress * strain'],
      numerical: ['Calculate elongation of loaded cables', 'Compute volume compression of submerged liquids'],
      practical: ["Determine Young's modulus of a wire using Searle's apparatus"],
      applications: ['Structural steel beam engineering, bridge load limits, and seismic dampers'],
    },
    keyEquations: [
      'Y = (F * L) / (A * Delta L)',
      'B = - (V * Delta P) / Delta V',
      'sigma = - (Delta d / d) / (Delta L / L)',
      'U / V = 0.5 * stress * strain',
    ],
    practicals: [
      "Determination of Young's modulus of a wire using Searle's apparatus",
    ],
    simulations: [
      {
        id: 'elasticity-tensile',
        title: "Stress-Strain & Searle's Tensile Tester",
        description: 'Tensile wire stretching under variable load with real-time stress-strain curve and Young modulus calculation.',
        status: 'Planned',
        difficulty: 'Medium',
      },
    ],
  },

  // --- Content Area 2: Heat and Thermodynamics (Chapters 9-13) ---
  {
    id: 'g11-heat-c09-heat-and-temperature',
    chapterNumber: 9,
    officialTitle: 'Heat and Temperature',
    displayTitle: 'Heat and Temperature',
    title: 'Heat and Temperature',
    textbookEdition: 'CDC First Edition 2024',
    textbookStartPage: 208,
    sourceTraceability: {
      document: 'Physics Grade 11',
      edition: 'CDC First Edition 2024',
      startPage: 208,
      status: 'Official CDC Chapter',
    },
    grade: 11,
    contentAreaId: 'heat-and-thermodynamics',
    subtopics: [
      'Thermal equilibrium and Zeroth law of thermodynamics',
      'Thermometric properties and thermometer construction',
      'Temperature scales: Celsius, Fahrenheit, Kelvin',
      'Interconversion between temperature scales',
      'Triple point of water as thermodynamic standard',
    ],
    objectives: {
      conceptual: ['Understand temperature as thermal equilibrium indicator', 'Interpret temperature as average molecular kinetic energy'],
      mathematical: ['Derive temperature scale conversion formulas', 'Formulate gas thermometry T(P)'],
      numerical: ['Convert temperatures across international scales', 'Find equal-reading temperatures'],
      practical: ['Calibrate unmarked liquid-in-glass thermometer'],
      applications: ['Cryogenics, industrial process control, and clinical diagnostics'],
    },
    keyEquations: [
      'C / 5 = (F - 32) / 9 = (K - 273.15) / 5',
      'T(P) = 273.16 * (P / P_tp)',
    ],
    practicals: [
      'Calibration of a laboratory thermometer using fixed reference points',
    ],
    simulations: [
      {
        id: 'temperature-scales',
        title: 'Temperature Scales & Molecular Thermometer',
        description: 'Interactive side-by-side Celsius/Fahrenheit/Kelvin scales with vibrating molecular lattice.',
        status: 'Planned',
        difficulty: 'Low',
      },
    ],
  },
  {
    id: 'g11-heat-c10-thermal-expansion',
    chapterNumber: 10,
    officialTitle: 'Thermal Expansion',
    displayTitle: 'Thermal Expansion',
    title: 'Thermal Expansion',
    textbookEdition: 'CDC First Edition 2024',
    textbookStartPage: 222,
    sourceTraceability: {
      document: 'Physics Grade 11',
      edition: 'CDC First Edition 2024',
      startPage: 222,
      status: 'Official CDC Chapter',
    },
    grade: 11,
    contentAreaId: 'heat-and-thermodynamics',
    subtopics: [
      'Linear, superficial, and cubical expansion of solids',
      'Relations between coefficients alpha, beta, gamma',
      'Apparent and real expansion of liquids',
      'Anomalous expansion of water and ecological importance',
      'Thermal stress in constrained metal rods',
    ],
    objectives: {
      conceptual: ['Understand asymmetric atomic potential well origin of expansion', 'Understand water density maximum at 4 deg C'],
      mathematical: ['Derive alpha : beta : gamma = 1 : 2 : 3', 'Calculate thermal stress F/A = Y * alpha * Delta T'],
      numerical: ['Compute expansion gaps for railway lines', 'Calculate liquid density changes with temperature'],
      practical: ['Determine coefficient of linear expansion of metal rod using Pullinger apparatus'],
      applications: ['Thermostats, bimetallic switches, and bridge expansion joints'],
    },
    keyEquations: [
      'L_t = L_0 * (1 + alpha * Delta T)',
      'V_t = V_0 * (1 + gamma * Delta T)',
      'gamma = 3 * alpha',
      'Stress = Y * alpha * Delta T',
    ],
    practicals: [
      'Determination of coefficient of linear expansion using Pullinger apparatus',
    ],
    simulations: [
      {
        id: 'thermal-expansion',
        title: 'Thermal Expansion & Bimetallic Strip',
        description: 'Heating metallic rods, bimetallic thermostat curvature, and anomalous water density curve.',
        status: 'Planned',
        difficulty: 'Low',
      },
    ],
  },
  {
    id: 'g11-heat-c11-quantity-of-heat',
    chapterNumber: 11,
    officialTitle: 'Quantity of Heat',
    displayTitle: 'Quantity of Heat',
    title: 'Quantity of Heat',
    textbookEdition: 'CDC First Edition 2024',
    textbookStartPage: 246,
    sourceTraceability: {
      document: 'Physics Grade 11',
      edition: 'CDC First Edition 2024',
      startPage: 246,
      status: 'Official CDC Chapter',
    },
    grade: 11,
    contentAreaId: 'heat-and-thermodynamics',
    subtopics: [
      'Specific heat capacity and molar heat capacity',
      'Principle of calorimetry (method of mixtures)',
      'Latent heat of fusion and vaporization',
      'Cooling curves and phase transition states',
      'Relative humidity and dew point',
    ],
    objectives: {
      conceptual: ['Distinguish sensible heat from latent heat', 'Understand molecular bond breaking during phase transitions'],
      mathematical: ['Formulate Q = m s Delta T and Q = m L', 'Formulate calorimetric heat balance equations'],
      numerical: ['Solve complex multi-phase ice-water-steam mixture problems', 'Determine mixture equilibrium temperatures'],
      practical: ['Determine specific heat capacity of a solid by method of mixtures using Regnault calorimeter'],
      applications: ['Climate moderation by oceans and refrigeration phase-change cycles'],
    },
    keyEquations: [
      'Q = m * s * Delta T',
      'Q = m * L',
      'Sum(Q_lost) = Sum(Q_gained)',
    ],
    practicals: [
      'Determination of specific heat capacity of a solid by method of mixtures',
      'Determination of latent heat of fusion of ice',
    ],
    simulations: [
      {
        id: 'calorimetry-phase-change',
        title: 'Calorimetry & Phase Change Laboratory',
        description: 'Interactive calorimeter mixing ice, water, and steam with live cooling and heating curves.',
        status: 'Planned',
        difficulty: 'Medium',
      },
    ],
  },
  {
    id: 'g11-heat-c12-rate-of-heat-flow',
    chapterNumber: 12,
    officialTitle: 'Rate of Heat Flow',
    displayTitle: 'Rate of Heat Flow',
    title: 'Rate of Heat Flow',
    textbookEdition: 'CDC First Edition 2024',
    textbookStartPage: 270,
    sourceTraceability: {
      document: 'Physics Grade 11',
      edition: 'CDC First Edition 2024',
      startPage: 270,
      status: 'Official CDC Chapter',
    },
    grade: 11,
    contentAreaId: 'heat-and-thermodynamics',
    subtopics: [
      'Conduction, convection, and radiation mechanisms',
      'Thermal conductivity (K) and temperature gradient',
      'Conduction through composite slabs in series and parallel',
      'Thermal resistance analogy with electrical resistance',
      'Blackbody radiation, Stefan-Boltzmann law, and Wien displacement law',
      "Newton's law of cooling",
    ],
    objectives: {
      conceptual: ['Contrast lattice/electron conduction with bulk convection and radiant photon emission'],
      mathematical: ['Derive dQ/dt = KA(T1 - T2)/x', 'State Stefan E = sigma T^4 and Wien lambda_m * T = b'],
      numerical: ['Calculate interface temperatures of multi-layer walls', 'Calculate radiant heat losses from bodies'],
      practical: ["Verify Newton's law of cooling using calorimeter cooling curves"],
      applications: ['Energy-efficient home building insulation in cold Himalayan climates and solar collectors'],
    },
    keyEquations: [
      'dQ / dt = (K * A * Delta T) / x = Delta T / R_th',
      'R_th = x / (K * A)',
      'E = epsilon * sigma * A * T^4',
      'lambda_max * T = b',
    ],
    practicals: [
      "Experimental verification of Newton's law of cooling",
    ],
    simulations: [
      {
        id: 'thermal-conduction',
        title: 'Thermal Conduction & Composite Walls',
        description: 'Multi-layer composite wall insulation with live color thermal gradient and heat flux particles.',
        status: 'Planned',
        difficulty: 'Medium',
      },
    ],
  },
  {
    id: 'g11-heat-c13-ideal-gas',
    chapterNumber: 13,
    officialTitle: 'Ideal Gas',
    displayTitle: 'Ideal Gas',
    title: 'Ideal Gas',
    textbookEdition: 'CDC First Edition 2024',
    textbookStartPage: 289,
    sourceTraceability: {
      document: 'Physics Grade 11',
      edition: 'CDC First Edition 2024',
      startPage: 289,
      status: 'Official CDC Chapter',
    },
    grade: 11,
    contentAreaId: 'heat-and-thermodynamics',
    subtopics: [
      "Gas laws: Boyle's, Charles's, and Avogadro's laws",
      'Ideal gas equation of state (PV = nRT)',
      'Kinetic theory postulates and derivation of gas pressure',
      'Microscopic interpretation of temperature (K_avg = 1.5 k_B T)',
      'Root mean square (RMS) molecular speed',
      'Deviations in real gases and van der Waals equation',
    ],
    objectives: {
      conceptual: ['Bridge macroscopic gas variables to molecular collisions', 'Understand pressure as rate of momentum transfer per unit area'],
      mathematical: ['Derive P = 1/3 rho v_rms^2', 'Derive v_rms = sqrt(3RT/M)'],
      numerical: ['Compute RMS velocities of air molecules at various temperatures', 'Calculate gas density from equation of state'],
      practical: ["Verify Boyle's law using Quill tube or Boyle's law apparatus"],
      applications: ['High-altitude mountaineering oxygen systems, SCUBA diving tanks, and pressure cookers'],
    },
    keyEquations: [
      'PV = nRT = N * k_B * T',
      'P = (1/3) * rho * v_rms^2',
      'v_rms = sqrt(3 * R * T / M)',
      'E_molecule = 1.5 * k_B * T',
    ],
    practicals: [
      "Verification of Boyle's law using Quill tube apparatus",
    ],
    simulations: [
      {
        id: 'kinetic-gas-simulator',
        title: 'Kinetic Gas Simulator (Maxwell-Boltzmann)',
        description: 'Bouncing 2D elastic gas particles in a variable-volume chamber with pressure gauge and RMS speed histogram.',
        status: 'Planned',
        difficulty: 'High',
      },
    ],
  },

  // --- Content Area 3: Wave and Optics (Chapters 14-18) ---
  {
    id: 'g11-opt-c14-reflection-curved-mirrors',
    chapterNumber: 14,
    officialTitle: 'Reflection at Curved Mirror',
    displayTitle: 'Reflection at Curved Mirrors',
    title: 'Reflection at Curved Mirrors',
    textbookEdition: 'CDC First Edition 2024',
    textbookStartPage: 307,
    sourceTraceability: {
      document: 'Physics Grade 11',
      edition: 'CDC First Edition 2024',
      startPage: 307,
      status: 'Official CDC Chapter',
    },
    grade: 11,
    contentAreaId: 'waves-and-optics',
    subtopics: [
      'Spherical concave and convex mirrors',
      'Cartesian sign convention',
      'Ray diagrams and geometric image formation',
      'Mirror formula derivation: 1/f = 1/u + 1/v',
      'Linear magnification and spherical aberration',
    ],
    objectives: {
      conceptual: ['Master ray tracing rules', 'Distinguish real images from virtual images'],
      mathematical: ['Derive f = R/2 and 1/v + 1/u = 1/f', 'Formulate magnification m = -v/u'],
      numerical: ['Calculate image distance and size for arbitrary object positions', 'Determine vehicle rearview mirror curvatures'],
      practical: ['Determine focal length of concave mirror using distant object and u-v methods'],
      applications: ['Vehicle headlights, shaving mirrors, solar concentrators, and reflecting telescopes'],
    },
    keyEquations: [
      'f = R / 2',
      '1 / f = 1 / u + 1 / v',
      'm = - v / u',
    ],
    practicals: [
      'Determination of focal length of a concave mirror by u-v method',
    ],
    simulations: [
      {
        id: 'curved-mirrors-optics',
        title: 'Spherical Mirror Ray Optics',
        description: 'Interactive concave and convex mirrors with draggable object and dynamically converging principal rays.',
        status: 'Planned',
        difficulty: 'Medium',
      },
    ],
  },
  {
    id: 'g11-opt-c15-refraction-plane-surfaces',
    chapterNumber: 15,
    officialTitle: 'Refraction at Plane Surfaces',
    displayTitle: 'Refraction at Plane Surfaces',
    title: 'Refraction at Plane Surfaces',
    textbookEdition: 'CDC First Edition 2024',
    textbookStartPage: 319,
    sourceTraceability: {
      document: 'Physics Grade 11',
      edition: 'CDC First Edition 2024',
      startPage: 319,
      status: 'Official CDC Chapter',
    },
    grade: 11,
    contentAreaId: 'waves-and-optics',
    subtopics: [
      "Laws of refraction and Snell's law",
      'Refractive index and principle of reversibility',
      'Refraction through parallel slab and lateral displacement',
      'Real and apparent depth',
      'Total Internal Reflection (TIR) and critical angle',
      'Applications: Mirages, optical fibers, and prism binoculars',
    ],
    objectives: {
      conceptual: ['Understand wave speed reduction in dense media', 'Grasp conditions required for total internal reflection'],
      mathematical: ['Derive lateral shift d', 'Derive apparent depth d_app = d_real / n', 'Derive sin(theta_c) = 1/n'],
      numerical: ['Calculate critical angles for glass/water interfaces', 'Compute apparent depth of underwater objects'],
      practical: ['Measure refractive index of glass slab using traveling microscope or pin method'],
      applications: ['Fiber-optic high-speed internet cables in Nepal and medical endoscopes'],
    },
    keyEquations: [
      'n1 * sin(theta1) = n2 * sin(theta2)',
      'd_app = d_real / n',
      'sin(theta_c) = 1 / n',
      'Lateral Shift d = (t * sin(i - r)) / cos(r)',
    ],
    practicals: [
      'Determination of refractive index of a glass slab using a traveling microscope',
    ],
    simulations: [
      {
        id: 'snells-law-tir',
        title: "Snell's Law & Total Internal Reflection",
        description: 'Rotatable laser beam refracting across optical media, demonstrating critical angle TIR and optical fiber core bouncing.',
        status: 'Planned',
        difficulty: 'Low',
      },
    ],
  },
  {
    id: 'g11-opt-c16-refraction-prisms',
    chapterNumber: 16,
    officialTitle: 'Refraction through Prisms',
    displayTitle: 'Refraction through Prisms',
    title: 'Refraction through Prisms',
    textbookEdition: 'CDC First Edition 2024',
    textbookStartPage: 336,
    sourceTraceability: {
      document: 'Physics Grade 11',
      edition: 'CDC First Edition 2024',
      startPage: 336,
      status: 'Official CDC Chapter',
    },
    grade: 11,
    contentAreaId: 'waves-and-optics',
    subtopics: [
      'Refraction of light through triangular prism',
      'Angle of prism (A) and angle of deviation (delta)',
      'Minimum deviation condition and i-delta curve',
      'Derivation of prism formula for refractive index',
      'Deviation produced by thin prisms',
    ],
    objectives: {
      conceptual: ['Understand how non-parallel surfaces deviate light rays', 'Observe minimum deviation symmetry'],
      mathematical: ['Derive delta = i + e - A', 'Derive prism formula n = sin((A + delta_m)/2) / sin(A/2)'],
      numerical: ['Calculate refractive index from spectrometer minimum deviation readings', 'Compute thin prism deviations'],
      practical: ['Plot i-delta curve and determine refractive index of a prism using pins or spectrometer'],
      applications: ['Spectrometers, optical periscopes, and prism binoculars'],
    },
    keyEquations: [
      'A = r1 + r2',
      'delta = i + e - A',
      'n = sin((A + delta_m) / 2) / sin(A / 2)',
      'delta = (n - 1) * A',
    ],
    practicals: [
      'Plotting the i-delta curve and determining refractive index of a prism',
    ],
    simulations: [
      {
        id: 'prism-minimum-deviation',
        title: 'Prism Refraction & Minimum Deviation',
        description: 'Interactive triangular prism showing ray deviation, minimum deviation symmetry, and dynamic i-delta plotting.',
        status: 'Planned',
        difficulty: 'Medium',
      },
    ],
  },
  {
    id: 'g11-opt-c17-lenses',
    chapterNumber: 17,
    officialTitle: 'Lens',
    displayTitle: 'Lenses',
    title: 'Lenses',
    textbookEdition: 'CDC First Edition 2024',
    textbookStartPage: 345,
    sourceTraceability: {
      document: 'Physics Grade 11',
      edition: 'CDC First Edition 2024',
      startPage: 345,
      status: 'Official CDC Chapter',
    },
    grade: 11,
    contentAreaId: 'waves-and-optics',
    subtopics: [
      'Thin convex and concave lenses',
      'Refraction at single spherical curved surface',
      "Lens Maker's formula derivation",
      'Thin lens formula (1/f = 1/v - 1/u) and linear magnification',
      'Power of a lens and combination of thin lenses in contact',
      'Chromatic and spherical aberrations in lenses',
    ],
    objectives: {
      conceptual: ['Master thin lens ray tracing', 'Explain how curvature radii define focal lengths', 'Understand lens aberrations'],
      mathematical: ['Derive single surface refraction formula', "Derive Lens Maker's formula", 'Formulate equivalent power P = P1 + P2'],
      numerical: ['Design lenses for specified focal lengths', 'Calculate corrective spectacle lens powers for myopia/hypermetropia'],
      practical: ['Determine focal length of convex lens using u-v and displacement methods'],
      applications: ['Eyeglasses, microscopes, telescopes, camera lenses, and mobile phone optical sensors'],
    },
    keyEquations: [
      '(n2 / v) - (n1 / u) = (n2 - n1) / R',
      '1 / f = (n - 1) * (1 / R1 - 1 / R2)',
      '1 / f = 1 / v - 1 / u',
      'P = 1 / f',
    ],
    practicals: [
      'Determination of focal length of a convex lens using u-v method',
      'Determination of focal length of a concave lens using combination with convex lens',
    ],
    simulations: [
      {
        id: 'thin-lens-bench',
        title: 'Thin Lens & Compound Optical Bench',
        description: 'Interactive optical bench with convex/concave lenses, draggable objects, and compound microscope configurations.',
        status: 'Planned',
        difficulty: 'Medium',
      },
    ],
  },
  {
    id: 'g11-opt-c18-dispersion',
    chapterNumber: 18,
    officialTitle: 'Dispersion',
    displayTitle: 'Dispersion',
    title: 'Dispersion',
    textbookEdition: 'CDC First Edition 2024',
    textbookStartPage: 364,
    sourceTraceability: {
      document: 'Physics Grade 11',
      edition: 'CDC First Edition 2024',
      startPage: 364,
      status: 'Official CDC Chapter',
    },
    grade: 11,
    contentAreaId: 'waves-and-optics',
    subtopics: [
      'Dispersion of white light through a prism',
      'Cauchy formula for wavelength-dependent refractive index',
      'Angular dispersion and dispersive power',
      'Achromatic prism combinations',
      'Formation of primary and secondary rainbows',
    ],
    objectives: {
      conceptual: ['Explain why violet deviates more than red due to refractive index differences', 'Understand raindrop rainbow geometry'],
      mathematical: ['Formulate angular dispersion theta = (n_v - n_r)A', 'Derive dispersive power omega'],
      numerical: ['Calculate dispersive power of crown and flint glasses', 'Design achromatic prism pairs'],
      practical: ['Observe solar spectrum using prism and spectrometer'],
      applications: ['Spectrometer optical analysis and chromatic aberration correction in photography lenses'],
    },
    keyEquations: [
      'n(lambda) = A + B / lambda^2',
      'theta = delta_v - delta_r = (n_v - n_r) * A',
      'omega = (n_v - n_r) / (n_y - 1)',
    ],
    practicals: [
      'Observation of dispersion of light and measurement of angle of prism',
    ],
    simulations: [
      {
        id: 'prism-spectrometer',
        title: 'Prism Spectrometer & Rainbow Optics',
        description: 'White light fanning into colored spectral lines through a prism and spherical raindrop rainbow paths.',
        status: 'Planned',
        difficulty: 'Medium',
      },
    ],
  },

  // --- Content Area 4: Electricity and Magnetism (Chapters 19-23) ---
  {
    id: 'g11-elec-c19-electric-charges',
    chapterNumber: 19,
    officialTitle: 'Electric Charges',
    displayTitle: 'Electric Charges',
    title: 'Electric Charges',
    textbookEdition: 'CDC First Edition 2024',
    textbookStartPage: 378,
    sourceTraceability: {
      document: 'Physics Grade 11',
      edition: 'CDC First Edition 2024',
      startPage: 378,
      status: 'Official CDC Chapter',
    },
    grade: 11,
    contentAreaId: 'electricity-and-magnetism',
    subtopics: [
      'Properties of electric charge: quantization, conservation, additivity',
      'Charging by friction, conduction, and induction',
      'Gold leaf electroscope',
      "Coulomb's inverse square law in vector form",
      'Permittivity of free space and relative permittivity',
      'Superposition principle of electrostatic forces',
    ],
    objectives: {
      conceptual: ['Understand microscopic electron transfer', 'Grasp electrostatic action-at-a-distance force laws'],
      mathematical: ['Formulate Coulomb law in vector notation', 'Apply vector superposition for multi-charge configurations'],
      numerical: ['Compute electrostatic repulsion forces between charges', 'Find net force on charges placed at polygon vertices'],
      practical: ['Demonstrate electrostatic induction and charge polarity using gold leaf electroscope'],
      applications: ['Electrostatic dust precipitators, photocopiers, and laser printers'],
    },
    keyEquations: [
      'q = +/- n * e',
      'F = (1 / (4 * pi * epsilon0 * epsilon_r)) * (|q1 * q2| / r^2)',
    ],
    practicals: [
      'Demonstrations with gold leaf electroscope and charge induction',
    ],
    simulations: [
      {
        id: 'coulomb-force-bench',
        title: 'Coulomb Electrostatic Force Workbench',
        description: 'Draggable point charges with live force vectors showing inverse-square scaling and superposition.',
        status: 'Planned',
        difficulty: 'Low',
      },
    ],
  },
  {
    id: 'g11-elec-c20-electric-field',
    chapterNumber: 20,
    officialTitle: 'Electric Field',
    displayTitle: 'Electric Field',
    title: 'Electric Field',
    textbookEdition: 'CDC First Edition 2024',
    textbookStartPage: 387,
    sourceTraceability: {
      document: 'Physics Grade 11',
      edition: 'CDC First Edition 2024',
      startPage: 387,
      status: 'Official CDC Chapter',
    },
    grade: 11,
    contentAreaId: 'electricity-and-magnetism',
    subtopics: [
      'Electric field intensity due to a point charge',
      'Electric lines of force and field mapping',
      'Electric dipole, dipole moment, and torque in uniform field',
      'Electric flux and Gauss law in electrostatics',
      'Applications of Gauss law (line charge, plane sheet, spherical shell)',
    ],
    objectives: {
      conceptual: ['Visualize vector field patterns', 'Understand flux through closed Gaussian surfaces'],
      mathematical: ['Derive axial and equatorial dipole fields', 'Apply Gauss law to symmetric geometries'],
      numerical: ['Calculate electric fields from charge distributions', 'Compute dipole torque tau = p x E'],
      practical: ['Map equipotential surfaces and electric lines of force on conducting paper'],
      applications: ['Faraday cage electrostatic shielding and Van de Graaff generators'],
    },
    keyEquations: [
      'E = F / q0 = (1 / (4 * pi * epsilon0)) * (q / r^2)',
      'tau = p x E',
      'Phi_E = ClosedIntegral(E . dA) = Q_enc / epsilon0',
      'E_sheet = sigma / (2 * epsilon0)',
    ],
    practicals: [
      'Mapping electrostatic field lines and equipotential surfaces',
    ],
    simulations: [
      {
        id: 'electric-field-gauss',
        title: "Electric Field Lines & Gauss's Law",
        description: 'Interactive electric field lines radiating from charges with closed 3D Gaussian flux calculation.',
        status: 'Planned',
        difficulty: 'Medium',
      },
    ],
  },
  {
    id: 'g11-elec-c21-potential-and-energy',
    chapterNumber: 21,
    officialTitle: 'Electric Potential, Potential Difference and Potential Energy',
    displayTitle: 'Potential, Potential Difference & Energy',
    title: 'Potential, Potential Difference & Energy',
    textbookEdition: 'CDC First Edition 2024',
    textbookStartPage: 403,
    sourceTraceability: {
      document: 'Physics Grade 11',
      edition: 'CDC First Edition 2024',
      startPage: 403,
      status: 'Official CDC Chapter',
    },
    grade: 11,
    contentAreaId: 'electricity-and-magnetism',
    subtopics: [
      'Electric potential as work done per unit test charge',
      'Potential due to point charge and electric dipole',
      'Relation between electric field and potential gradient (E = -dV/dr)',
      'Equipotential surfaces and characteristics',
      'Electrostatic potential energy of charge systems',
      'Electron volt as energy unit',
    ],
    objectives: {
      conceptual: ['Interpret potential as scalar landscape guiding charge flow', 'Understand that field lines are perpendicular to equipotentials'],
      mathematical: ['Derive V = q / (4 pi epsilon0 r)', 'Derive gradient relation E = -dV/dr'],
      numerical: ['Compute potentials at centers of charge arrays', 'Calculate work required to assemble charge arrays'],
      practical: ['Plot equipotential contours in electrolytic tank with voltmeter'],
      applications: ['Particle accelerators, cathode ray tubes, and high-voltage electrodes'],
    },
    keyEquations: [
      'V(r) = (1 / (4 * pi * epsilon0)) * (q / r)',
      'E = - dV / dr',
      'U = (1 / (4 * pi * epsilon0)) * (q1 * q2 / r)',
      '1 eV = 1.602e-19 J',
    ],
    practicals: [
      'Mapping equipotential lines using a DC voltmeter and electrolytic bath',
    ],
    simulations: [
      {
        id: 'equipotential-contours',
        title: 'Equipotential Contours & Particle Accelerator',
        description: '2D potential landscape color topography with charged particles accelerating down electric gradients.',
        status: 'Planned',
        difficulty: 'Medium',
      },
    ],
  },
  {
    id: 'g11-elec-c22-capacitor',
    chapterNumber: 22,
    officialTitle: 'Capacitors',
    displayTitle: 'Capacitor',
    title: 'Capacitor',
    textbookEdition: 'CDC First Edition 2024',
    textbookStartPage: 416,
    sourceTraceability: {
      document: 'Physics Grade 11',
      edition: 'CDC First Edition 2024',
      startPage: 416,
      status: 'Official CDC Chapter',
    },
    grade: 11,
    contentAreaId: 'electricity-and-magnetism',
    subtopics: [
      'Capacitance definition and Farad unit',
      'Parallel plate capacitor and capacitance formula',
      'Effect of dielectric slabs on capacitance',
      'Capacitors in series and parallel combinations',
      'Energy stored in a charged capacitor (U = 0.5 CV^2)',
      'Energy density of electrostatic field',
    ],
    objectives: {
      conceptual: ['Understand how electric fields store electrostatic energy', 'Analyze charge redistribution across interconnected capacitors'],
      mathematical: ['Derive parallel plate capacitance C = epsilon A / d', 'Derive series and parallel equivalent formulas'],
      numerical: ['Compute equivalent capacitance of bridge networks', 'Calculate energy loss during charge sharing'],
      practical: ['Measure capacitance using digital multimeter'],
      applications: ['Camera flashes, defibrillators, power supply smoothing filters, and touchscreens'],
    },
    keyEquations: [
      'C = Q / V',
      'C = (kappa * epsilon0 * A) / d',
      '1 / C_series = Sum(1 / Ci)',
      'C_parallel = Sum(Ci)',
      'U = 0.5 * C * V^2 = 0.5 * Q * V',
    ],
    practicals: [
      'Measurement of equivalent capacitance of series and parallel combinations',
    ],
    simulations: [
      {
        id: 'parallel-plate-capacitor',
        title: 'Parallel Plate Capacitor & Dielectrics',
        description: 'Movable plate separation, insertable dielectric slabs, and real-time stored electrostatic energy gauges.',
        status: 'Planned',
        difficulty: 'Medium',
      },
    ],
  },
  {
    id: 'g11-elec-c23-dc-circuits',
    chapterNumber: 23,
    officialTitle: 'D.C. Circuits',
    displayTitle: 'DC Circuits',
    title: 'DC Circuits',
    textbookEdition: 'CDC First Edition 2024',
    textbookStartPage: 431,
    sourceTraceability: {
      document: 'Physics Grade 11',
      edition: 'CDC First Edition 2024',
      startPage: 431,
      status: 'Official CDC Chapter',
    },
    grade: 11,
    contentAreaId: 'electricity-and-magnetism',
    subtopics: [
      'Electric current and microscopic drift velocity (I = n e A v_d)',
      "Ohm's law, resistance, and resistivity",
      'Temperature dependence of resistance',
      'Resistors in series and parallel networks',
      'EMF, terminal voltage, and battery internal resistance (V = E - Ir)',
      'Electrical power and Joule heating (H = I^2 R t)',
    ],
    objectives: {
      conceptual: ['Connect microscopic electron drift to macroscopic current', 'Distinguish battery internal chemical EMF from terminal voltage'],
      mathematical: ['Derive I = n e A v_d', 'Derive terminal voltage V = E - Ir', 'Derive maximum power transfer theorem'],
      numerical: ['Solve resistor ladder networks', 'Determine internal resistance from circuit data'],
      practical: ["Verify Ohm's law and determine wire resistivity using voltmeter and ammeter"],
      applications: ['Domestic electrical wiring, off-grid solar battery systems, and fuse sizing'],
    },
    keyEquations: [
      'I = n * e * A * v_d',
      'R = rho * L / A',
      'V = E - I * r',
      'P = V * I = I^2 * R',
      'H = I^2 * R * t',
    ],
    practicals: [
      "Verification of Ohm's law and measurement of resistivity of a wire",
    ],
    simulations: [
      {
        id: 'dc-circuits-workbench',
        title: "Ohm's Law & Resistor Network Workbench",
        description: 'Interactive circuit breadboard with animated drift current dots, load resistors, and terminal voltage curves.',
        status: 'Planned',
        difficulty: 'Medium',
      },
    ],
  },

  // --- Content Area 5: Modern Physics (Chapters 24-26) ---
  {
    id: 'g11-mod-c24-nuclear-physics',
    chapterNumber: 24,
    officialTitle: 'Nuclear Physics',
    displayTitle: 'Nuclear Physics',
    title: 'Nuclear Physics',
    textbookEdition: 'CDC First Edition 2024',
    textbookStartPage: 459,
    sourceTraceability: {
      document: 'Physics Grade 11',
      edition: 'CDC First Edition 2024',
      startPage: 459,
      status: 'Official CDC Chapter',
    },
    grade: 11,
    contentAreaId: 'modern-physics',
    subtopics: [
      'Nuclear composition: nucleons, isotopes, isobars',
      'Nuclear size and density (R = R0 A^(1/3))',
      'Mass defect and binding energy (E = mc^2)',
      'Binding energy per nucleon curve and nuclear stability',
      'Strong nuclear force characteristics',
      'Nuclear fission, chain reactions, and nuclear fusion in stars',
    ],
    objectives: {
      conceptual: ['Understand mass-energy conversion during nuclear reactions', 'Interpret peak of binding energy curve at Iron-56'],
      mathematical: ['Calculate mass defect Delta m', 'Compute binding energy BE = Delta m * 931.5 MeV', 'Calculate reaction Q-values'],
      numerical: ['Compute energy released in Uranium fission events', 'Calculate fusion energy from deuterium-tritium reactions'],
      practical: ['Analyze nuclear binding energy charts'],
      applications: ['Nuclear power generation and stellar astrophysical energy'],
    },
    keyEquations: [
      'R = R0 * A^(1/3)',
      'Delta m = [Z * m_p + (A - Z) * m_n] - M_nucleus',
      'BE = Delta m * 931.5 MeV',
      'Q = (m_reactants - m_products) * c^2',
    ],
    practicals: [
      'Analysis of binding energy per nucleon curve and mass defect calculations',
    ],
    simulations: [
      {
        id: 'binding-energy-curve',
        title: 'Binding Energy Curve & Nuclear Reactions',
        description: 'Interactive BE/A curve with nuclear fission and fusion reaction energy releases.',
        status: 'Planned',
        difficulty: 'Medium',
      },
    ],
  },
  {
    id: 'g11-mod-c25-energy-levels',
    chapterNumber: 25,
    officialTitle: 'Energy Levels',
    displayTitle: 'Energy Levels',
    title: 'Energy Levels',
    grade: 11,
    contentAreaId: 'modern-physics',
    textbookEdition: 'CDC First Edition 2024',
    textbookStartPage: 487,
    sourceTraceability: {
      document: 'Physics Grade 11',
      edition: 'CDC First Edition 2024',
      startPage: 487,
      status: 'Official CDC Chapter',
    },
    subtopics: [
      'Quantized atomic energy levels and stationary states',
      'Hydrogen atom energy level diagram',
      'Excitation and ionization potentials',
      'Atomic excitation: electron impact and photon absorption',
      'Radiative de-excitation and spontaneous photon emission',
      'Hydrogen emission and absorption line spectra',
      'Spectral series: Lyman, Balmer, Paschen, Brackett, Pfund',
    ],
    objectives: {
      conceptual: [
        'Understand quantized atomic energy states',
        'Distinguish excitation from ionization',
        'Explain origin of discrete emission and absorption lines',
      ],
      mathematical: [
        'Apply Bohr energy formula E_n = -13.6 eV / n^2',
        'Relate photon energy to transition delta E = h*nu = h*c / lambda',
        'Apply Rydberg formula 1/lambda = R_H * (1/n_1^2 - 1/n_2^2)',
      ],
      numerical: [
        'Calculate transition wavelengths for Lyman and Balmer series',
        'Determine ionization energy from ground state (13.6 eV)',
      ],
      practical: [
        'Observation and wavelength measurement of hydrogen discharge spectral lines',
      ],
      applications: [
        'Astronomical stellar spectroscopy, gas discharge lamps, and laser fundamentals',
      ],
    },
    keyEquations: [
      'E_n = -13.6 / n^2 eV',
      'Delta E = E_initial - E_final = h * nu = (h * c) / lambda',
      '1 / lambda = R_H * (1 / n_1^2 - 1 / n_2^2)',
    ],
    practicals: [
      'Observation and wavelength measurement of hydrogen discharge spectral lines',
    ],
    simulations: [
      {
        id: 'energy-levels-transitions',
        title: 'Atomic Energy Levels & Spectral Transitions',
        description: 'Interactive energy level ladder showing electron quantum jumps, photon emission/absorption, and spectral line generation.',
        status: 'Planned',
        difficulty: 'Medium',
      },
    ],
  },
  {
    id: 'g11-mod-c26-solids',
    chapterNumber: 26,
    officialTitle: 'Solids',
    displayTitle: 'Solids',
    title: 'Solids',
    grade: 11,
    contentAreaId: 'modern-physics',
    textbookEdition: 'CDC First Edition 2024',
    textbookStartPage: 496,
    sourceTraceability: {
      document: 'Physics Grade 11',
      edition: 'CDC First Edition 2024',
      startPage: 496,
      status: 'Official CDC Chapter',
    },
    subtopics: [
      'Crystalline and amorphous solids',
      'Energy bands in solids (valence, conduction, forbidden gap)',
      'Conductors, insulators, and semiconductors band comparison',
      'Intrinsic semiconductors and electron-hole pairs',
      'Extrinsic semiconductors: n-type and p-type doping',
      'Temperature dependence of semiconductor conductivity',
    ],
    objectives: {
      conceptual: ['Understand band formation from atomic orbital overlap', 'Recognize holes as positive charge carriers'],
      mathematical: ['Relate forbidden gap energy to thermal energy', 'Formulate conductivity sigma = e(n_e mu_e + n_h mu_h)'],
      numerical: ['Calculate intrinsic carrier concentrations', 'Determine doping density ratios'],
      practical: ['Study of temperature dependence of resistance of a semiconductor (thermistor)'],
      applications: ['Silicon microprocessors, solar cells, and solid-state thermistors'],
    },
    keyEquations: [
      'sigma = e * (n_e * mu_e + n_h * mu_h)',
      'n_e * n_h = n_i^2',
    ],
    practicals: [
      'Study of temperature dependence of resistance of a semiconductor (thermistor)',
    ],
    simulations: [
      {
        id: 'band-theory-solids',
        title: 'Band Theory & Semiconductor Conduction',
        description: 'Valence/conduction energy bands with thermal electron excitation and donor/acceptor doping levels.',
        status: 'Planned',
        difficulty: 'Medium',
      },
    ],
  },
];

// ==========================================
// GRADE 12 CHAPTER DEFINITIONS (25 Chapters)
// ==========================================

export const GRADE_12_CHAPTERS: CurriculumChapter[] = [
  // --- Content Area 1: Mechanics (Chapters 1-3) ---
  {
    id: 'g12-mech-c01-rotational-dynamics',
    chapterNumber: 1,
    officialTitle: 'Rotational Dynamics and Oscillatory Motion',
    displayTitle: 'Rotational Dynamics',
    title: 'Rotational Dynamics',
    textbookEdition: 'CDC First Edition 2025',
    textbookStartPage: 1,
    sourceTraceability: {
      document: 'Physics Grade 12',
      edition: 'CDC First Edition 2025',
      startPage: 1,
      status: 'Official CDC Chapter',
    },
    grade: 12,
    contentAreaId: 'mechanics',
    subtopics: [
      'Equations of angular motion',
      'Kinetic energy of rotation of a rigid body',
      'Moment of inertia (I) and radius of gyration (k)',
      'Parallel and perpendicular axes theorems',
      'Torque and angular acceleration relation (tau = I alpha)',
      'Conservation of angular momentum',
      'Rolling motion without slipping on an inclined plane',
    ],
    objectives: {
      conceptual: ['Understand moment of inertia as rotational mass depending on distribution', 'Recognize angular momentum conservation'],
      mathematical: ['Derive parallel and perpendicular axis theorems', 'Derive rolling acceleration a = g sin theta / (1 + k^2/R^2)'],
      numerical: ['Compute moment of inertia of compound bodies', 'Calculate final speeds of rolling cylinders vs. spheres'],
      practical: ['Determine moment of inertia of a flywheel'],
      applications: ['Engine flywheels, figure skating spin control, and helicopter tail rotors'],
    },
    keyEquations: [
      'tau = I * alpha',
      'L = I * omega',
      'I = I_cm + M * d^2',
      'K_total = 0.5 * M * v^2 * (1 + k^2 / R^2)',
    ],
    practicals: [
      'Determination of the moment of inertia of a flywheel',
    ],
    simulations: [
      {
        id: 'rotational-inertia-race',
        title: 'Moment of Inertia & Incline Race',
        description: 'Race of spheres, cylinders, and rings rolling down an incline with torque and angular momentum conservation.',
        status: 'Planned',
        difficulty: 'Medium',
      },
    ],
  },
  {
    id: 'g12-mech-c02-periodic-motion',
    chapterNumber: 2,
    officialTitle: 'Periodic Motion',
    displayTitle: 'Periodic Motion',
    title: 'Periodic Motion',
    textbookEdition: 'CDC First Edition 2025',
    textbookStartPage: 25,
    sourceTraceability: {
      document: 'Physics Grade 12',
      edition: 'CDC First Edition 2025',
      startPage: 25,
      status: 'Official CDC Chapter',
    },
    grade: 12,
    contentAreaId: 'mechanics',
    subtopics: [
      'Simple Harmonic Motion (SHM) definition and kinematics',
      'Differential equation of SHM: d^2x/dt^2 + omega^2 x = 0',
      'Energy in SHM: kinetic, potential, and total energy conservation',
      'Spring-mass systems (horizontal and vertical)',
      'Simple pendulum time period derivation (T = 2 pi sqrt(l/g))',
      'Free, damped, and forced oscillations and resonance',
    ],
    objectives: {
      conceptual: ['Recognize restoring force proportionality to displacement', 'Understand resonance as peak energy transfer'],
      mathematical: ['Solve SHM differential equation', 'Derive time periods for spring-mass and simple pendulum'],
      numerical: ['Calculate maximum velocity and acceleration from amplitude', 'Compute pendulum period variations in elevators'],
      practical: ['Determine spring constant of spiral spring by static and dynamic methods'],
      applications: ['Timekeeping escapements, car suspension dampers, and earthquake building isolation dampers'],
    },
    keyEquations: [
      'd^2x / dt^2 + omega^2 * x = 0',
      'x(t) = A * sin(omega * t + phi)',
      'T_spring = 2 * pi * sqrt(m / k)',
      'T_pendulum = 2 * pi * sqrt(l / g)',
      'E_total = 0.5 * k * A^2',
    ],
    practicals: [
      'Determination of force constant of a spring and verification of T^2 proportional to m',
      'Determination of g using a compound pendulum',
    ],
    simulations: [
      {
        id: 'simple-harmonic-motion',
        title: 'Simple Harmonic Motion (Spring & Pendulum)',
        description: 'Side-by-side spring-mass and simple pendulum with velocity/acceleration vectors, energy interchange, and phase circle.',
        status: 'Planned',
        difficulty: 'Medium',
      },
    ],
  },
  {
    id: 'g12-mech-c03-fluid-mechanics',
    chapterNumber: 3,
    officialTitle: 'Fluid Mechanics',
    displayTitle: 'Fluid Mechanics',
    title: 'Fluid Mechanics',
    textbookEdition: 'CDC First Edition 2025',
    textbookStartPage: 45,
    sourceTraceability: {
      document: 'Physics Grade 12',
      edition: 'CDC First Edition 2025',
      startPage: 45,
      status: 'Official CDC Chapter',
    },
    grade: 12,
    contentAreaId: 'mechanics',
    subtopics: [
      "Hydrostatic pressure, Pascal's law, and Archimedes principle",
      'Surface tension, surface energy, and capillary rise',
      'Excess pressure inside liquid drops and soap bubbles',
      'Fluid dynamics: streamline flow and equation of continuity',
      "Bernoulli's principle and applications (Venturimeter, efflux velocity)",
      "Viscosity, Newton's viscous law, and Stokes' law",
      'Terminal velocity of falling spheres',
    ],
    objectives: {
      conceptual: ['Understand surface tension as cohesive imbalance', 'Comprehend aerodynamic lift from Bernoulli pressure drops'],
      mathematical: ['Derive capillary rise formula', 'Derive Bernoulli equation', 'Derive terminal velocity v_t'],
      numerical: ['Calculate hydraulic lift forces', 'Compute terminal velocity of raindrops'],
      practical: ['Determine surface tension of water using capillary rise', 'Determine liquid viscosity by Stokes method'],
      applications: ['Aircraft wing design, hydraulic brakes, and engine oil lubrication'],
    },
    keyEquations: [
      'P = rho * g * h',
      'h = (2 * T * cos theta) / (r * rho * g)',
      'A1 * v1 = A2 * v2',
      'P + 0.5 * rho * v^2 + rho * g * h = const',
      'F_viscous = 6 * pi * eta * r * v',
      'v_t = (2/9) * r^2 * (rho - sigma) * g / eta',
    ],
    practicals: [
      'Determination of surface tension of water by capillary rise method',
      'Determination of coefficient of viscosity of a liquid by Stokes method',
    ],
    simulations: [
      {
        id: 'bernoulli-stokes-flow',
        title: 'Bernoulli Flow & Stokes Viscometer',
        description: 'Venturi constricted pipe pressure manometers and falling sphere terminal velocity in viscous liquids.',
        status: 'Planned',
        difficulty: 'High',
      },
    ],
  },

  // --- Content Area 2: Heat and Thermodynamics (Chapters 4-5) ---
  {
    id: 'g12-heat-c04-first-law-thermodynamics',
    chapterNumber: 4,
    officialTitle: 'First Law of Thermodynamics',
    displayTitle: 'First Law of Thermodynamics',
    title: 'First Law of Thermodynamics',
    textbookEdition: 'CDC First Edition 2025',
    textbookStartPage: 77,
    sourceTraceability: {
      document: 'Physics Grade 12',
      edition: 'CDC First Edition 2025',
      startPage: 77,
      status: 'Official CDC Chapter',
    },
    grade: 12,
    contentAreaId: 'heat-and-thermodynamics',
    subtopics: [
      'Thermodynamic systems, state variables, and internal energy',
      'Work done during gas expansion (W = Integral(P dV))',
      'First law of thermodynamics: dQ = dU + dW',
      'Isobaric, isochoric, isothermal, and adiabatic processes',
      'Work done in isothermal and adiabatic gas processes',
      "Mayer's relation: Cp - Cv = R and specific heat ratio gamma",
    ],
    objectives: {
      conceptual: ['Recognize internal energy as state function', 'Distinguish isothermal slow processes from adiabatic fast processes'],
      mathematical: ['Derive work done in isothermal and adiabatic processes', 'Derive Mayer relation Cp - Cv = R'],
      numerical: ['Evaluate work from closed indicator PV loops', 'Calculate adiabatic expansion temperature drops'],
      practical: ['Determine ratio of specific heat capacities of air (gamma) by Clement and Desormes method'],
      applications: ['Diesel engine auto-ignition and air refrigeration compressors'],
    },
    keyEquations: [
      'dQ = dU + dW',
      'W_isothermal = n * R * T * ln(V2 / V1)',
      'P * V^gamma = const',
      'W_adiabatic = (P1 * V1 - P2 * V2) / (gamma - 1)',
      'Cp - Cv = R',
    ],
    practicals: [
      'Determination of ratio of specific heat capacities of air by Clement and Desormes method',
    ],
    simulations: [
      {
        id: 'thermodynamic-pv-work',
        title: 'Thermodynamic Processes & PV Work',
        description: 'Gas piston chamber tracing isothermal and adiabatic curves with dynamic shaded PV work area.',
        status: 'Planned',
        difficulty: 'Medium',
      },
    ],
  },
  {
    id: 'g12-heat-c05-second-law-thermodynamics',
    chapterNumber: 5,
    officialTitle: 'Second Law of Thermodynamics',
    displayTitle: 'Second Law of Thermodynamics',
    title: 'Second Law of Thermodynamics',
    textbookEdition: 'CDC First Edition 2025',
    textbookStartPage: 96,
    sourceTraceability: {
      document: 'Physics Grade 12',
      edition: 'CDC First Edition 2025',
      startPage: 96,
      status: 'Official CDC Chapter',
    },
    grade: 12,
    contentAreaId: 'heat-and-thermodynamics',
    subtopics: [
      'Limitations of first law and direction of natural processes',
      'Heat engines, thermal efficiency, and Kelvin-Planck statement',
      'Refrigerators, heat pumps, COP, and Clausius statement',
      'Carnot ideal reversible engine and 4-stroke cycle',
      'Carnot theorem and efficiency formula (eta = 1 - Tc/Th)',
      'Concept of Entropy (dS = dQ_rev / T) and universal entropy increase',
    ],
    objectives: {
      conceptual: ['Understand thermal flow irreversibility', 'Grasp Carnot efficiency as absolute theoretical limit', 'Understand entropy as molecular disorder'],
      mathematical: ['Derive Carnot efficiency from PV relations', 'Evaluate entropy change for thermal mixing'],
      numerical: ['Calculate maximum thermal power plant efficiencies', 'Compute refrigerator COP'],
      practical: ['Analyze efficiency data of heat engine cycles'],
      applications: ['Thermal and geothermal power plants and air conditioners'],
    },
    keyEquations: [
      'eta = W / Q_H = 1 - Q_C / Q_H',
      'eta_Carnot = 1 - T_C / T_H',
      'COP = Q_C / W = T_C / (T_H - T_C)',
      'dS = dQ_rev / T',
    ],
    practicals: [
      'Study of working cycle and efficiency of heat engine models',
    ],
    simulations: [
      {
        id: 'carnot-cycle-engine',
        title: 'Carnot Heat Engine & Refrigerator Cycle',
        description: '4-stage Carnot animation with isothermal and adiabatic strokes, Sankey energy flows, and PV/TS curves.',
        status: 'Planned',
        difficulty: 'Medium',
      },
    ],
  },

  // --- Content Area 3: Wave and Optics (Chapters 6-13) ---
  {
    id: 'g12-opt-c06-wave-motion',
    chapterNumber: 6,
    officialTitle: 'Wave Motion',
    displayTitle: 'Wave Motion',
    title: 'Wave Motion',
    textbookEdition: 'CDC First Edition 2025',
    textbookStartPage: 116,
    sourceTraceability: {
      document: 'Physics Grade 12',
      edition: 'CDC First Edition 2025',
      startPage: 116,
      status: 'Official CDC Chapter',
    },
    grade: 12,
    contentAreaId: 'waves-and-optics',
    subtopics: [
      'Progressive wave propagation in elastic media',
      'Plane progressive wave equation: y = A sin(omega t - kx)',
      'Wave speed, frequency, wavelength, wave number',
      'Particle velocity and acceleration vs. wave velocity',
      'Phase, phase difference, and path difference',
      'Principle of superposition of waves',
    ],
    objectives: {
      conceptual: ['Distinguish wave propagation from particle oscillation', 'Understand wave phase shifts'],
      mathematical: ['Derive wave displacement function', 'Relate path difference to phase difference'],
      numerical: ['Extract wave parameters from wave equations', 'Calculate particle speed at specified times'],
      practical: ['Demonstrate transverse and longitudinal waves on Slinky springs'],
      applications: ['Seismic body wave transmission and telecommunication radio carriers'],
    },
    keyEquations: [
      'y(x, t) = A * sin(omega * t - k * x)',
      'v = f * lambda = omega / k',
      'Delta phi = (2 * pi / lambda) * Delta x',
    ],
    practicals: [
      'Study of wave motion using Slinky springs and ripple tanks',
    ],
    simulations: [
      {
        id: 'progressive-wave-motion',
        title: 'Progressive Wave & Superposition',
        description: 'Continuous harmonic wave with color-coded oscillating particles and superposition interference.',
        status: 'Planned',
        difficulty: 'Medium',
      },
    ],
  },
  {
    id: 'g12-opt-c07-mechanical-waves',
    chapterNumber: 7,
    officialTitle: 'Mechanical Wave',
    displayTitle: 'Mechanical Waves',
    title: 'Mechanical Waves',
    textbookEdition: 'CDC First Edition 2025',
    textbookStartPage: 127,
    sourceTraceability: {
      document: 'Physics Grade 12',
      edition: 'CDC First Edition 2025',
      startPage: 127,
      status: 'Official CDC Chapter',
    },
    grade: 12,
    contentAreaId: 'waves-and-optics',
    subtopics: [
      'Speed of transverse waves in stretched strings (v = sqrt(T/mu))',
      "Speed of longitudinal waves: Newton's formula and Laplace's correction",
      'Factors affecting velocity of sound in air (temperature, pressure, humidity)',
    ],
    objectives: {
      conceptual: ['Understand why sound propagation is an adiabatic process', 'Explain why humidity increases sound speed'],
      mathematical: ["Derive Newton formula and Laplace correction v = sqrt(gamma P / rho)", 'Derive temperature formula vt = v0 + 0.61 t'],
      numerical: ['Compute sound velocity at arbitrary temperatures and humidities', 'Calculate string wave velocities'],
      practical: ['Determine velocity of sound in air using resonance tube apparatus'],
      applications: ['SONAR underwater navigation and non-destructive ultrasonic material testing'],
    },
    keyEquations: [
      'v_string = sqrt(T / mu)',
      'v_sound = sqrt(gamma * P / rho) = sqrt(gamma * R * T / M)',
      'v_t = v0 + 0.61 * t',
    ],
    practicals: [
      'Determination of velocity of sound in air using resonance tube apparatus',
    ],
    simulations: [
      {
        id: 'speed-of-sound-laplace',
        title: 'Speed of Sound & Laplace Gas Dynamics',
        description: 'Acoustic compressions propagating through a gas with temperature and humidity sliders.',
        status: 'Planned',
        difficulty: 'Medium',
      },
    ],
  },
  {
    id: 'g12-opt-c08-waves-pipes-strings',
    chapterNumber: 8,
    officialTitle: 'Waves in Pipes and Strings',
    displayTitle: 'Waves in Pipes and Strings',
    title: 'Waves in Pipes and Strings',
    textbookEdition: 'CDC First Edition 2025',
    textbookStartPage: 137,
    sourceTraceability: {
      document: 'Physics Grade 12',
      edition: 'CDC First Edition 2025',
      startPage: 137,
      status: 'Official CDC Chapter',
    },
    grade: 12,
    contentAreaId: 'waves-and-optics',
    subtopics: [
      'Stationary (standing) waves: nodes and antinodes',
      'Transverse standing waves in strings fixed at both ends',
      'Laws of transverse vibration of stretched strings (sonometer)',
      'Stationary longitudinal waves in open and closed organ pipes',
      'Harmonics and overtones ratios',
      'End correction in acoustic pipes',
    ],
    objectives: {
      conceptual: ['Understand standing waves as localized energy traps', 'Contrast overtone timbre of open vs. closed pipes'],
      mathematical: ['Derive standing wave equation y = 2A cos(kx) sin(omega t)', 'Deduce harmonic frequencies for pipes and strings'],
      numerical: ['Calculate fundamental frequencies and overtones', 'Apply end correction to acoustic measurements'],
      practical: ['Verify sonometer laws of stretched strings', 'Measure acoustic resonance in open/closed pipes'],
      applications: ['Design of musical instruments: flutes, guitars, violins, and traditional Nepali Bansuri'],
    },
    keyEquations: [
      'y = 2 * A * cos(k * x) * sin(omega * t)',
      'f_n_open = n * v / (2 * L)',
      'f_n_closed = (2n - 1) * v / (4 * L)',
      'f proportional to 1/L, sqrt(T), 1/sqrt(mu)',
    ],
    practicals: [
      'Determination of frequency of a tuning fork using a sonometer',
      'Determination of velocity of sound including end correction using resonance air column',
    ],
    simulations: [
      {
        id: 'standing-waves-pipes',
        title: 'Standing Waves & Acoustic Resonators',
        description: 'Vibrating strings and open/closed organ pipes with displacement nodes, antinodes, and harmonic audio overtones.',
        status: 'Planned',
        difficulty: 'Medium',
      },
    ],
  },
  {
    id: 'g12-opt-c09-acoustic-phenomena',
    chapterNumber: 9,
    officialTitle: 'Acoustic Phenomenon',
    displayTitle: 'Acoustic Phenomena',
    title: 'Acoustic Phenomena',
    textbookEdition: 'CDC First Edition 2025',
    textbookStartPage: 152,
    sourceTraceability: {
      document: 'Physics Grade 12',
      edition: 'CDC First Edition 2025',
      startPage: 152,
      status: 'Official CDC Chapter',
    },
    grade: 12,
    contentAreaId: 'waves-and-optics',
    subtopics: [
      'Sound intensity and sound intensity level in decibels (dB)',
      'Threshold of hearing and pitch, loudness, timbre qualities',
      'Beats phenomenon and beat frequency (f_b = |f1 - f2|)',
      'Doppler effect in sound: moving source, observer, and medium',
      'Shock waves and sonic booms',
    ],
    objectives: {
      conceptual: ['Interpret logarithmic decibel sound scales', 'Understand Doppler wavefront compression ahead of moving sources'],
      mathematical: ['Derive beat frequency equation', 'Derive general Doppler formula'],
      numerical: ['Calculate apparent pitch of moving vehicles', 'Compute beat frequencies for out-of-tune instruments'],
      practical: ['Demonstrate acoustic beats using audio signal generators and tuning forks'],
      applications: ['Police radar speed detection, medical Doppler ultrasound blood flow, and musical tuning'],
    },
    keyEquations: [
      'beta = 10 * log10(I / I0) dB',
      'f_beat = |f1 - f2|',
      "f' = f * ((v +/- vo) / (v -/+ vs))",
    ],
    practicals: [
      'Experimental demonstration of acoustic beats and fork frequency tuning',
    ],
    simulations: [
      {
        id: 'doppler-acoustic-beats',
        title: 'Doppler Effect & Acoustic Beats',
        description: 'Moving sound source with Doppler compressed circular wavefronts and beating audio envelope waveforms.',
        status: 'Planned',
        difficulty: 'Medium',
      },
    ],
  },
  {
    id: 'g12-opt-c10-nature-propagation-light',
    chapterNumber: 10,
    officialTitle: 'Nature and Propagation of Light',
    displayTitle: 'Nature and Propagation of Light',
    title: 'Nature and Propagation of Light',
    textbookEdition: 'CDC First Edition 2025',
    textbookStartPage: 175,
    sourceTraceability: {
      document: 'Physics Grade 12',
      edition: 'CDC First Edition 2025',
      startPage: 175,
      status: 'Official CDC Chapter',
    },
    grade: 12,
    contentAreaId: 'waves-and-optics',
    subtopics: [
      'Wavefront concepts: spherical, cylindrical, plane',
      "Huygens' principle of secondary wavelets",
      'Proof of laws of reflection using wave construction',
      "Proof of laws of refraction (Snell's law) using wave construction",
      'Electromagnetic nature of light and electromagnetic spectrum',
    ],
    objectives: {
      conceptual: ['Understand light as propagating wavefronts', 'Apply Huygens secondary wavelets to deduce wave paths'],
      mathematical: ['Prove i = r geometrically from wavelets', 'Prove sin i / sin r = v1/v2 = n2/n1'],
      numerical: ['Compute optical path lengths', 'Calculate electromagnetic wave velocities from permittivity/permeability'],
      practical: ['Trace wavefront propagation using ripple tank pulse generators'],
      applications: ['Optical component anti-reflective coatings and radar wave propagation'],
    },
    keyEquations: [
      'c = 1 / sqrt(mu0 * epsilon0)',
      'sin i / sin r = v1 / v2 = n2 / n1',
      'Optical Path = n * x',
    ],
    practicals: [
      'Demonstration of wavefront reflection and refraction using ripple tanks',
    ],
    simulations: [
      {
        id: 'huygens-wavefronts',
        title: "Huygens' Wavefront Construction",
        description: 'Advancing plane wavefronts generating circular wavelets that construct reflected and refracted wavefronts.',
        status: 'Planned',
        difficulty: 'Medium',
      },
    ],
  },
  {
    id: 'g12-opt-c11-interference',
    chapterNumber: 11,
    officialTitle: 'Interference of Light',
    displayTitle: 'Interference of Light',
    title: 'Interference of Light',
    textbookEdition: 'CDC First Edition 2025',
    textbookStartPage: 186,
    sourceTraceability: {
      document: 'Physics Grade 12',
      edition: 'CDC First Edition 2025',
      startPage: 186,
      status: 'Official CDC Chapter',
    },
    grade: 12,
    contentAreaId: 'waves-and-optics',
    subtopics: [
      'Coherent sources and conditions for sustained interference',
      "Young's Double-Slit Experiment (YDSE)",
      'Analytical derivation of fringe width: beta = lambda D / d',
      'Intensity distribution in interference fringes',
      'Fringe displacement by thin transparent sheets',
      'Interference in thin films and Newton rings',
    ],
    objectives: {
      conceptual: ['Understand light cancellation via destructive interference', 'Explain iridescent colors in thin oil films'],
      mathematical: ['Derive path difference Delta x = y d / D', 'Derive fringe width beta = lambda D / d', 'Derive thin film conditions'],
      numerical: ['Calculate fringe spacing and light wavelength from double-slit data', 'Calculate transparent sheet thicknesses'],
      practical: ['Determine wavelength of sodium light using Newton rings apparatus or biprism'],
      applications: ['Precision optical interferometry, anti-reflective coatings, and optical testing'],
    },
    keyEquations: [
      'beta = (lambda * D) / d',
      'Delta y = (D / d) * (n - 1) * t',
      'I(phi) = 4 * I0 * cos^2(phi / 2)',
      '2 * n * t * cos r = (m + 0.5) * lambda',
    ],
    practicals: [
      "Measurement of fringe width in Young's double slit setup",
      'Observation of Newton rings and determination of wavelength of light',
    ],
    simulations: [
      {
        id: 'youngs-double-slit',
        title: "Young's Double-Slit & Thin Films",
        description: 'Coherent double-slit laser interference pattern with adjustable slit spacing, screen distance, and thin mica film shift.',
        status: 'Planned',
        difficulty: 'High',
      },
    ],
  },
  {
    id: 'g12-opt-c12-diffraction',
    chapterNumber: 12,
    officialTitle: 'Diffraction',
    displayTitle: 'Diffraction',
    title: 'Diffraction',
    textbookEdition: 'CDC First Edition 2025',
    textbookStartPage: 202,
    sourceTraceability: {
      document: 'Physics Grade 12',
      edition: 'CDC First Edition 2025',
      startPage: 202,
      status: 'Official CDC Chapter',
    },
    grade: 12,
    contentAreaId: 'waves-and-optics',
    subtopics: [
      'Fresnel and Fraunhofer diffraction comparison',
      'Fraunhofer diffraction at a single slit',
      'Central maximum width and secondary maxima/minima',
      'Plane transmission diffraction grating: (a + b) sin theta = n lambda',
      'Resolving power of optical instruments and Rayleigh criterion',
    ],
    objectives: {
      conceptual: ['Understand diffraction spreading as wave nature limit of ray optics', 'Contrast single-slit envelope with grating peaks'],
      mathematical: ['Derive single-slit minima a sin theta = n lambda', 'Derive grating equation', 'State Rayleigh criterion theta = 1.22 lambda / D'],
      numerical: ['Calculate central diffraction peak width', 'Compute maximum observable spectral orders from diffraction gratings'],
      practical: ['Determine light wavelength using diffraction grating and spectrometer'],
      applications: ['Optical spectrometers for chemical analysis and telescope resolution limits'],
    },
    keyEquations: [
      'a * sin theta = n * lambda (minima)',
      'Central Width = (2 * lambda * D) / a',
      '(a + b) * sin theta = n * lambda',
      'theta_Rayleigh = 1.22 * lambda / D',
    ],
    practicals: [
      'Determination of wavelength of spectral lines using diffraction grating and spectrometer',
    ],
    simulations: [
      {
        id: 'single-slit-diffraction',
        title: 'Single Slit & Diffraction Grating',
        description: 'Fraunhofer diffraction intensity profile transitioning from single slit spreading to sharp multi-slit grating lines.',
        status: 'Planned',
        difficulty: 'High',
      },
    ],
  },
  {
    id: 'g12-opt-c13-polarisation',
    chapterNumber: 13,
    officialTitle: 'Polarisation',
    displayTitle: 'Polarisation',
    title: 'Polarisation',
    textbookEdition: 'CDC First Edition 2025',
    textbookStartPage: 218,
    sourceTraceability: {
      document: 'Physics Grade 12',
      edition: 'CDC First Edition 2025',
      startPage: 218,
      status: 'Official CDC Chapter',
    },
    grade: 12,
    contentAreaId: 'waves-and-optics',
    subtopics: [
      'Transverse wave nature of light evidenced by polarization',
      'Linearly polarized light vs. unpolarized light',
      "Polarization by reflection and Brewster's law (tan i_p = n)",
      "Malus's law of transmitted intensity (I = I0 cos^2 theta)",
      'Polaroids, double refraction, and optical activity',
      'Specific rotation and Laurent half-shade polarimeter',
    ],
    objectives: {
      conceptual: ['Appreciate polarization as definitive transverse wave proof', 'Understand Brewster angle orthogonal reflection'],
      mathematical: ['Prove ip + rp = 90 deg at Brewster angle', 'Derive Malus law I = I0 cos^2 theta', 'Formulate specific rotation'],
      numerical: ['Calculate polarizing Brewster angles for glass/water', 'Compute sugar concentration from polarimeter readings'],
      practical: ['Determine specific rotation of sugar solution using Laurent polarimeter'],
      applications: ['LCD screens, polarizing sunglasses, 3D cinema goggles, and sugar purity quality testing'],
    },
    keyEquations: [
      'tan(i_p) = n',
      'I = I0 * cos^2(theta)',
      '[alpha] = theta / (L * c)',
    ],
    practicals: [
      "Verification of Brewster's law using glass plate and polaroid filter",
      'Determination of specific rotation of sugar solution using half-shade polarimeter',
    ],
    simulations: [
      {
        id: 'polarisation-brewster',
        title: "Malus's Law & Brewster's Polarizer",
        description: 'Two rotating polaroids dimming light intensity according to Malus law and Brewster angle reflection.',
        status: 'Planned',
        difficulty: 'Low',
      },
    ],
  },

  // --- Content Area 4: Electricity and Magnetism (Chapters 14-19) ---
  {
    id: 'g12-elec-c14-electrical-circuits',
    chapterNumber: 14,
    officialTitle: 'Electrical Circuits',
    displayTitle: 'Electrical Circuits',
    title: 'Electrical Circuits',
    textbookEdition: 'CDC First Edition 2025',
    textbookStartPage: 228,
    sourceTraceability: {
      document: 'Physics Grade 12',
      edition: 'CDC First Edition 2025',
      startPage: 228,
      status: 'Official CDC Chapter',
    },
    grade: 12,
    contentAreaId: 'electricity-and-magnetism',
    subtopics: [
      "Kirchhoff's First Law (Current Rule) and Second Law (Voltage Rule)",
      'Wheatstone bridge principle and balance condition',
      'Meter bridge for resistance determination',
      'Potentiometer principle and potential gradient',
      'Comparison of EMFs and internal resistance determination',
      'Galvanometer conversion into ammeter and voltmeter',
    ],
    objectives: {
      conceptual: ['Realize potentiometers act as ideal infinite-impedance voltmeters at null balance'],
      mathematical: ['Derive Wheatstone bridge condition P/Q = R/S', 'Derive galvanometer shunt and multiplier resistor formulas'],
      numerical: ['Solve multi-loop circuit currents via Kirchhoff equations', 'Calculate ammeter shunt values'],
      practical: ['Measure unknown resistance using Meter Bridge', 'Compare EMFs and find internal resistance using Potentiometer'],
      applications: ['Strain gauge bridge conditioning and precision laboratory metrology'],
    },
    keyEquations: [
      'Sum(I_junction) = 0',
      'Sum(Delta V) = 0',
      'P / Q = R / S',
      'E1 / E2 = l1 / l2',
      'S = (I_g * R_g) / (I - I_g)',
      'R_mult = (V / I_g) - R_g',
    ],
    practicals: [
      'Determination of resistance of a wire using a Meter Bridge',
      'Comparison of EMFs of two cells using a Potentiometer',
      'Determination of internal resistance of a cell using a Potentiometer',
      'Conversion of galvanometer into ammeter and voltmeter',
    ],
    simulations: [
      {
        id: 'kirchhoff-potentiometer',
        title: "Kirchhoff's Laws & Potentiometer",
        description: 'Interactive Wheatstone bridge and potentiometer slide wire with draggable jockey and null-deflection galvanometer.',
        status: 'Planned',
        difficulty: 'Medium',
      },
    ],
  },
  {
    id: 'g12-elec-c15-thermoelectric-effect',
    chapterNumber: 15,
    officialTitle: 'Thermoelectric Effect',
    displayTitle: 'Thermoelectric Effect',
    title: 'Thermoelectric Effect',
    textbookEdition: 'CDC First Edition 2025',
    textbookStartPage: 255,
    sourceTraceability: {
      document: 'Physics Grade 12',
      edition: 'CDC First Edition 2025',
      startPage: 255,
      status: 'Official CDC Chapter',
    },
    grade: 12,
    contentAreaId: 'electricity-and-magnetism',
    subtopics: [
      'Seebeck effect and thermoelectric series of metals',
      'Variation of thermoelectric EMF with temperature: neutral and inversion temperatures',
      'Thermoelectric power (S = dE/d theta)',
      'Peltier effect and Thomson effect',
      'Thermopiles for sensitive radiation measurement',
    ],
    objectives: {
      conceptual: ['Understand thermoelectricity as direct thermal to electrical conversion', 'Contrast reversible Peltier with Joule heating'],
      mathematical: ['Derive neutral temperature dE/d theta = 0', 'Derive theta_n = (theta_c + theta_i) / 2'],
      numerical: ['Calculate thermoelectric EMF at arbitrary temperatures given alpha and beta coefficients'],
      practical: ['Calibrate a thermocouple using potentiometer and oil bath'],
      applications: ['Furnace pyrometers, solid-state beverage coolers, and deep space RTG power'],
    },
    keyEquations: [
      'E = alpha * theta + 0.5 * beta * theta^2',
      'theta_n = - alpha / beta',
      'theta_i = 2 * theta_n - theta_c',
    ],
    practicals: [
      'Calibration of a thermocouple and determination of neutral temperature',
    ],
    simulations: [
      {
        id: 'thermoelectric-seebeck',
        title: 'Thermocouple & Seebeck Effect',
        description: 'Thermocouple junctions in hot and cold baths with parabolic thermoelectric EMF curve and inversion point.',
        status: 'Planned',
        difficulty: 'Low',
      },
    ],
  },
  {
    id: 'g12-elec-c16-magnetic-fields',
    chapterNumber: 16,
    officialTitle: 'Magnetic Fields',
    displayTitle: 'Magnetic Fields',
    title: 'Magnetic Fields',
    textbookEdition: 'CDC First Edition 2025',
    textbookStartPage: 265,
    sourceTraceability: {
      document: 'Physics Grade 12',
      edition: 'CDC First Edition 2025',
      startPage: 265,
      status: 'Official CDC Chapter',
    },
    grade: 12,
    contentAreaId: 'electricity-and-magnetism',
    subtopics: [
      'Biot-Savart law and applications (straight wire, circular coil, axial field)',
      "Ampere's Circuital Law and solenoid field: B = mu0 n I",
      'Lorentz force on moving charges in magnetic fields (F = q(v x B))',
      'Motion of charged particle in magnetic field: circular and helical orbits',
      'Force on current-carrying conductor (F = I L x B)',
      'Force between parallel current conductors and Ampere definition',
      'Torque on current loop and moving coil galvanometer',
    ],
    objectives: {
      conceptual: ['Understand magnetic fields as created by moving charges', 'Recognize why magnetic Lorentz forces do zero work'],
      mathematical: ['Derive circular coil axial magnetic field', 'Integrate Ampere circuital law for solenoids', 'Derive orbit radius r = mv / qB'],
      numerical: ['Calculate magnetic field from current elements', 'Determine helical pitch of electrons in magnetic fields'],
      practical: ['Map magnetic fields around solenoids using compasses', 'Measure field using tangent galvanometer'],
      applications: ['Electric motors, cyclotrons, mass spectrometers, and MRI scanners'],
    },
    keyEquations: [
      'dB = (mu0 / (4 * pi)) * (I * dl x r_hat) / r^2',
      'B_solenoid = mu0 * n * I',
      'F = q * (v x B)',
      'r = m * v / (q * B)',
      'F / L = (mu0 * I1 * I2) / (2 * pi * d)',
      'tau = N * I * A * B * sin theta',
    ],
    practicals: [
      'Study of magnetic field produced by a circular coil using a tangent galvanometer',
    ],
    simulations: [
      {
        id: 'biot-savart-lorentz',
        title: 'Biot-Savart & Lorentz Force Chamber',
        description: 'Magnetic field vectors around current coils and charged particles spiraling along helical Lorentz trajectories.',
        status: 'Planned',
        difficulty: 'High',
      },
    ],
  },
  {
    id: 'g12-elec-c17-magnetic-properties',
    chapterNumber: 17,
    officialTitle: 'Magnetic Properties of Materials',
    displayTitle: 'Magnetic Properties of Materials',
    title: 'Magnetic Properties of Materials',
    textbookEdition: 'CDC First Edition 2025',
    textbookStartPage: 302,
    sourceTraceability: {
      document: 'Physics Grade 12',
      edition: 'CDC First Edition 2025',
      startPage: 302,
      status: 'Official CDC Chapter',
    },
    grade: 12,
    contentAreaId: 'electricity-and-magnetism',
    subtopics: [
      'Atomic origin of magnetism: orbital and spin magnetic moments',
      'Magnetizing field (H), magnetization (M), and magnetic induction (B)',
      'Magnetic susceptibility and relative permeability',
      'Diamagnetic, paramagnetic, and ferromagnetic materials',
      'Domain theory and Curie-Weiss law',
      'Magnetic Hysteresis: B-H loop, retentivity, coercivity, and energy loss',
      'Soft iron vs. steel material selection',
    ],
    objectives: {
      conceptual: ['Explain magnetism through electron spin alignment', 'Understand domain flipping during magnetization cycles'],
      mathematical: ['Relate B = mu0(H + M)', 'Evaluate hysteresis power loss from B-H loop area'],
      numerical: ['Calculate susceptibility and magnetization', 'Compute transformer core heat loss'],
      practical: ['Trace B-H curve using CRO and search coil'],
      applications: ['Transformer laminated cores, permanent motor magnets, and magnetic data storage'],
    },
    keyEquations: [
      'B = mu0 * (H + M) = mu_r * mu0 * H',
      'chi = M / H',
      'Loss per cycle = ClosedIntegral(H dB) = Area of B-H loop',
    ],
    practicals: [
      'Tracing and studying the hysteresis loop of a ferromagnetic specimen using CRO',
    ],
    simulations: [
      {
        id: 'magnetic-hysteresis-loop',
        title: 'Magnetic Hysteresis (B–H) Loop',
        description: 'Magnetic domain alignment in crystal lattices with real-time B-H hysteresis loop tracing for soft iron and steel.',
        status: 'Planned',
        difficulty: 'Medium',
      },
    ],
  },
  {
    id: 'g12-elec-c18-electromagnetic-induction',
    chapterNumber: 18,
    officialTitle: 'Electromagnetic Induction',
    displayTitle: 'Electromagnetic Induction',
    title: 'Electromagnetic Induction',
    textbookEdition: 'CDC First Edition 2025',
    textbookStartPage: 313,
    sourceTraceability: {
      document: 'Physics Grade 12',
      edition: 'CDC First Edition 2025',
      startPage: 313,
      status: 'Official CDC Chapter',
    },
    grade: 12,
    contentAreaId: 'electricity-and-magnetism',
    subtopics: [
      'Magnetic flux and Faraday experiments',
      "Faraday's laws of electromagnetic induction: E = -N dPhi/dt",
      "Lenz's law and conservation of energy",
      'Motional EMF: E = B L v',
      'Eddy currents and minimization via laminated cores',
      'Self-inductance (L) and mutual inductance (M)',
      'Energy stored in an inductor: U = 0.5 L I^2',
      'AC Generator and electrical transformers',
    ],
    objectives: {
      conceptual: ['Grasp that changing magnetic flux induces electric potentials', 'Understand Lenz law as energy conservation consequence'],
      mathematical: ['Derive motional EMF E = B l v', 'Derive self-inductance of solenoid L = mu0 N^2 A / l', 'Derive transformer turn ratios'],
      numerical: ['Calculate induced EMF in rotating coils', 'Compute transformer efficiencies and coil currents'],
      practical: ['Demonstrate induction and verify Faraday/Lenz laws using coils and galvanometers'],
      applications: ['Hydropower turbine generators, induction cooktops, and electrical power transformers'],
    },
    keyEquations: [
      'E = - N * dPhi / dt',
      'E_motional = B * l * v',
      'E_self = - L * dI / dt',
      'U_L = 0.5 * L * I^2',
      'Vs / Vp = Ns / Np = Ip / Is',
    ],
    practicals: [
      "Demonstration of electromagnetic induction and verification of Faraday's and Lenz's laws",
      'Study of input/output voltage relationship in a transformer',
    ],
    simulations: [
      {
        id: 'faradays-law-induction',
        title: "Faraday's Induction & AC Generator",
        description: 'Bar magnet plunging through a coil inducing current in a galvanometer and rotating armature generating AC sine waves.',
        status: 'Planned',
        difficulty: 'Medium',
      },
    ],
  },
  {
    id: 'g12-elec-c19-alternating-current',
    chapterNumber: 19,
    officialTitle: 'Alternating Current',
    displayTitle: 'Alternating Current',
    title: 'Alternating Current',
    textbookEdition: 'CDC First Edition 2025',
    textbookStartPage: 342,
    sourceTraceability: {
      document: 'Physics Grade 12',
      edition: 'CDC First Edition 2025',
      startPage: 342,
      status: 'Official CDC Chapter',
    },
    grade: 12,
    contentAreaId: 'electricity-and-magnetism',
    subtopics: [
      'AC waveforms, average value, and Root-Mean-Square (RMS) value',
      'Phasor diagram representation',
      'AC circuits containing pure R, pure L, and pure C',
      'Series LCR circuit: impedance (Z) and phase angle',
      'Resonance in LCR circuits, resonant frequency, and Q-factor',
      'Power in AC circuits: true power, apparent power, and power factor (cos phi)',
      'Wattless current and LC oscillations',
    ],
    objectives: {
      conceptual: ['Understand why AC meters read RMS values', 'Visualize phase leads and lags using rotating phasors', 'Comprehend resonance tuning'],
      mathematical: ['Derive RMS formulas', 'Derive series LCR impedance Z', 'Derive resonant frequency f0 = 1 / (2 pi sqrt(LC))'],
      numerical: ['Calculate circuit impedance, current amplitude, and power factor for 50 Hz AC networks'],
      practical: ['Study frequency response and resonance in series LCR circuit using oscilloscope'],
      applications: ['Radio receiver tuning, industrial power factor correction, and audio equalizer filters'],
    },
    keyEquations: [
      'I_rms = I0 / sqrt(2)',
      'X_L = omega * L,  X_C = 1 / (omega * C)',
      'Z = sqrt(R^2 + (X_L - X_C)^2)',
      'f0 = 1 / (2 * pi * sqrt(L * C))',
      'P_avg = V_rms * I_rms * cos(phi)',
    ],
    practicals: [
      'Study of frequency response and resonance in a series LCR circuit',
      'Determination of phase difference between voltage and current in RC/RL circuits',
    ],
    simulations: [
      {
        id: 'series-lcr-resonator',
        title: 'Series LCR Resonator & Phasors',
        description: 'Interactive LCR resonator with rotating voltage/current phasors, sinusoidal waveforms, and sharp frequency resonance peak.',
        status: 'Planned',
        difficulty: 'Medium',
      },
    ],
  },

  // --- Content Area 5: Modern Physics (Chapters 20-25) ---
  {
    id: 'g12-mod-c20-electrons',
    chapterNumber: 20,
    officialTitle: 'Electrons',
    displayTitle: 'Electrons',
    title: 'Electrons',
    textbookEdition: 'CDC First Edition 2025',
    textbookStartPage: 367,
    sourceTraceability: {
      document: 'Physics Grade 12',
      edition: 'CDC First Edition 2025',
      startPage: 367,
      status: 'Official CDC Chapter',
    },
    grade: 12,
    contentAreaId: 'modern-physics',
    subtopics: [
      'Cathode rays and motion of electrons in electric and magnetic fields',
      'Crossed fields velocity selector (v = E/B)',
      "J.J. Thomson's experiment for specific charge (e/m) of electron",
      "Millikan's oil drop experiment and charge quantization (q = n e)",
    ],
    objectives: {
      conceptual: ['Recognize electrons as universal subatomic particles', 'Understand charge quantization as discrete nature of electricity'],
      mathematical: ['Derive parabolic deflection in electric fields', 'Derive Thomson e/m formula', 'Derive Millikan oil drop charge equation'],
      numerical: ['Calculate electron deflection in crossed fields', 'Compute oil droplet charges and electron counts'],
      practical: ['Determine e/m of an electron using Thomson tube or fine beam tube'],
      applications: ['Cathode ray oscilloscopes, electron microscopes, and mass spectrometers'],
    },
    keyEquations: [
      'y = 0.5 * (e * E / m) * (x / v0)^2',
      'v = E / B',
      'e / m = E^2 / (2 * V_a * B^2)',
      'q = 6 * pi * eta * r * (v1 + v2) / E = n * e',
    ],
    practicals: [
      'Determination of specific charge (e/m) of an electron using a Thomson tube',
    ],
    simulations: [
      {
        id: 'thomson-millikan-chamber',
        title: 'J.J. Thomson e/m & Millikan Oil Drop',
        description: 'Electron beam bending in crossed fields and charged oil droplets suspended under adjustable electric voltages.',
        status: 'Planned',
        difficulty: 'High',
      },
    ],
  },
  {
    id: 'g12-mod-c21-photons',
    chapterNumber: 21,
    officialTitle: 'Photons',
    displayTitle: 'Photons',
    title: 'Photons',
    textbookEdition: 'CDC First Edition 2025',
    textbookStartPage: 385,
    sourceTraceability: {
      document: 'Physics Grade 12',
      edition: 'CDC First Edition 2025',
      startPage: 385,
      status: 'Official CDC Chapter',
    },
    grade: 12,
    contentAreaId: 'modern-physics',
    subtopics: [
      'Inadequacy of classical wave theory for photoelectric emission',
      'Photoelectric effect: threshold frequency, saturation current, stopping potential',
      "Einstein's quantum photon theory (E = h nu) and photoelectric equation",
      "Millikan's experimental determination of Planck's constant (h)",
      'Properties of photons: rest mass, energy, momentum (p = h / lambda)',
      'Photoelectric cells and applications',
    ],
    objectives: {
      conceptual: ['Understand light as quantized photon particles during absorption', 'Explain why wave theory fails to explain zero time lag'],
      mathematical: ['Derive Einstein equation K_max = e V0 = h nu - Phi0', 'Relate stopping potential slope to h/e'],
      numerical: ['Compute threshold wavelengths for various metals', 'Determine stopping voltages for ultraviolet illumination'],
      practical: ["Determine Planck's constant using photocell and color filters"],
      applications: ['Solar photovoltaic electricity, automatic street lighting sensors, and light meters'],
    },
    keyEquations: [
      'E = h * nu = h * c / lambda',
      'p = h / lambda = E / c',
      'K_max = e * V0 = h * nu - Phi0 = h * (nu - nu0)',
      'V0 = (h / e) * nu - (Phi0 / e)',
    ],
    practicals: [
      "Determination of Planck's constant (h) using a photocell and monochromatic filters",
    ],
    simulations: [
      {
        id: 'photoelectric-laboratory',
        title: 'Photoelectric Effect Laboratory',
        description: 'Monochromatic photons ejecting photoelectrons from target metals with stopping potential voltage curve and Planck constant slope.',
        status: 'Planned',
        difficulty: 'Medium',
      },
    ],
  },
  {
    id: 'g12-mod-c22-semiconductors',
    chapterNumber: 22,
    officialTitle: 'Semiconductor Devices',
    displayTitle: 'Semiconductor Devices',
    title: 'Semiconductor Devices',
    textbookEdition: 'CDC First Edition 2025',
    textbookStartPage: 404,
    sourceTraceability: {
      document: 'Physics Grade 12',
      edition: 'CDC First Edition 2025',
      startPage: 404,
      status: 'Official CDC Chapter',
    },
    grade: 12,
    contentAreaId: 'modern-physics',
    subtopics: [
      'p-n junction formation: depletion layer and barrier potential',
      'Forward and reverse biasing and V-I characteristics',
      'Half-wave, full-wave, and bridge rectifiers',
      'Zener diode and voltage regulation',
      'Light Emitting Diodes (LED) and photodiodes',
      'Digital logic gates: AND, OR, NOT, NAND, NOR truth tables',
    ],
    objectives: {
      conceptual: ['Understand depletion barrier equilibrium', 'Explain diode rectification', 'Understand binary digital logic levels'],
      mathematical: ['Calculate rectifier efficiency', 'Formulate Zener voltage regulation resistor design', 'Formulate Boolean algebra'],
      numerical: ['Compute DC output voltages and ripple frequencies', 'Determine Zener current limits'],
      practical: ['Plot forward and reverse V-I curves of diode and Zener', 'Verify truth tables of logic gate ICs'],
      applications: ['AC-to-DC mobile chargers, solar home inverters, LED illumination, and digital computers'],
    },
    keyEquations: [
      'I = I0 * (e^(e * V / (eta * k_B * T)) - 1)',
      'eta_full_wave = 81.2 %',
      'V_out = V_Z',
    ],
    practicals: [
      'Study of forward and reverse V-I characteristics of semiconductor diode',
      'Study of reverse characteristics of Zener diode and voltage regulation',
      'Verification of truth tables of basic logic gates (AND, OR, NOT, NAND, NOR)',
    ],
    simulations: [
      {
        id: 'diode-rectifier-logic',
        title: 'Diode Rectification & Logic Gates',
        description: 'p-n junction V-I curve, bridge rectifier converting AC to smooth DC, and interactive logic gate truth tables.',
        status: 'Planned',
        difficulty: 'Medium',
      },
    ],
  },
  {
    id: 'g12-mod-c23-quantization-energy',
    chapterNumber: 23,
    officialTitle: 'Quantization of Energy',
    displayTitle: 'Quantization of Energy',
    title: 'Quantization of Energy',
    textbookEdition: 'CDC First Edition 2025',
    textbookStartPage: 420,
    sourceTraceability: {
      document: 'Physics Grade 12',
      edition: 'CDC First Edition 2025',
      startPage: 420,
      status: 'Official CDC Chapter',
    },
    grade: 12,
    contentAreaId: 'modern-physics',
    subtopics: [
      "Rutherford scattering model and limitations",
      "Bohr's postulates for hydrogen atom and quantized angular momentum",
      'Derivation of electron orbital radii and energy levels (E_n = -13.6 eV / n^2)',
      'Hydrogen emission spectrum: Lyman, Balmer, Paschen series',
      'X-ray production, Coolidge tube, Duane-Hunt law (lambda_min = hc / eV)',
      "Bragg's law of X-ray crystal diffraction (2 d sin theta = n lambda)",
      'Laser principles: stimulated emission and population inversion',
    ],
    objectives: {
      conceptual: ['Understand quantization resolving atomic collapse', 'Relate spectral lines to discrete quantum leaps', 'Comprehend stimulated emission in lasers'],
      mathematical: ['Derive Bohr radius r_n = n^2 a0 and energy E_n', 'Derive Rydberg formula', 'Derive Duane-Hunt law and Bragg law'],
      numerical: ['Calculate Balmer emission wavelengths', 'Calculate minimum X-ray tube voltages'],
      practical: ['Observe hydrogen emission spectrum using spectrometer and diffraction grating'],
      applications: ['Medical diagnostic X-rays, fiber-optic communication lasers, and crystal structure analysis'],
    },
    keyEquations: [
      'L = m * v * r = n * h / (2 * pi)',
      'E_n = - 13.6 eV / n^2',
      '1 / lambda = R_H * (1 / n1^2 - 1 / n2^2)',
      'lambda_min = h * c / (e * V)',
      '2 * d * sin theta = n * lambda',
    ],
    practicals: [
      'Measurement of hydrogen emission spectrum lines using diffraction grating and spectrometer',
    ],
    simulations: [
      {
        id: 'bohr-hydrogen-spectrum',
        title: 'Bohr Hydrogen Atom & Spectral Series',
        description: 'Bohr quantized electron orbits with quantum jumps emitting colored spectral lines matching the hydrogen spectrum.',
        status: 'Planned',
        difficulty: 'Medium',
      },
    ],
  },
  {
    id: 'g12-mod-c24-radioactivity',
    chapterNumber: 24,
    officialTitle: 'Radioactivity & Nuclear Reaction',
    displayTitle: 'Radioactivity & Nuclear Reactions',
    title: 'Radioactivity & Nuclear Reactions',
    textbookEdition: 'CDC First Edition 2025',
    textbookStartPage: 456,
    sourceTraceability: {
      document: 'Physics Grade 12',
      edition: 'CDC First Edition 2025',
      startPage: 456,
      status: 'Official CDC Chapter',
    },
    grade: 12,
    contentAreaId: 'modern-physics',
    subtopics: [
      'Natural radioactivity and properties of alpha, beta, gamma radiations',
      'Radioactive decay law: -dN/dt = lambda N',
      'Exponential decay equation: N(t) = N0 e^(-lambda t)',
      'Half-life period (T1/2 = 0.693 / lambda) and mean life (tau = 1 / lambda)',
      'Soddy-Fajans radioactive displacement laws',
      'Carbon dating and radioisotope applications in medicine/industry',
      'Biological radiation hazards and shielding safety',
    ],
    objectives: {
      conceptual: ['Understand radioactive decay as spontaneous statistical quantum decay', 'Grasp constant half-life regardless of initial mass'],
      mathematical: ['Derive exponential decay law N = N0 e^(-lambda t)', 'Derive relation T1/2 = 0.693 / lambda', 'Formulate carbon dating age equations'],
      numerical: ['Calculate remaining radioactivity after multiple half-lives', 'Determine archaeological artifact ages via C-14 ratios'],
      practical: ['Simulate radioactive decay using dice tossing experiments to plot decay curves'],
      applications: ['Carbon dating of historical artifacts, cancer radiation therapy, and industrial radiography'],
    },
    keyEquations: [
      '- dN / dt = lambda * N',
      'N(t) = N0 * e^(- lambda * t)',
      'T_half = 0.693 / lambda',
      'tau = 1 / lambda',
      'N / N0 = (1 / 2)^n',
    ],
    practicals: [
      'Simulation of radioactive decay using dice throwing or computer random trials',
    ],
    simulations: [
      {
        id: 'radioactive-decay-chamber',
        title: 'Radioactive Decay & Half-Life Chamber',
        description: 'Simulated statistical decay of unstable radioisotopes with live exponential decay curve and half-life markers.',
        status: 'Planned',
        difficulty: 'Low',
      },
    ],
  },
  {
    id: 'g12-mod-c25-recent-trends',
    chapterNumber: 25,
    officialTitle: 'Recent Trends in Physics',
    displayTitle: 'Recent Trends in Physics',
    title: 'Recent Trends in Physics',
    textbookEdition: 'CDC First Edition 2025',
    textbookStartPage: 477,
    sourceTraceability: {
      document: 'Physics Grade 12',
      edition: 'CDC First Edition 2025',
      startPage: 477,
      status: 'Official CDC Chapter',
    },
    grade: 12,
    contentAreaId: 'modern-physics',
    subtopics: [
      'Seismology and earthquakes in Nepal (Himalayan tectonic collision)',
      'Focus, epicenter, and seismic waves (P-waves, S-waves, Surface waves)',
      "Deduction of Earth's liquid outer core from S-wave shadow zone",
      'Determination of earthquake epicenter from P-S time differences',
      'Gravitational waves and LIGO detection',
      'Higgs Boson, Higgs field, and origin of elementary particle mass',
      'Nanotechnology and carbon allotropes (graphene, carbon nanotubes)',
    ],
    objectives: {
      conceptual: ['Understand Nepal tectonic earthquake vulnerabilities', 'Explain why S-wave shadow zones prove liquid outer core', 'Appreciate gravitational wave space ripples'],
      mathematical: ['Formulate epicenter distance from (tS - tP) lag', 'Relate nanoparticle surface area to volume scaling (A/V proportional to 1/r)'],
      numerical: ['Compute epicenter distance given P- and S-wave speeds', 'Calculate gravitational wave strain amplitude h = 2 Delta L / L'],
      practical: ['Analyze seismograms from Nepal National Seismological Centre'],
      applications: ['Earthquake-resilient civil engineering in Nepal and advanced medical nanotechnology'],
    },
    keyEquations: [
      'd_epicenter = (vP * vS / (vP - vS)) * (tS - tP)',
      'h = 2 * Delta L / L',
      'SurfaceArea / Volume = 3 / r',
    ],
    practicals: [
      'Analysis of local seismological travel-time charts to determine earthquake epicenter',
    ],
    simulations: [
      {
        id: 'seismic-waves-nepal',
        title: 'Seismic Wave Propagation in Nepal',
        description: 'Tectonic fault slipping in Nepal crust radiating longitudinal P and transverse S waves with live seismogram trace.',
        status: 'Planned',
        difficulty: 'Medium',
      },
    ],
  },
];

// ==========================================
// CONTENT AREA HIERARCHY AGGREGATION
// ==========================================

export const CONTENT_AREAS_META: { id: ContentAreaId; name: string }[] = [
  { id: 'mechanics', name: 'Mechanics' },
  { id: 'heat-and-thermodynamics', name: 'Heat and Thermodynamics' },
  { id: 'waves-and-optics', name: 'Waves and Optics' },
  { id: 'electricity-and-magnetism', name: 'Electricity and Magnetism' },
  { id: 'modern-physics', name: 'Modern Physics' },
];

function buildContentAreasForGrade(
  grade: 11 | 12,
  chapters: CurriculumChapter[]
): CurriculumContentArea[] {
  return CONTENT_AREAS_META.map((meta, index) => {
    const areaChapters = chapters.filter((c) => c.contentAreaId === meta.id);
    return {
      id: meta.id,
      name: meta.name,
      grade,
      order: index + 1,
      chapterCount: areaChapters.length,
      chapters: areaChapters,
    };
  });
}

export const GRADE_11_CURRICULUM: CurriculumGrade = {
  grade: 11,
  title: 'Grade 11 Physics (NEB Nepal)',
  totalChapters: GRADE_11_CHAPTERS.length,
  contentAreas: buildContentAreasForGrade(11, GRADE_11_CHAPTERS),
};

export const GRADE_12_CURRICULUM: CurriculumGrade = {
  grade: 12,
  title: 'Grade 12 Physics (NEB Nepal)',
  totalChapters: GRADE_12_CHAPTERS.length,
  contentAreas: buildContentAreasForGrade(12, GRADE_12_CHAPTERS),
};

export const FULL_CURRICULUM: { 11: CurriculumGrade; 12: CurriculumGrade } = {
  11: GRADE_11_CURRICULUM,
  12: GRADE_12_CURRICULUM,
};

/**
 * Fast lookup utilities
 */
export function getChapterById(chapterId: string): CurriculumChapter | undefined {
  return (
    GRADE_11_CHAPTERS.find((c) => c.id === chapterId) ||
    GRADE_12_CHAPTERS.find((c) => c.id === chapterId)
  );
}

export function getAllSimulations(): {
  simulation: CurriculumSimulationRef;
  chapter: CurriculumChapter;
}[] {
  const allChapters = [...GRADE_11_CHAPTERS, ...GRADE_12_CHAPTERS];
  const list: { simulation: CurriculumSimulationRef; chapter: CurriculumChapter }[] = [];
  for (const chapter of allChapters) {
    for (const sim of chapter.simulations) {
      list.push({ simulation: sim, chapter });
    }
  }
  return list;
}

