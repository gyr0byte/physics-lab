package com.physicslab.app.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.physicslab.app.ui.screens.GradeScreen
import com.physicslab.app.ui.screens.HomeScreen
import com.physicslab.app.ui.screens.ChapterScreen
import com.physicslab.app.ui.screens.SimulationScreen

/**
 * Top-level navigation graph.
 * Routes: Home → Grade → Chapter → Simulation
 * Back navigates in reverse order.
 */

object Routes {
    const val HOME = "home"
    const val GRADE = "grade/{gradeNumber}"
    const val CHAPTER = "chapter/{gradeNumber}/{areaName}"
    const val SIMULATION = "simulation/{simulationId}"

    fun grade(number: Int) = "grade/$number"
    fun chapter(gradeNumber: Int, areaName: String) = "chapter/$gradeNumber/$areaName"
    fun simulation(id: String) = "simulation/$id"
}

@Composable
fun PhysicsLabNavGraph() {
    val navController = rememberNavController()

    NavHost(
        navController = navController,
        startDestination = Routes.HOME
    ) {
        composable(Routes.HOME) {
            HomeScreen(
                onGradeSelected = { grade ->
                    navController.navigate(Routes.grade(grade))
                }
            )
        }

        composable(Routes.GRADE) { backStackEntry ->
            val gradeNumber = backStackEntry.arguments?.getString("gradeNumber")?.toIntOrNull() ?: 11
            GradeScreen(
                gradeNumber = gradeNumber,
                onAreaSelected = { areaName ->
                    navController.navigate(Routes.chapter(gradeNumber, areaName))
                },
                onBack = { navController.popBackStack() }
            )
        }

        composable(Routes.CHAPTER) { backStackEntry ->
            val gradeNumber = backStackEntry.arguments?.getString("gradeNumber")?.toIntOrNull() ?: 11
            val areaName = backStackEntry.arguments?.getString("areaName") ?: ""
            ChapterScreen(
                gradeNumber = gradeNumber,
                areaName = areaName,
                onSimulationSelected = { simId ->
                    navController.navigate(Routes.simulation(simId))
                },
                onBack = { navController.popBackStack() }
            )
        }

        composable(Routes.SIMULATION) { backStackEntry ->
            val simulationId = backStackEntry.arguments?.getString("simulationId") ?: ""
            SimulationScreen(
                simulationId = simulationId,
                onBack = { navController.popBackStack() }
            )
        }
    }
}
