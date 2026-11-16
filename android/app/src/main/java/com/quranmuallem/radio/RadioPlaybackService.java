package com.quranmuallem.radio;

import android.app.PendingIntent;
import android.content.Intent;
import android.os.SystemClock;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.annotation.OptIn;
import androidx.media3.common.AudioAttributes;
import androidx.media3.common.C;
import androidx.media3.common.ForwardingPlayer;
import androidx.media3.common.Player;
import androidx.media3.common.util.UnstableApi;
import androidx.media3.datasource.DefaultDataSource;
import androidx.media3.datasource.DefaultHttpDataSource;
import androidx.media3.exoplayer.DefaultLoadControl;
import androidx.media3.exoplayer.ExoPlayer;
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory;
import androidx.media3.session.MediaSession;
import androidx.media3.session.MediaSessionService;

/**
 * Hintergrund-Wiedergabedienst (Foreground Service, Typ "mediaPlayback").
 *
 * - Spielt den Stream nativ mit ExoPlayer ab (MP3/AAC/OGG und HLS), unabhängig von der WebView.
 *   Dadurch läuft das Radio weiter, wenn der Bildschirm aus ist oder die App im Hintergrund liegt.
 * - Die MediaSession sorgt automatisch für die Medien-Benachrichtigung, die Steuerung auf dem
 *   Sperrbildschirm, Bluetooth-/Kopfhörer-Tasten und Android Auto / Wear-Steuerung.
 * - Audiofokus: pausiert bei Anrufen oder anderen Audio-Apps und setzt danach fort.
 * - Kopfhörer abgezogen: Wiedergabe pausiert automatisch ("becoming noisy").
 * - Wake- und WLAN-Lock (WAKE_MODE_NETWORK) halten die Verbindung bei ausgeschaltetem Bildschirm.
 */
@OptIn(markerClass = UnstableApi.class)
public class RadioPlaybackService extends MediaSessionService {

    private static final String USER_AGENT = "QuranRadio/1.0 (Android; +https://github.com/Quran-Muallem/radio)";

    @Nullable
    private MediaSession mediaSession;

    @Override
    public void onCreate() {
        super.onCreate();

        DefaultHttpDataSource.Factory http = new DefaultHttpDataSource.Factory()
            .setUserAgent(USER_AGENT)
            .setAllowCrossProtocolRedirects(true)
            .setConnectTimeoutMs(15_000)
            .setReadTimeoutMs(20_000);

        // Etwas größerer Puffer als Standard: robuster bei schwankendem Mobilfunk
        DefaultLoadControl loadControl = new DefaultLoadControl.Builder()
            .setBufferDurationsMs(15_000, 60_000, 2_000, 4_000)
            .build();

        ExoPlayer exoPlayer = new ExoPlayer.Builder(this)
            .setMediaSourceFactory(new DefaultMediaSourceFactory(new DefaultDataSource.Factory(this, http)))
            .setLoadControl(loadControl)
            .setAudioAttributes(
                new AudioAttributes.Builder()
                    .setUsage(C.USAGE_MEDIA)
                    .setContentType(C.AUDIO_CONTENT_TYPE_SPEECH)
                    .build(),
                /* handleAudioFocus= */ true
            )
            .setHandleAudioBecomingNoisy(true)
            .setWakeMode(C.WAKE_MODE_NETWORK)
            .build();

        Intent launch = getPackageManager().getLaunchIntentForPackage(getPackageName());
        if (launch == null) launch = new Intent(this, MainActivity.class);
        launch.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent openApp = PendingIntent.getActivity(
            this, 0, launch, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
        );

        mediaSession = new MediaSession.Builder(this, new LiveRadioPlayer(exoPlayer))
            .setSessionActivity(openApp) // Tippen auf die Benachrichtigung öffnet die App
            .build();
    }

    @Nullable
    @Override
    public MediaSession onGetSession(@NonNull MediaSession.ControllerInfo controllerInfo) {
        return mediaSession;
    }

    /** App aus der Übersicht weggewischt: weiterspielen, wenn gerade Radio läuft – sonst Dienst beenden. */
    @Override
    public void onTaskRemoved(@Nullable Intent rootIntent) {
        if (mediaSession == null) {
            stopSelf();
            return;
        }
        Player player = mediaSession.getPlayer();
        if (!player.getPlayWhenReady() || player.getMediaItemCount() == 0) {
            stopSelf();
        }
    }

    @Override
    public void onDestroy() {
        if (mediaSession != null) {
            mediaSession.getPlayer().release();
            mediaSession.release();
            mediaSession = null;
        }
        super.onDestroy();
    }

    /**
     * Live-Radio-Logik für alle Steuerquellen (App, Sperrbildschirm, Kopfhörer):
     * Nach einer Pause von mehr als 5 Sekunden oder nach einem Fehler wird der Stream frisch verbunden,
     * statt alten Puffer abzuspielen. So hört man nach "Play" immer das aktuelle Live-Programm.
     */
    private static final class LiveRadioPlayer extends ForwardingPlayer {
        private static final long STALE_AFTER_MS = 5_000;
        private long pausedAt = 0;

        LiveRadioPlayer(Player player) {
            super(player);
            player.addListener(new Player.Listener() {
                @Override
                public void onPlayWhenReadyChanged(boolean playWhenReady, int reason) {
                    pausedAt = playWhenReady ? 0 : SystemClock.elapsedRealtime();
                }
            });
        }

        @Override
        public void play() {
            Player p = getWrappedPlayer();
            if (p.getMediaItemCount() > 0) {
                boolean stale = pausedAt > 0 && SystemClock.elapsedRealtime() - pausedAt > STALE_AFTER_MS;
                boolean failed = p.getPlayerError() != null || p.getPlaybackState() == Player.STATE_IDLE
                    || p.getPlaybackState() == Player.STATE_ENDED;
                if (stale || failed) {
                    p.stop();
                    p.seekToDefaultPosition();
                    p.prepare();
                }
            }
            super.play();
        }
    }
}
