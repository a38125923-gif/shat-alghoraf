package com.shat.alghoraf.audio

import android.annotation.SuppressLint
import android.media.AudioFormat
import android.media.AudioManager
import android.media.AudioRecord
import android.media.MediaRecorder
import android.media.ToneGenerator
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlin.math.sqrt

/**
 * Manages live Android AudioRecord voice activity monitoring for the 5 room voice mics
 * and profile music chimes without leaking audio hardware resources.
 */
class VoiceAudioEngine {
    private val engineScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private var captureJob: Job? = null
    private var musicJob: Job? = null

    private val _liveMicLevel = MutableStateFlow(0f)
    val liveMicLevel: StateFlow<Float> = _liveMicLevel.asStateFlow()

    private val _isMicCapturing = MutableStateFlow(false)
    val isMicCapturing: StateFlow<Boolean> = _isMicCapturing.asStateFlow()

    @SuppressLint("MissingPermission")
    fun startMicCapture(onTalkingChanged: (Boolean) -> Unit) {
        if (captureJob?.isActive == true) return
        captureJob = engineScope.launch {
            val sampleRate = 16000
            val minBuf = AudioRecord.getMinBufferSize(
                sampleRate,
                AudioFormat.CHANNEL_IN_MONO,
                AudioFormat.ENCODING_PCM_16BIT
            )
            if (minBuf <= 0) return@launch

            var recorder: AudioRecord? = null
            var lastTalking = false
            try {
                recorder = AudioRecord(
                    MediaRecorder.AudioSource.VOICE_COMMUNICATION,
                    sampleRate,
                    AudioFormat.CHANNEL_IN_MONO,
                    AudioFormat.ENCODING_PCM_16BIT,
                    minBuf * 2
                )
                if (recorder.state != AudioRecord.STATE_INITIALIZED) {
                    recorder.release()
                    return@launch
                }
                recorder.startRecording()
                _isMicCapturing.value = true
                val buffer = ShortArray(minBuf / 2)
                var lastEmitTime = 0L

                while (isActive) {
                    val read = recorder.read(buffer, 0, buffer.size)
                    if (read > 0) {
                        var sumSq = 0.0
                        for (i in 0 until read) {
                            val s = buffer[i].toDouble()
                            sumSq += s * s
                        }
                        val rms = sqrt(sumSq / read).toFloat()
                        val normalized = (rms / 3500f).coerceIn(0f, 1f)
                        _liveMicLevel.value = normalized

                        val now = System.currentTimeMillis()
                        val isTalkingNow = normalized > 0.08f
                        if (isTalkingNow != lastTalking && now - lastEmitTime > 450L) {
                            lastTalking = isTalkingNow
                            lastEmitTime = now
                            onTalkingChanged(isTalkingNow)
                        }
                    }
                }
            } catch (_: Exception) {
                // Hardware mic unavailable or permission revoked
            } finally {
                _isMicCapturing.value = false
                _liveMicLevel.value = 0f
                try {
                    recorder?.stop()
                } catch (_: Exception) { }
                try {
                    recorder?.release()
                } catch (_: Exception) { }
            }
        }
    }

    fun stopMicCapture(onStopped: (() -> Unit)? = null) {
        captureJob?.cancel()
        captureJob = null
        _isMicCapturing.value = false
        _liveMicLevel.value = 0f
        onStopped?.invoke()
    }

    fun playProfileMusicChime(presetId: String) {
        if (presetId.isBlank()) return
        musicJob?.cancel()
        musicJob = engineScope.launch {
            val tones = when (presetId) {
                "royal_oud" -> listOf(ToneGenerator.TONE_DTMF_3, ToneGenerator.TONE_DTMF_6, ToneGenerator.TONE_DTMF_9)
                "lofi_chill" -> listOf(ToneGenerator.TONE_DTMF_1, ToneGenerator.TONE_DTMF_4, ToneGenerator.TONE_DTMF_2)
                "piano_soft" -> listOf(ToneGenerator.TONE_DTMF_5, ToneGenerator.TONE_DTMF_8, ToneGenerator.TONE_DTMF_0)
                else -> listOf(ToneGenerator.TONE_PROP_BEEP2, ToneGenerator.TONE_PROP_ACK)
            }
            var tg: ToneGenerator? = null
            try {
                tg = ToneGenerator(AudioManager.STREAM_MUSIC, 50)
                for (t in tones) {
                    if (!isActive) break
                    tg.startTone(t, 160)
                    delay(210L)
                }
            } catch (_: Exception) {
            } finally {
                try {
                    tg?.release()
                } catch (_: Exception) { }
            }
        }
    }

    fun release() {
        stopMicCapture()
        musicJob?.cancel()
        engineScope.cancel()
    }
}
