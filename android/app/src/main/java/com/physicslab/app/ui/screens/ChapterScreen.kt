package com.physicslab.app.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.key.*
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.tv.material3.*
import com.physicslab.app.data.CurriculumData

/**
 * Chapter/topic screen for a specific area within a grade.
 * Shows available simulations and planned topics.
 */
@Composable
fun ChapterScreen(
    gradeNumber: Int,
    areaName: String,
    onSimulationSelected: (String) -> Unit,
    onBack: () -> Unit
) {
    val topics = CurriculumData.getTopicsForArea(gradeNumber, areaName)

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0D1117))
            .onPreviewKeyEvent { event ->
                if (event.type == KeyEventType.KeyDown && event.key == Key.Back) {
                    onBack()
                    true
                } else false
            }
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(48.dp)
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = areaName,
                        fontSize = 32.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFFE6EDF3)
                    )
                    Text(
                        text = "Grade $gradeNumber",
                        fontSize = 16.sp,
                        color = Color(0xFF8B949E)
                    )
                }
                Text(
                    text = "Press Back to return",
                    fontSize = 14.sp,
                    color = Color(0xFF484F58)
                )
            }

            Spacer(modifier = Modifier.height(32.dp))

            // Topic list
            Column(
                modifier = Modifier.verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                topics.forEach { topic ->
                    TopicCard(
                        title = topic.title,
                        simulationIds = topic.simulationIds,
                        onSimulationSelected = onSimulationSelected
                    )
                }
            }
        }
    }
}

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
private fun TopicCard(
    title: String,
    simulationIds: List<String>,
    onSimulationSelected: (String) -> Unit
) {
    val hasSimulations = simulationIds.isNotEmpty()

    Card(
        onClick = {
            if (hasSimulations) {
                onSimulationSelected(simulationIds.first())
            }
        },
        modifier = Modifier
            .fillMaxWidth()
            .height(80.dp)
            .clip(RoundedCornerShape(12.dp))
            .clickable {
                if (hasSimulations) {
                    onSimulationSelected(simulationIds.first())
                }
            },
        colors = CardDefaults.colors(
            containerColor = if (hasSimulations) Color(0xFF161B22) else Color(0xFF0D1117),
            focusedContainerColor = if (hasSimulations) Color(0xFF1C2433) else Color(0xFF13181F)
        ),
        border = CardDefaults.border(
            focusedBorder = Border(
                border = BorderStroke(
                    width = 2.dp,
                    color = if (hasSimulations) Color(0xFF64B5F6) else Color(0xFF30363D)
                )
            )
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 20.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = title,
                fontSize = 18.sp,
                fontWeight = if (hasSimulations) FontWeight.Medium else FontWeight.Normal,
                color = if (hasSimulations) Color(0xFFE6EDF3) else Color(0xFF6E7681)
            )
            if (hasSimulations) {
                Text(
                    text = "▶ Launch",
                    fontSize = 14.sp,
                    color = Color(0xFF64B5F6)
                )
            } else {
                Text(
                    text = "Planned",
                    fontSize = 14.sp,
                    color = Color(0xFF484F58)
                )
            }
        }
    }
}
