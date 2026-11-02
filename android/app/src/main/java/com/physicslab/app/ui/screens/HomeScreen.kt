package com.physicslab.app.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.tv.material3.*

/**
 * Home screen: Physics Lab landing page.
 * Works on both Android TV (D-pad focus) and phones (touch).
 */
@Composable
fun HomeScreen(
    onGradeSelected: (Int) -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0D1117))
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(48.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            // Title
            Text(
                text = "Physics Lab",
                fontSize = 48.sp,
                fontWeight = FontWeight.Bold,
                color = Color(0xFFE6EDF3),
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = "Interactive Physics Simulations",
                fontSize = 20.sp,
                color = Color(0xFF8B949E),
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(12.dp))

            Text(
                text = "Nepal Secondary Level Physics Curriculum",
                fontSize = 16.sp,
                color = Color(0xFF6E7681),
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(64.dp))

            // Grade selection cards
            Row(
                horizontalArrangement = Arrangement.spacedBy(32.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                GradeCard(
                    gradeNumber = 11,
                    onClick = { onGradeSelected(11) }
                )
                GradeCard(
                    gradeNumber = 12,
                    onClick = { onGradeSelected(12) }
                )
            }

            Spacer(modifier = Modifier.height(48.dp))

            Text(
                text = "Tap a grade to begin  •  Use D-pad on TV remote",
                fontSize = 14.sp,
                color = Color(0xFF484F58)
            )
        }
    }
}

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
private fun GradeCard(
    gradeNumber: Int,
    onClick: () -> Unit
) {
    Card(
        onClick = onClick,
        modifier = Modifier
            .width(280.dp)
            .height(180.dp)
            // .clickable makes the card respond to touch taps on phones
            .clip(RoundedCornerShape(12.dp))
            .clickable { onClick() },
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
                .padding(24.dp),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "Grade $gradeNumber",
                fontSize = 32.sp,
                fontWeight = FontWeight.SemiBold,
                color = Color(0xFFE6EDF3)
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "Physics",
                fontSize = 16.sp,
                color = Color(0xFF8B949E)
            )
        }
    }
}

