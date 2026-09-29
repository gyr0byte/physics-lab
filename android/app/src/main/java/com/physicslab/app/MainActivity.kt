package com.physicslab.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import com.physicslab.app.navigation.PhysicsLabNavGraph
import com.physicslab.app.ui.theme.PhysicsLabTheme

/**
 * Single-activity architecture for Android TV.
 * Compose handles all navigation; WebView hosts simulations.
 */
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            PhysicsLabTheme {
                PhysicsLabNavGraph()
            }
        }
    }
}
