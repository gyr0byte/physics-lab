package com.physicslab.app.ui.screens

import android.annotation.SuppressLint
import android.view.KeyEvent
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.viewinterop.AndroidView
import androidx.webkit.WebViewAssetLoader

/**
 * Simulation screen: hosts the bundled web simulation inside a WebView.
 *
 * Security:
 * - Uses WebViewAssetLoader for local content (no file:// URLs)
 * - JavaScript enabled only because the bundled simulation requires it
 * - No universal file access
 * - No mixed content
 * - No JavaScript bridge
 *
 * The simulation web app is bundled in: assets/simulation-web/
 * Served at: https://appassets.androidplatform.net/assets/simulation-web/
 */
@SuppressLint("SetJavaScriptEnabled")
@Composable
fun SimulationScreen(
    simulationId: String,
    onBack: () -> Unit
) {
    val context = LocalContext.current

    // WebViewAssetLoader serves files from the APK's assets directory
    // over a virtual HTTPS domain, avoiding file:// security issues
    val assetLoader = remember {
        WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(context))
            .build()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black)
    ) {
        AndroidView(
            factory = { ctx ->
                WebView(ctx).apply {
                    // Enable JavaScript for the bundled simulation
                    settings.javaScriptEnabled = true

                    // Disable potentially unsafe settings
                    settings.allowFileAccess = false
                    settings.allowContentAccess = false

                    // Use WebViewAssetLoader to intercept requests
                    webViewClient = object : WebViewClient() {
                        override fun shouldInterceptRequest(
                            view: WebView,
                            request: WebResourceRequest
                        ): WebResourceResponse? {
                            return assetLoader.shouldInterceptRequest(request.url)
                        }
                    }

                    // Handle back key: let the web content handle most keys,
                    // but intercept Back to navigate out of the simulation
                    setOnKeyListener { _, keyCode, event ->
                        if (keyCode == KeyEvent.KEYCODE_BACK && event.action == KeyEvent.ACTION_DOWN) {
                            onBack()
                            true
                        } else {
                            false
                        }
                    }

                    // Load the bundled simulation
                    loadUrl("https://appassets.androidplatform.net/assets/simulation-web/index.html")
                }
            },
            modifier = Modifier.fillMaxSize()
        )
    }
}
