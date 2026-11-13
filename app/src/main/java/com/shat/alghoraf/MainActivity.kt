package com.shat.alghoraf

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.shat.alghoraf.ui.navigation.AppNavigation
import com.shat.alghoraf.ui.theme.ShatAlghorafTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            ShatAlghorafTheme {
                AppNavigation()
            }
        }
    }
}
