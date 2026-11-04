import { describe, it, expect } from 'vitest';
import {
  GRADE_11_CHAPTERS,
  GRADE_12_CHAPTERS,
  GRADE_11_CURRICULUM,
  GRADE_12_CURRICULUM,
  FULL_CURRICULUM,
  CONTENT_AREAS_META,
  getChapterById,
  getAllSimulations,
  type SimulationStatus,
} from '../../src/curriculum/curriculumData';

describe('Official Nepal CDC Curriculum Validation', () => {
  const VALID_STATUSES: SimulationStatus[] = [
    'Planned',
    'In Development',
    'Implemented',
    'Tested',
    'Verified on Android',
  ];

  // 1. Exactly 26 Grade 11 chapters
  it('contains exactly 26 Grade 11 chapters', () => {
    expect(GRADE_11_CHAPTERS).toHaveLength(26);
    expect(GRADE_11_CURRICULUM.totalChapters).toBe(26);
  });

  // 2. Exactly 25 Grade 12 chapters (51 total)
  it('contains exactly 25 Grade 12 chapters (51 total)', () => {
    expect(GRADE_12_CHAPTERS).toHaveLength(25);
    expect(GRADE_12_CURRICULUM.totalChapters).toBe(25);

    const allChapters = [...GRADE_11_CHAPTERS, ...GRADE_12_CHAPTERS];
    expect(allChapters).toHaveLength(51);
  });

  // 3. Exactly 5 content areas per grade
  it('organizes each grade into exactly 5 official content areas', () => {
    expect(CONTENT_AREAS_META).toHaveLength(5);
    expect(GRADE_11_CURRICULUM.contentAreas).toHaveLength(5);
    expect(GRADE_12_CURRICULUM.contentAreas).toHaveLength(5);

    const expectedAreaIds = [
      'mechanics',
      'heat-and-thermodynamics',
      'waves-and-optics',
      'electricity-and-magnetism',
      'modern-physics',
    ];

    expect(GRADE_11_CURRICULUM.contentAreas.map((a) => a.id)).toEqual(expectedAreaIds);
    expect(GRADE_12_CURRICULUM.contentAreas.map((a) => a.id)).toEqual(expectedAreaIds);

    // Sum of chapters across content areas matches total
    const g11Sum = GRADE_11_CURRICULUM.contentAreas.reduce((acc, a) => acc + a.chapterCount, 0);
    const g12Sum = GRADE_12_CURRICULUM.contentAreas.reduce((acc, a) => acc + a.chapterCount, 0);
    expect(g11Sum).toBe(26);
    expect(g12Sum).toBe(25);
  });

  // 4. Correct chapter numbering (1..26 and 1..25, contiguous without gaps)
  it('maintains contiguous 1-based chapter numbering without gaps', () => {
    GRADE_11_CHAPTERS.forEach((ch, idx) => {
      expect(ch.chapterNumber).toBe(idx + 1);
      expect(ch.grade).toBe(11);
    });

    GRADE_12_CHAPTERS.forEach((ch, idx) => {
      expect(ch.chapterNumber).toBe(idx + 1);
      expect(ch.grade).toBe(12);
    });
  });

  // 5. Unique chapter IDs across all 51 chapters
  it('ensures all 51 chapter IDs are unique and well-formed', () => {
    const allChapters = [...GRADE_11_CHAPTERS, ...GRADE_12_CHAPTERS];
    const ids = allChapters.map((c) => c.id);
    const uniqueIds = new Set(ids);

    expect(uniqueIds.size).toBe(51);

    for (const ch of allChapters) {
      expect(ch.id).toMatch(/^g(11|12)-(mech|heat|opt|elec|mod)-c\d{2}-[\w-]+$/);
      expect(getChapterById(ch.id)).toBeDefined();
    }
  });

  // 6. Grade 11 Chapters 24, 25, 26 match Nuclear Physics, Energy Levels, and Solids
  it('correctly maps Grade 11 Modern Physics chapters 24, 25, and 26 with verified start pages', () => {
    const ch24 = GRADE_11_CHAPTERS[23];
    const ch25 = GRADE_11_CHAPTERS[24];
    const ch26 = GRADE_11_CHAPTERS[25];

    // Ch 24: Nuclear Physics
    expect(ch24.id).toBe('g11-mod-c24-nuclear-physics');
    expect(ch24.chapterNumber).toBe(24);
    expect(ch24.officialTitle).toBe('Nuclear Physics');
    expect(ch24.textbookStartPage).toBe(459);
    expect(ch24.textbookEdition).toBe('CDC First Edition 2024');
    expect(ch24.sourceTraceability.startPage).toBe(459);
    expect(ch24.sourceTraceability.status).toBe('Official CDC Chapter');

    // Ch 25: Energy Levels
    expect(ch25.id).toBe('g11-mod-c25-energy-levels');
    expect(ch25.chapterNumber).toBe(25);
    expect(ch25.officialTitle).toBe('Energy Levels');
    expect(ch25.displayTitle).toBe('Energy Levels');
    expect(ch25.textbookStartPage).toBe(487);
    expect(ch25.textbookEdition).toBe('CDC First Edition 2024');
    expect(ch25.sourceTraceability.startPage).toBe(487);
    expect(ch25.sourceTraceability.status).toBe('Official CDC Chapter');
    expect(ch25.simulations.some((s) => s.id === 'energy-levels-transitions')).toBe(true);

    // Ch 26: Solids
    expect(ch26.id).toBe('g11-mod-c26-solids');
    expect(ch26.chapterNumber).toBe(26);
    expect(ch26.officialTitle).toBe('Solids');
    expect(ch26.displayTitle).toBe('Solids');
    expect(ch26.textbookStartPage).toBe(496);
    expect(ch26.textbookEdition).toBe('CDC First Edition 2024');
    expect(ch26.sourceTraceability.startPage).toBe(496);
    expect(ch26.sourceTraceability.status).toBe('Official CDC Chapter');
    expect(ch26.simulations.some((s) => s.id === 'band-theory-solids')).toBe(true);
  });

  // 7. Recent Trends in Physics exists ONLY in Grade 12 Chapter 25
  it('verifies Recent Trends in Physics exists exclusively in Grade 12 Chapter 25', () => {
    // Must NOT exist in Grade 11
    const g11HasRecentTrends = GRADE_11_CHAPTERS.some(
      (c) =>
        c.officialTitle.toLowerCase().includes('recent trends') ||
        c.displayTitle.toLowerCase().includes('recent trends') ||
        c.id.includes('recent-trends')
    );
    expect(g11HasRecentTrends).toBe(false);

    // Must exist in Grade 12 Chapter 25
    const ch25G12 = GRADE_12_CHAPTERS[24];
    expect(ch25G12.chapterNumber).toBe(25);
    expect(ch25G12.id).toBe('g12-mod-c25-recent-trends');
    expect(ch25G12.officialTitle).toBe('Recent Trends in Physics');
    expect(ch25G12.textbookStartPage).toBe(477);
    expect(ch25G12.textbookEdition).toBe('CDC First Edition 2025');
  });

  // 8. No orphaned simulation references
  it('ensures all simulation references are non-empty, valid, and traceable', () => {
    const allSims = getAllSimulations();
    expect(allSims.length).toBeGreaterThanOrEqual(51);

    const simIds = allSims.map((s) => s.simulation.id);
    const uniqueSimIds = new Set(simIds);
    expect(uniqueSimIds.size).toBe(simIds.length);

    for (const { simulation, chapter } of allSims) {
      expect(simulation.id.length).toBeGreaterThan(0);
      expect(simulation.title.length).toBeGreaterThan(0);
      expect(simulation.description.length).toBeGreaterThan(0);
      expect(['Low', 'Medium', 'High']).toContain(simulation.difficulty);
      expect(VALID_STATUSES).toContain(simulation.status);
      expect(chapter.id).toBeDefined();
    }
  });

  // 9. Simulation statuses strictly match valid enum values; Projectile Motion & Newton's Second Law are Verified on Android
  it('enforces valid simulation status lifecycle with both current simulations Verified on Android', () => {
    const allSims = getAllSimulations();

    for (const { simulation } of allSims) {
      expect(VALID_STATUSES).toContain(simulation.status);
    }

    const projectileSim = allSims.find((s) => s.simulation.id === 'projectile-motion');
    expect(projectileSim).toBeDefined();
    expect(projectileSim?.simulation.status).toBe('Verified on Android');

    const newtonSim = allSims.find((s) => s.simulation.id === 'newtons-second-law');
    expect(newtonSim).toBeDefined();
    expect(newtonSim?.simulation.status).toBe('Verified on Android');
  });

  // 10. Source traceability and textbook pagination
  it('validates textbook editions, monotonically increasing start pages, and metadata integrity', () => {
    // Grade 11: First Edition 2024, pages 1 to 496
    let lastG11Page = 0;
    for (const ch of GRADE_11_CHAPTERS) {
      expect(ch.textbookEdition).toBe('CDC First Edition 2024');
      expect(ch.sourceTraceability.edition).toBe('CDC First Edition 2024');
      expect(ch.sourceTraceability.status).toBe('Official CDC Chapter');
      expect(ch.textbookStartPage).toBeGreaterThan(lastG11Page);
      expect(ch.officialTitle.length).toBeGreaterThan(0);
      expect(ch.displayTitle.length).toBeGreaterThan(0);
      expect(ch.title).toBe(ch.displayTitle);
      expect(ch.subtopics.length).toBeGreaterThanOrEqual(3);
      expect(ch.keyEquations.length).toBeGreaterThanOrEqual(1);
      lastG11Page = ch.textbookStartPage;
    }
    expect(GRADE_11_CHAPTERS[25].textbookStartPage).toBe(496);

    // Grade 12: First Edition 2025, pages 1 to 477
    let lastG12Page = 0;
    for (const ch of GRADE_12_CHAPTERS) {
      expect(ch.textbookEdition).toBe('CDC First Edition 2025');
      expect(ch.sourceTraceability.edition).toBe('CDC First Edition 2025');
      expect(ch.sourceTraceability.status).toBe('Official CDC Chapter');
      expect(ch.textbookStartPage).toBeGreaterThan(lastG12Page);
      expect(ch.officialTitle.length).toBeGreaterThan(0);
      expect(ch.displayTitle.length).toBeGreaterThan(0);
      expect(ch.title).toBe(ch.displayTitle);
      expect(ch.subtopics.length).toBeGreaterThanOrEqual(3);
      expect(ch.keyEquations.length).toBeGreaterThanOrEqual(1);
      lastG12Page = ch.textbookStartPage;
    }
    expect(GRADE_12_CHAPTERS[24].textbookStartPage).toBe(477);
  });
});
