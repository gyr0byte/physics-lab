package com.physicslab.app.data

/**
 * Curriculum data for Grade 11 and Grade 12 Physics.
 * Driven by data structure, not hardcoded UI.
 *
 * For the first milestone, only Mechanics/Kinematics/Projectile Motion
 * has an implemented simulation. All other entries are marked as planned.
 *
 * Source of truth: Nepal CDC Physics curriculum
 * https://moecdc.gov.np/storage/gallery/1672125377.pdf
 */

data class CurriculumArea(
    val name: String,
    val topicCount: Int,
    val simulationCount: Int
)

data class CurriculumTopic(
    val title: String,
    val simulationIds: List<String>
)

object CurriculumData {

    fun getAreasForGrade(grade: Int): List<CurriculumArea> {
        return when (grade) {
            11 -> grade11Areas
            12 -> grade12Areas
            else -> emptyList()
        }
    }

    fun getTopicsForArea(grade: Int, areaName: String): List<CurriculumTopic> {
        val key = "$grade:$areaName"
        return topicsByArea[key] ?: emptyList()
    }

    // ── Grade 11 ─────────────────────────────────────────────────

    private val grade11Areas = listOf(
        CurriculumArea("Mechanics", topicCount = 5, simulationCount = 2),
        CurriculumArea("Heat and Thermodynamics", topicCount = 3, simulationCount = 0),
        CurriculumArea("Waves and Optics", topicCount = 3, simulationCount = 0),
        CurriculumArea("Electricity and Magnetism", topicCount = 3, simulationCount = 0),
        CurriculumArea("Modern Physics", topicCount = 2, simulationCount = 0),
    )

    // ── Grade 12 ─────────────────────────────────────────────────

    private val grade12Areas = listOf(
        CurriculumArea("Mechanics", topicCount = 3, simulationCount = 0),
        CurriculumArea("Heat and Thermodynamics", topicCount = 2, simulationCount = 0),
        CurriculumArea("Waves and Optics", topicCount = 3, simulationCount = 0),
        CurriculumArea("Electricity and Magnetism", topicCount = 4, simulationCount = 0),
        CurriculumArea("Modern Physics", topicCount = 3, simulationCount = 0),
    )

    // ── Topics by area ───────────────────────────────────────────

    private val topicsByArea = mapOf(
        "11:Mechanics" to listOf(
            CurriculumTopic("Kinematics — Projectile Motion", listOf("projectile-motion")),
            CurriculumTopic("Newton's Laws of Motion", listOf("newtons-second-law")),
            CurriculumTopic("Friction", emptyList()),
            CurriculumTopic("Work, Energy and Power", emptyList()),
            CurriculumTopic("Circular Motion", emptyList()),
        ),
        "11:Heat and Thermodynamics" to listOf(
            CurriculumTopic("Heat and Temperature", emptyList()),
            CurriculumTopic("Thermal Expansion", emptyList()),
            CurriculumTopic("Quantity of Heat", emptyList()),
        ),
        "11:Waves and Optics" to listOf(
            CurriculumTopic("Wave Motion", emptyList()),
            CurriculumTopic("Sound Waves", emptyList()),
            CurriculumTopic("Reflection and Refraction", emptyList()),
        ),
        "11:Electricity and Magnetism" to listOf(
            CurriculumTopic("Electrostatics", emptyList()),
            CurriculumTopic("Current Electricity", emptyList()),
            CurriculumTopic("Magnetism", emptyList()),
        ),
        "11:Modern Physics" to listOf(
            CurriculumTopic("Nuclear Physics", emptyList()),
            CurriculumTopic("Semiconductor Devices", emptyList()),
        ),

        // Grade 12 — all planned
        "12:Mechanics" to listOf(
            CurriculumTopic("Rotational Dynamics", emptyList()),
            CurriculumTopic("Gravitation", emptyList()),
            CurriculumTopic("Simple Harmonic Motion", emptyList()),
        ),
        "12:Heat and Thermodynamics" to listOf(
            CurriculumTopic("First Law of Thermodynamics", emptyList()),
            CurriculumTopic("Second Law of Thermodynamics", emptyList()),
        ),
        "12:Waves and Optics" to listOf(
            CurriculumTopic("Physical Optics", emptyList()),
            CurriculumTopic("Interference and Diffraction", emptyList()),
            CurriculumTopic("Polarization", emptyList()),
        ),
        "12:Electricity and Magnetism" to listOf(
            CurriculumTopic("Electric Field and Potential", emptyList()),
            CurriculumTopic("Capacitors", emptyList()),
            CurriculumTopic("DC Circuits", emptyList()),
            CurriculumTopic("Electromagnetic Induction", emptyList()),
        ),
        "12:Modern Physics" to listOf(
            CurriculumTopic("Photoelectric Effect", emptyList()),
            CurriculumTopic("Bohr's Atomic Model", emptyList()),
            CurriculumTopic("X-rays", emptyList()),
        ),
    )
}
