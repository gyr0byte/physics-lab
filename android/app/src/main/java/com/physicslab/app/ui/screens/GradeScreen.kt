package com.physicslab.app.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.key.*
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.tv.material3.*
import com.physicslab.app.data.CurriculumData

/**
 * Grade screen: shows physics areas/topics for a given grade.
 * D-pad navigable list of curriculum areas.
 */
@Composable
fun GradeScreen(
    gradeNumber: Int,
    onAreaSelected: (String) -> Unit,
    onBack: () -> Unit
) {
    val areas = CurriculumData.getAreasForGrade(gradeNumber)

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
                Text(
                    text = "Grade $gradeNumber — Physics",
                    fontSize = 32.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFFE6EDF3)
                )
                Text(
                    text = "Press Back to return",
                    fontSize = 14.sp,
                    color = Color(0xFF484F58)
                )
            }

            Spacer(modifier = Modifier.height(32.dp))

            // Area cards in a grid layout
            Column(
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                areas.chunked(3).forEach { row ->
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        row.forEach { area ->
                            AreaCard(
                                areaName = area.name,
                                topicCount = area.topicCount,
                                simulationCount = area.simulationCount,
                                onClick = { onAreaSelected(area.name) },
                                modifier = Modifier.weight(1f)
                            )
                        }
                        // Fill remaining space if row is incomplete
                        repeat(3 - row.size) {
                            Spacer(modifier = Modifier.weight(1f))
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
private fun AreaCard(
    areaName: String,
    topicCount: Int,
    simulationCount: Int,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        onClick = onClick,
        modifier = modifier.height(120.dp),
        colors = CardDefaults.colors(
            containerColor = Color(0xFF161B22),
            focusedContainerColor = Color(0xFF1C2433)
        ),
        border = CardDefaults.border(
            focusedBorder = Border(
                border = BorderStroke(width = 2.dp, color = Color(0xFF64B5F6))
            )
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Text(
                text = areaName,
                fontSize = 18.sp,
                fontWeight = FontWeight.SemiBold,
                color = Color(0xFFE6EDF3)
            )
            Row(
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Text(
                    text = "$topicCount topics",
                    fontSize = 13.sp,
                    color = Color(0xFF8B949E)
                )
                if (simulationCount > 0) {
                    Text(
                        text = "$simulationCount simulation${if (simulationCount > 1) "s" else ""}",
                        fontSize = 13.sp,
                        color = Color(0xFF64B5F6)
                    )
                } else {
                    Text(
                        text = "Coming soon",
                        fontSize = 13.sp,
                        color = Color(0xFF484F58)
                    )
                }
            }
        }
    }
}
