package com.example.footballapp;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.widget.Toast;

import org.json.JSONException;
import org.json.JSONObject;

/**
 * WebView ile JavaScript ve Java arasında iletişim sağlayan sınıf
 */
public class JavaScriptInterface {
    private Context context;
    private MainActivity mainActivity;
    private static final String TAG = "JavaScriptInterface";

    public JavaScriptInterface(Context context, MainActivity activity) {
        this.context = context;
        this.mainActivity = activity;
    }

    /**
     * JavaScript'ten gelen mesajları alır ve işler
     * @param message JSON formatında mesaj
     */
    @JavascriptInterface
    public void receiveMessage(String message) {
        try {
            JSONObject jsonMessage = new JSONObject(message);
            String type = jsonMessage.getString("type");
            
            Log.d(TAG, "JavaScript'ten mesaj alındı: " + type);
            
            switch (type) {
                case "openBrowser":
                    openBrowser(jsonMessage.getString("url"));
                    break;
                case "share":
                    shareContent(jsonMessage.getString("title"), jsonMessage.getString("text"));
                    break;
                case "showAd":
                    mainActivity.showAd();
                    break;
                case "login":
                    // Giriş işlemi burada yapılacak
                    break;
                case "logout":
                    // Çıkış işlemi burada yapılacak
                    break;
                case "error":
                    String errorMessage = jsonMessage.getString("message");
                    Log.e(TAG, "JavaScript hatası: " + errorMessage);
                    break;
                default:
                    Log.w(TAG, "Bilinmeyen mesaj tipi: " + type);
                    break;
            }
        } catch (JSONException e) {
            Log.e(TAG, "JSON ayrıştırma hatası: " + e.getMessage());
        }
    }

    /**
     * Java'dan JavaScript'e mesaj gönderir
     * @param type Mesaj tipi
     * @param data JSON formatında veri
     */
    public void sendMessage(final String type, final JSONObject data) {
        try {
            JSONObject message = new JSONObject();
            message.put("type", type);
            
            // Ek verileri ekle
            if (data != null) {
                for (String key : data.keySet()) {
                    message.put(key, data.get(key));
                }
            }
            
            final String messageStr = message.toString();
            
            // UI thread'inde WebView'a JavaScript çağrısı yap
            mainActivity.runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    mainActivity.evaluateJavaScript("window.androidInterface.receiveMessage('" + messageStr + "')");
                }
            });
            
        } catch (JSONException e) {
            Log.e(TAG, "JSON oluşturma hatası: " + e.getMessage());
        }
    }

    /**
     * Tarayıcıda URL açar
     * @param url Açılacak URL
     */
    @JavascriptInterface
    public void openBrowser(String url) {
        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
        context.startActivity(intent);
    }

    /**
     * İçerik paylaşım diyaloğunu açar
     * @param title Paylaşım başlığı
     * @param text Paylaşılacak metin
     */
    @JavascriptInterface
    public void shareContent(String title, String text) {
        Intent intent = new Intent(Intent.ACTION_SEND);
        intent.setType("text/plain");
        intent.putExtra(Intent.EXTRA_SUBJECT, title);
        intent.putExtra(Intent.EXTRA_TEXT, text);
        context.startActivity(Intent.createChooser(intent, "Paylaş"));
    }

    /**
     * Toast mesajı gösterir
     * @param message Gösterilecek mesaj
     */
    @JavascriptInterface
    public void showToast(final String message) {
        mainActivity.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                Toast.makeText(context, message, Toast.LENGTH_SHORT).show();
            }
        });
    }
} 