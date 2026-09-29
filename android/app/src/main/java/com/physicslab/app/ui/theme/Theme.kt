package com.physicslab.app.ui.theme

import androidx.compose.runtime.Composable
import androidx.tv.material3.MaterialTheme
import androidx.tv.material3.darkColorScheme

/**
 * Physics Lab TV theme.
 * Dark color scheme optimized for classroom TV viewing.
 */

private val DarkColors = darkColorScheme()

@Composable
fun PhysicsLabTheme(
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = DarkColors,
        content = content
    )
}
