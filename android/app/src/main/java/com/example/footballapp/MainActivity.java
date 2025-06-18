package com.example.footballapp;

import androidx.appcompat.app.AppCompatActivity;
import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebSettings;
import android.webkit.WebChromeClient;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.content.Context;
import android.view.View;
import android.widget.Button;
import android.widget.LinearLayout;
import android.util.Log;
import android.widget.Toast;
import android.os.Build;
import android.content.Intent;
import android.net.Uri;

import org.json.JSONException;
import org.json.JSONObject;

public class MainActivity extends AppCompatActivity {
    
    private static final String TAG = "MainActivity";
    private WebView webView;
    private LinearLayout noInternetLayout;
    private Button retryButton;
    private JavaScriptInterface jsInterface;
    
    // Web sitenizin domain adresi
    private static final String WEB_DOMAIN = "https://footballapp.com";
    
    // Eğer henüz aktif bir domaininiz yoksa, assets klasöründeki HTML'i kullanabilirsiniz
    private static final boolean USE_LOCAL_HTML = true;
    
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        
        webView = findViewById(R.id.webView);
        noInternetLayout = findViewById(R.id.noInternetLayout);
        retryButton = findViewById(R.id.retryButton);
        
        setupWebView();
        
        retryButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                checkInternetAndLoadWebsite();
            }
        });
        
        // Uygulama bir link ile açıldıysa, URL'i kontrol et
        Intent intent = getIntent();
        if (Intent.ACTION_VIEW.equals(intent.getAction())) {
            Uri uri = intent.getData();
            if (uri != null) {
                handleDeepLink(uri);
            }
        }
        
        checkInternetAndLoadWebsite();
    }
    
    private void setupWebView() {
        WebSettings webSettings = webView.getSettings();
        
        // JavaScript'i etkinleştir
        webSettings.setJavaScriptEnabled(true);
        
        // DOM storage etkinleştir (localStorage için)
        webSettings.setDomStorageEnabled(true);
        
        // Dosya erişimini etkinleştir
        webSettings.setAllowFileAccess(true);
        webSettings.setAllowContentAccess(true);
        
        // Karışık içeriğe izin ver (HTTP içeriğine HTTPS sayfalarından)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            webSettings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        }
        
        // Önbelleği etkinleştir
        webSettings.setAppCacheEnabled(true);
        webSettings.setCacheMode(WebSettings.LOAD_DEFAULT);
        
        // Zoom kontrollerini devre dışı bırak
        webSettings.setSupportZoom(false);
        webSettings.setBuiltInZoomControls(false);
        
        // WebView istemcisini ayarla
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                Log.d(TAG, "Sayfa yüklendi: " + url);
            }
            
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                // Kendi domain'imize ait linkler için WebView içinde aç
                if (url.startsWith("file:///") || url.startsWith(WEB_DOMAIN)) {
                    return false;
                } else {
                    // Harici linkleri sistem tarayıcısında aç
                    jsInterface.openBrowser(url);
                    return true;
                }
            }
        });
        
        // WebChromeClient ile JavaScript konsolunu ve uyarıları yönet
        webView.setWebChromeClient(new WebChromeClient());
        
        // JavaScript arayüzünü oluştur ve ekle
        jsInterface = new JavaScriptInterface(this, this);
        webView.addJavascriptInterface(jsInterface, "Android");
    }
    
    /**
     * JavaScript'ten gelen hata ve loglara erişim için
     */
    public void evaluateJavaScript(final String script) {
        if (webView != null) {
            webView.post(new Runnable() {
                @Override
                public void run() {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                        webView.evaluateJavascript(script, null);
                    } else {
                        webView.loadUrl("javascript:" + script);
                    }
                }
            });
        }
    }
    
    /**
     * Deep link ile açıldığında parametreleri işle
     */
    private void handleDeepLink(Uri uri) {
        try {
            // Örnek: footballapp.com/match/123 gibi bir link ile açıldığında
            // /match/123 kısmını alıp JavaScript'e iletebiliriz
            String path = uri.getPath();
            if (path != null && !path.isEmpty()) {
                // Sayfayı yükledikten sonra router'a yönlendirmek için JavaScript çalıştır
                final String navigateScript = "if(window.router) { router.navigateTo('" + 
                                             path.substring(1) + "'); }";
                
                // WebView hazır olduğunda JavaScript çalıştır
                webView.setWebViewClient(new WebViewClient() {
                    @Override
                    public void onPageFinished(WebView view, String url) {
                        super.onPageFinished(view, url);
                        evaluateJavaScript(navigateScript);
                    }
                });
            }
        } catch (Exception e) {
            Log.e(TAG, "Deep link işleme hatası: " + e.getMessage());
        }
    }
    
    private void checkInternetAndLoadWebsite() {
        if (isInternetAvailable()) {
            noInternetLayout.setVisibility(View.GONE);
            webView.setVisibility(View.VISIBLE);
            
            if (USE_LOCAL_HTML) {
                // Yerel HTML dosyasını yükle
                webView.loadUrl("file:///android_asset/www/index.html");
            } else {
                // Canlı web sitesini yükle
                webView.loadUrl(WEB_DOMAIN);
            }
        } else {
            webView.setVisibility(View.GONE);
            noInternetLayout.setVisibility(View.VISIBLE);
        }
    }
    
    private boolean isInternetAvailable() {
        ConnectivityManager connectivityManager = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
        if (connectivityManager != null) {
            NetworkInfo activeNetworkInfo = connectivityManager.getActiveNetworkInfo();
            return activeNetworkInfo != null && activeNetworkInfo.isConnected();
        }
        return false;
    }
    
    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
    
    /**
     * JavaScript'ten çağrılabilecek reklam gösterme metodu
     */
    public void showAd() {
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                Toast.makeText(MainActivity.this, "Reklam gösteriliyor (simülasyon)", Toast.LENGTH_SHORT).show();
                
                // Gerçek uygulamada burada AdMob reklamı gösterilecek
                try {
                    // Reklam gösterildikten sonra JavaScript'e bildir
                    JSONObject data = new JSONObject();
                    data.put("success", true);
                    jsInterface.sendMessage("adCompleted", data);
                } catch (JSONException e) {
                    Log.e(TAG, "JSON oluşturma hatası: " + e.getMessage());
                }
            }
        });
    }
    
    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        
        // Uygulama zaten açıkken bir link ile çağrıldığında
        if (Intent.ACTION_VIEW.equals(intent.getAction())) {
            Uri uri = intent.getData();
            if (uri != null) {
                handleDeepLink(uri);
            }
        }
    }
    
    @Override
    protected void onResume() {
        super.onResume();
        // Aktivite geri döndüğünde internet bağlantısını kontrol et
        checkInternetAndLoadWebsite();
    }
}
