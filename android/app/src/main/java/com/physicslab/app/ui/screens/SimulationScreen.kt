package com.physicslab.app.ui.screens

import android.annotation.SuppressLint
import android.util.Log
import android.view.KeyEvent
import android.webkit.ConsoleMessage
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.compose.BackHandler
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
 * - Mixed content explicitly disabled (MIXED_CONTENT_NEVER_ALLOW)
 * - Navigation restricted to local app assets domain
 * - No JavaScript bridge
 * - Proper lifecycle cleanup on disposal
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
    var webViewRef by remember { mutableStateOf<WebView?>(null) }

    // Intercept system/gesture back button
    BackHandler {
        onBack()
    }

    // Clean up WebView resources when leaving the screen
    DisposableEffect(Unit) {
        onDispose {
            webViewRef?.apply {
                stopLoading()
                onPause()
                destroy()
            }
            webViewRef = null
        }
    }

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
                    webViewRef = this


                    // Enable JavaScript for the bundled simulation
                    settings.javaScriptEnabled = true

                    // Enable DOM storage (required for some web apps)
                    settings.domStorageEnabled = true

                    // Use wide viewport to match the physical screen
                    settings.useWideViewPort = true
                    settings.loadWithOverviewMode = true

                    // Disable potentially unsafe settings
                    settings.allowFileAccess = false
                    settings.allowContentAccess = false
                    settings.mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW

                    // Disable caching — the simulation is bundled locally
                    // and the JS hash changes on every build
                    settings.cacheMode = WebSettings.LOAD_NO_CACHE
                    clearCache(true)

                    // Ensure touch events reach the WebView content
                    isFocusable = true
                    isFocusableInTouchMode = true
                    requestFocus()

                    // WebChromeClient to route console messages to logcat for diagnostics
                    webChromeClient = object : WebChromeClient() {
                        override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
                            if (consoleMessage != null) {
                                Log.i(
                                    "SimulationWebView",
                                    "${consoleMessage.messageLevel()}: ${consoleMessage.message()} (line ${consoleMessage.lineNumber()} of ${consoleMessage.sourceId()})"
                                )
                            }
                            return true
                        }
                    }

                    // Use WebViewAssetLoader to intercept requests and restrict navigation
                    webViewClient = object : WebViewClient() {
                        override fun shouldInterceptRequest(
                            view: WebView,
                            request: WebResourceRequest
                        ): WebResourceResponse? {
                            val response = assetLoader.shouldInterceptRequest(request.url) ?: return null
                            val path = request.url.path.orEmpty()
                            // Chromium strictly enforces valid JavaScript MIME types for <script type="module">
                            if (path.endsWith(".js", ignoreCase = true) || path.endsWith(".mjs", ignoreCase = true)) {
                                response.mimeType = "application/javascript"
                                response.encoding = "utf-8"
                            } else if (path.endsWith(".css", ignoreCase = true)) {
                                response.mimeType = "text/css"
                                response.encoding = "utf-8"
                            } else if (path.endsWith(".html", ignoreCase = true)) {
                                response.mimeType = "text/html"
                                response.encoding = "utf-8"
                            } else if (path.endsWith(".json", ignoreCase = true)) {
                                response.mimeType = "application/json"
                                response.encoding = "utf-8"
                            } else if (path.endsWith(".svg", ignoreCase = true)) {
                                response.mimeType = "image/svg+xml"
                                response.encoding = "utf-8"
                            }
                            try {
                                response.setStatusCodeAndReasonPhrase(200, "OK")
                                val headers = response.responseHeaders?.toMutableMap() ?: mutableMapOf()
                                headers["Access-Control-Allow-Origin"] = "*"
                                response.responseHeaders = headers
                            } catch (e: Exception) {
                                Log.w("SimulationWebView", "Failed to set status/headers: ${e.message}")
                            }
                            return response
                        }

                        override fun onReceivedError(
                            view: WebView?,
                            request: WebResourceRequest?,
                            error: WebResourceError?
                        ) {
                            super.onReceivedError(view, request, error)
                            Log.e("SimulationWebView", "Resource error for ${request?.url}: ${error?.description}")
                        }

                        override fun shouldOverrideUrlLoading(
                            view: WebView,
                            request: WebResourceRequest
                        ): Boolean {
                            val url = request.url.toString()
                            // Only allow navigation within the app assets domain
                            return !url.startsWith("https://appassets.androidplatform.net/assets/simulation-web/")
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

                    // Load the bundled simulation with the targeted simulation ID hash
                    val simHash = if (simulationId.isNotBlank()) "#$simulationId" else ""
                    loadUrl("https://appassets.androidplatform.net/assets/simulation-web/index.html$simHash")
                }
            },
            onRelease = { webView ->
                webView.stopLoading()
                webView.onPause()
                webView.destroy()
            },
            modifier = Modifier.fillMaxSize()
        )
    }
}
