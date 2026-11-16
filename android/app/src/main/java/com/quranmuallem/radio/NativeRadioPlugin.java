package com.quranmuallem.radio;

import android.content.ComponentName;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.content.ContextCompat;
import androidx.media3.common.MediaItem;
import androidx.media3.common.MediaMetadata;
import androidx.media3.common.MimeTypes;
import androidx.media3.common.PlaybackException;
import androidx.media3.common.Player;
import androidx.media3.session.MediaController;
import androidx.media3.session.SessionToken;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.common.util.concurrent.ListenableFuture;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Brücke zwischen der Web-Oberfläche und dem nativen Wiedergabedienst.
 *
 * JS-Methoden: play({id,url,title,artist,artwork,hls}), pause(), resume(), stop(),
 *              setVolume({volume}), getState()
 * JS-Ereignis: "stateChange" → {state: idle|loading|playing|paused|error, id, error?}
 */
@CapacitorPlugin(name = "NativeRadio")
public class NativeRadioPlugin extends Plugin {

    private final Handler main = new Handler(Looper.getMainLooper());
    private final List<Runnable> pending = new ArrayList<>();
    @Nullable private ListenableFuture<MediaController> controllerFuture;
    @Nullable private MediaController controller;
    private String lastEmitted = "";

    private interface ControllerTask { void run(MediaController c); }

    @Override
    public void load() {
        main.post(this::connect);
    }

    private void connect() {
        if (controllerFuture != null) return;
        SessionToken token = new SessionToken(getContext(), new ComponentName(getContext(), RadioPlaybackService.class));
        controllerFuture = new MediaController.Builder(getContext(), token)
            .setApplicationLooper(Looper.getMainLooper())
            .buildAsync();
        controllerFuture.addListener(() -> {
            try {
                controller = controllerFuture.get();
                controller.addListener(new Player.Listener() {
                    @Override
                    public void onEvents(@NonNull Player player, @NonNull Player.Events events) {
                        emitState(false);
                    }
                });
                for (Runnable r : pending) r.run();
                pending.clear();
                emitState(true);
            } catch (Exception e) {
                controllerFuture = null;
                for (Runnable r : pending) r.run(); // Aufrufe beantworten (mit Fehler), nicht hängen lassen
                pending.clear();
            }
        }, ContextCompat.getMainExecutor(getContext()));
    }

    /** Führt eine Aktion auf dem Main-Thread aus, sobald der Controller verbunden ist. */
    private void withController(PluginCall call, ControllerTask task) {
        main.post(() -> {
            Runnable run = () -> {
                if (controller == null) {
                    call.reject("Wiedergabedienst nicht verfügbar");
                    return;
                }
                try {
                    task.run(controller);
                    call.resolve(stateObject(controller));
                } catch (Exception e) {
                    call.reject(e.getMessage() != null ? e.getMessage() : "Wiedergabefehler");
                }
            };
            if (controller != null) {
                run.run();
            } else {
                pending.add(run);
                connect();
            }
        });
    }

    @PluginMethod
    public void play(PluginCall call) {
        String url = call.getString("url");
        if (url == null || !url.startsWith("https://")) {
            call.reject("Ungültige oder unsichere Stream-URL");
            return;
        }
        String id = call.getString("id", url);
        String title = call.getString("title", "Quran Radio");
        String artist = call.getString("artist", "");
        String artwork = call.getString("artwork", "");
        boolean hls = Boolean.TRUE.equals(call.getBoolean("hls", false)) || url.toLowerCase(Locale.ROOT).contains(".m3u8");

        MediaMetadata.Builder meta = new MediaMetadata.Builder()
            .setTitle(title)
            .setArtist(artist)
            .setStation(title)
            .setAlbumTitle("Quran Radio · Live")
            .setIsPlayable(true)
            .setIsBrowsable(false);
        if (artwork != null && artwork.startsWith("https://")) meta.setArtworkUri(Uri.parse(artwork));

        MediaItem.Builder item = new MediaItem.Builder()
            .setMediaId(id)
            .setUri(url)
            .setMediaMetadata(meta.build());
        if (hls) item.setMimeType(MimeTypes.APPLICATION_M3U8);

        withController(call, c -> {
            c.stop();
            c.setMediaItem(item.build());
            c.prepare();
            c.play();
        });
    }

    @PluginMethod
    public void pause(PluginCall call) {
        withController(call, Player::pause);
    }

    @PluginMethod
    public void resume(PluginCall call) {
        withController(call, Player::play); // LiveRadioPlayer verbindet bei Bedarf neu
    }

    @PluginMethod
    public void stop(PluginCall call) {
        withController(call, c -> {
            c.stop();
            c.clearMediaItems();
        });
    }

    @PluginMethod
    public void setVolume(PluginCall call) {
        Double v = call.getDouble("volume", 1.0);
        float vol = (float) Math.max(0, Math.min(1, v == null ? 1.0 : v));
        withController(call, c -> c.setVolume(vol));
    }

    @PluginMethod
    public void getState(PluginCall call) {
        withController(call, c -> { /* nur Status zurückgeben */ });
    }

    private JSObject stateObject(MediaController c) {
        JSObject o = new JSObject();
        String state;
        PlaybackException err = c.getPlayerError();
        if (c.getMediaItemCount() == 0) {
            state = "idle";
        } else if (err != null) {
            state = "error";
            o.put("error", err.getErrorCodeName());
        } else if (c.isPlaying()) {
            state = "playing";
        } else if (c.getPlayWhenReady()
            && (c.getPlaybackState() == Player.STATE_BUFFERING || c.getPlaybackState() == Player.STATE_IDLE)) {
            state = "loading";
        } else {
            state = "paused";
        }
        o.put("state", state);
        MediaItem current = c.getCurrentMediaItem();
        o.put("id", current != null ? current.mediaId : null);
        return o;
    }

    private void emitState(boolean force) {
        if (controller == null) return;
        JSObject o = stateObject(controller);
        String key = o.toString();
        if (!force && key.equals(lastEmitted)) return;
        lastEmitted = key;
        notifyListeners("stateChange", o, true);
    }

    @Override
    protected void handleOnDestroy() {
        if (controllerFuture != null) MediaController.releaseFuture(controllerFuture);
        controllerFuture = null;
        controller = null;
        super.handleOnDestroy();
    }
}
