plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.compose.compiler)
}

android {
    namespace = "com.physicslab.app"
    compileSdk = 37

    defaultConfig {
        applicationId = "com.physicslab.app"
        minSdk = 23
        targetSdk = 37
        versionCode = 1
        versionName = "0.1.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }
}

dependencies {
    // Compose BOM — manages all Compose library versions
    implementation(platform(libs.compose.bom))
    implementation(libs.compose.ui)
    implementation(libs.compose.ui.graphics)
    implementation(libs.compose.material3)
    implementation(libs.compose.ui.tooling.preview)
    debugImplementation(libs.compose.ui.tooling)

    // Compose for TV
    implementation(libs.tv.material)
    implementation(libs.tv.foundation)

    // Navigation
    implementation(libs.navigation.compose)
    implementation(libs.activity.compose)

    // WebView (WebViewAssetLoader)
    implementation(libs.webkit)

    // Core
    implementation(libs.core.ktx)
}
