package com.physicslab.app.data

/**
 * Concise curriculum metadata for Grade 11 and Grade 12 Physics.
 * Serves strictly as the application catalogue for chapter navigation
 * and simulation launching on Android TV.
 *
 * Source of truth: Nepal CDC Secondary-Level Physics Curriculum
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

    // ── Grade 11 Content Areas (26 Chapters Total) ───────────────────────

    private val grade11Areas = listOf(
        CurriculumArea("Mechanics", topicCount = 8, simulationCount = 2),
        CurriculumArea("Heat and Thermodynamics", topicCount = 5, simulationCount = 0),
        CurriculumArea("Waves and Optics", topicCount = 5, simulationCount = 0),
        CurriculumArea("Electricity and Magnetism", topicCount = 5, simulationCount = 0),
        CurriculumArea("Modern Physics", topicCount = 3, simulationCount = 0),
    )

    // ── Grade 12 Content Areas (25 Chapters Total) ───────────────────────

    private val grade12Areas = listOf(
        CurriculumArea("Mechanics", topicCount = 3, simulationCount = 0),
        CurriculumArea("Heat and Thermodynamics", topicCount = 2, simulationCount = 0),
        CurriculumArea("Waves and Optics", topicCount = 8, simulationCount = 0),
        CurriculumArea("Electricity and Magnetism", topicCount = 6, simulationCount = 0),
        CurriculumArea("Modern Physics", topicCount = 6, simulationCount = 0),
    )

    // ── Chapter Catalogue by Area ───────────────────────────────────────

    private val topicsByArea = mapOf(
        // Grade 11
        "11:Mechanics" to listOf(
            CurriculumTopic("Physical Quantities", emptyList()),
            CurriculumTopic("Vectors", emptyList()),
            CurriculumTopic("Kinematics — Projectile Motion", listOf("projectile-motion")),
            CurriculumTopic("Dynamics — Newton's Laws", listOf("newtons-second-law")),
            CurriculumTopic("Work, Energy and Power", emptyList()),
            CurriculumTopic("Circular Motion", emptyList()),
            CurriculumTopic("Gravitation", emptyList()),
            CurriculumTopic("Elasticity", emptyList()),
        ),
        "11:Heat and Thermodynamics" to listOf(
            CurriculumTopic("Heat and Temperature", emptyList()),
            CurriculumTopic("Thermal Expansion", emptyList()),
            CurriculumTopic("Quantity of Heat", emptyList()),
            CurriculumTopic("Rate of Heat Flow", emptyList()),
            CurriculumTopic("Ideal Gas", emptyList()),
        ),
        "11:Waves and Optics" to listOf(
            CurriculumTopic("Reflection at Curved Mirrors", emptyList()),
            CurriculumTopic("Refraction at Plane Surfaces", emptyList()),
            CurriculumTopic("Refraction through Prisms", emptyList()),
            CurriculumTopic("Lenses", emptyList()),
            CurriculumTopic("Dispersion", emptyList()),
        ),
        "11:Electricity and Magnetism" to listOf(
            CurriculumTopic("Electric Charges", emptyList()),
            CurriculumTopic("Electric Field", emptyList()),
            CurriculumTopic("Potential, Potential Difference & Energy", emptyList()),
            CurriculumTopic("Capacitors", emptyList()),
            CurriculumTopic("DC Circuits", emptyList()),
        ),
        "11:Modern Physics" to listOf(
            CurriculumTopic("Nuclear Physics", emptyList()),
            CurriculumTopic("Energy Levels", emptyList()),
            CurriculumTopic("Solids", emptyList()),
        ),

        // Grade 12
        "12:Mechanics" to listOf(
            CurriculumTopic("Rotational Dynamics", emptyList()),
            CurriculumTopic("Periodic Motion", emptyList()),
            CurriculumTopic("Fluid Mechanics", emptyList()),
        ),
        "12:Heat and Thermodynamics" to listOf(
            CurriculumTopic("First Law of Thermodynamics", emptyList()),
            CurriculumTopic("Second Law of Thermodynamics", emptyList()),
        ),
        "12:Waves and Optics" to listOf(
            CurriculumTopic("Wave Motion", emptyList()),
            CurriculumTopic("Mechanical Waves", emptyList()),
            CurriculumTopic("Waves in Pipes and Strings", emptyList()),
            CurriculumTopic("Acoustic Phenomena", emptyList()),
            CurriculumTopic("Nature and Propagation of Light", emptyList()),
            CurriculumTopic("Interference of Light", emptyList()),
            CurriculumTopic("Diffraction", emptyList()),
            CurriculumTopic("Polarisation", emptyList()),
        ),
        "12:Electricity and Magnetism" to listOf(
            CurriculumTopic("Electrical Circuits", emptyList()),
            CurriculumTopic("Thermoelectric Effect", emptyList()),
            CurriculumTopic("Magnetic Fields", emptyList()),
            CurriculumTopic("Magnetic Properties of Materials", emptyList()),
            CurriculumTopic("Electromagnetic Induction", emptyList()),
            CurriculumTopic("Alternating Current", emptyList()),
        ),
        "12:Modern Physics" to listOf(
            CurriculumTopic("Electrons", emptyList()),
            CurriculumTopic("Photons", emptyList()),
            CurriculumTopic("Semiconductor Devices", emptyList()),
            CurriculumTopic("Quantization of Energy", emptyList()),
            CurriculumTopic("Radioactivity & Nuclear Reactions", emptyList()),
            CurriculumTopic("Recent Trends in Physics", emptyList()),
        ),
    )
}
