# FootballApp Mobil Sürüm

Bu proje Capacitor ile oluşturulmuş mobil versiyonudur.

## ⚙ Kurulum

\`\`\`bash
npm install
npx cap init
npm run build
npx cap copy
npx cap add android
npx cap open android
\`\`\`

## 🔑 API Anahtarı Yönetimi

Projenin kök dizininde bir `.env.local` dosyası oluşturun ve API anahtarınızı aşağıdaki gibi ekleyin:

\`\`\`bash
NEXT_PUBLIC_API_KEY=your_api_key_here
NEXT_PUBLIC_API_BASE_URL=https://apiv3.apifootball.com
\`\`\`

Bu, API anahtarınızı güvenli bir şekilde yönetmenizi sağlar ve kod içinde doğrudan görünmesini önler.

## 📢 AdMob Reklam Entegrasyonu

Cordova eklentisi olarak:

\`\`\`bash
npm install cordova-plugin-admob-free
npx cap sync android
\`\`\`

Koddan sonra şu şekilde çağırılır:

\`\`\`js
(window as any).admob.banner.config({
  id: 'YOUR_AD_UNIT_ID',
  isTesting: true,
  autoShow: true
});
(window as any).admob.banner.prepare();
\`\`\`

## 💳 Play Store Satın Alma

\`\`\`bash
npm install cordova-plugin-inapppurchase
npx cap sync android
\`\`\`

Kullanımı:

\`\`\`js
(window as any).inAppPurchase.buy('product_id')
  .then(data => console.log('Satın alındı', data))
  .catch(err => console.log('Hata', err));
\`\`\`

## 📦 APK Oluşturma

Android Studio ile açıp `Build -> Build Bundle(s) / APK(s)` adımlarını izleyin.

## 🌐 Çeviri Sistemi

Projede tüm kullanıcı arayüzü metinleri çeviri sistemi üzerinden yönetilmektedir. Türkçe metinleri doğrudan kodda kullanmak yerine, `t()` fonksiyonu ile çeviri anahtarlarını kullanın:

```js
import { useTranslation } from "@/components/language-provider";

function MyComponent() {
  const { t } = useTranslation();
  
  return <div>{t("noStatsFound")}</div>;
}
```

Yeni çeviri anahtarları `components/language-provider.tsx` dosyasında tanımlanmalıdır.
