# AdMob Integration Guide for Capacitor

This guide provides a comprehensive walkthrough for integrating Google AdMob into your Capacitor-based mobile application.

## Table of Contents
1. [Installation](#1-installation)
2. [Configuration](#2-configuration)
3. [Android Setup](#3-android-setup)
4. [iOS Setup](#4-ios-setup)
5. [AdMob Service](#5-admob-service)
6. [React Components](#6-react-components)
7. [Usage Examples](#7-usage-examples)
8. [Troubleshooting](#8-troubleshooting)
9. [Best Practices](#9-best-practices)

## 1. Installation

Install the required packages:

```bash
npm install @capacitor-community/admob
# or
yarn add @capacitor-community/admob
```

## 2. Configuration

Update your `capacitor.config.json` file to include AdMob configuration:

```json
{
  "plugins": {
    "AdMob": {
      "appId": "ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX",
      "testingDevices": ["DEVICE_ID_HERE"],
      "initializeForTesting": true,
      "bannerAdId": "ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX",
      "interstitialAdId": "ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX",
      "rewardedAdId": "ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX"
    }
  }
}
```

For testing, you can use these test ad unit IDs:

- **Android Banner**: `ca-app-pub-3940256099942544/6300978111`
- **Android Interstitial**: `ca-app-pub-3940256099942544/1033173712`
- **Android Rewarded**: `ca-app-pub-3940256099942544/5224354917`
- **iOS Banner**: `ca-app-pub-3940256099942544/2934735716`
- **iOS Interstitial**: `ca-app-pub-3940256099942544/4411468910`
- **iOS Rewarded**: `ca-app-pub-3940256099942544/1712485313`

## 3. Android Setup

### 3.1. Update strings.xml

Add your AdMob App ID to `android/app/src/main/res/values/strings.xml`:

```xml
<resources>
    <!-- ... other strings ... -->
    <string name="admob_app_id">ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX</string>
</resources>
```

### 3.2. Update AndroidManifest.xml

Add the metadata tag to `android/app/src/main/AndroidManifest.xml` inside the `<application>` tag:

```xml
<meta-data
    android:name="com.google.android.gms.ads.APPLICATION_ID"
    android:value="@string/admob_app_id" />
```

### 3.3. Update MainActivity.java

Register the AdMob plugin in `android/app/src/main/java/com/example/app/MainActivity.java`:

```java
package com.example.app;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;
import com.getcapacitor.community.admob.AdMob;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Register plugins
        registerPlugin(AdMob.class);
    }
}
```

### 3.4. Update build.gradle

Set Java compatibility in `android/app/build.gradle`:

```gradle
android {
    // ... other settings ...
    
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }
}
```

## 4. iOS Setup

### 4.1. Update Info.plist

Add the following to your `ios/App/App/Info.plist`:

```xml
<key>GADApplicationIdentifier</key>
<string>ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX</string>
<key>SKAdNetworkItems</key>
<array>
  <dict>
    <key>SKAdNetworkIdentifier</key>
    <string>cstr6suwn9.skadnetwork</string>
  </dict>
</array>
```

### 4.2. Update AppDelegate.swift

Initialize AdMob in `ios/App/App/AppDelegate.swift`:

```swift
import UIKit
import Capacitor
import GoogleMobileAds

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {
    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Initialize Google Mobile Ads SDK
        GADMobileAds.sharedInstance().start(completionHandler: nil)
        
        return true
    }
    
    // ... rest of AppDelegate ...
}
```

## 5. AdMob Service

Create a service file to handle AdMob functionality:

```typescript
// lib/admob-service.ts
import { AdMob, BannerAdOptions, BannerAdPosition, BannerAdSize } from '@capacitor-community/admob';

interface AdIdMap {
  android: string;
  ios: string;
  [key: string]: string;
}

// Ad IDs for different platforms
const TEST_BANNER_ID: AdIdMap = { /* ... */ };
const TEST_INTERSTITIAL_ID: AdIdMap = { /* ... */ };
const TEST_REWARDED_ID: AdIdMap = { /* ... */ };

class AdMobService {
  private isInitialized = false;
  private isTesting = process.env.NODE_ENV !== 'production';
  
  // Initialize AdMob
  async initialize() { /* ... */ }
  
  // Get current platform
  getPlatform(): 'android' | 'ios' { /* ... */ }
  
  // Banner methods
  async showBannerAd(position: BannerAdPosition) { /* ... */ }
  async hideBannerAd() { /* ... */ }
  async removeBannerAd() { /* ... */ }
  
  // Interstitial methods
  async showInterstitialAd() { /* ... */ }
  
  // Rewarded methods
  async showRewardedAd() { /* ... */ }
}

export const adMobService = new AdMobService();
```

## 6. React Components

Create reusable components for different ad types:

### 6.1. Banner Component

```tsx
// components/ui/AdMobBanner.tsx
import { BannerAdPosition } from '@capacitor-community/admob';
import { adMobService } from '@/lib/admob-service';

export function AdMobBanner({ position = BannerAdPosition.BOTTOM_CENTER }) {
  // Implementation...
}
```

### 6.2. Interstitial Component

```tsx
// components/ui/AdMobInterstitial.tsx
import { adMobService } from '@/lib/admob-service';

export function AdMobInterstitial({ triggerOn = 'mount', onAdDismissed, onAdFailed }) {
  // Implementation...
}
```

### 6.3. Reward Button Component

```tsx
// components/ui/AdMobRewardButton.tsx
import { adMobService } from '@/lib/admob-service';

export function AdMobRewardButton({ onReward, onFail, children }) {
  // Implementation...
}
```

### 6.4. Custom Hook

```tsx
// hooks/useAdMob.ts
import { AdMob, BannerAdPosition } from '@capacitor-community/admob';

export function useAdMob({ initializeOnMount = true, showBannerOnMount = false }) {
  // Implementation...
}
```

## 7. Usage Examples

```tsx
// Example usage in a component
import { AdMobBanner, AdMobRewardButton, AdMobInterstitial } from '@/components/ui';
import { useAdMob } from '@/hooks/useAdMob';
import { BannerAdPosition } from '@capacitor-community/admob';

function MyComponent() {
  const { showBanner, hideBanner } = useAdMob({ initializeOnMount: true });
  
  // Show banner ad
  const handleShowBanner = () => {
    showBanner(BannerAdPosition.BOTTOM_CENTER);
  };
  
  // Show reward ad
  return (
    <div>
      <button onClick={handleShowBanner}>Show Banner</button>
      
      <AdMobRewardButton 
        onReward={() => console.log('User earned reward')}
        onFail={() => console.log('Reward ad failed')}
      >
        Watch Ad for Reward
      </AdMobRewardButton>
      
      <AdMobInterstitial 
        triggerOn="mount" 
        onAdDismissed={() => console.log('Ad dismissed')}
      />
    </div>
  );
}
```

## 8. Troubleshooting

### Ads Not Showing in APK

If ads work in development but not in the APK:

1. **Check AdMob App ID**: Ensure the correct App ID is in both `strings.xml` and `AndroidManifest.xml`.

2. **Verify Ad Unit IDs**: Make sure you're using the correct platform-specific ad unit IDs.

3. **Test Device Registration**: Verify your test device is properly registered.

4. **Production vs Testing Mode**: Check if `isTesting` flag is correctly set for production.

5. **Platform Detection**: Ensure platform detection is working correctly.

6. **Java Version**: Make sure your app is compiled with Java 11 or higher.

7. **Clean Build**: Try a clean build:
   ```bash
   cd android
   ./gradlew clean
   ./gradlew build
   ```

8. **Check Logs**: Use Android Studio's Logcat to check for AdMob-related errors.

9. **AdMob Console**: Verify in the AdMob console that your app is properly set up.

10. **Wait for Approval**: New AdMob accounts may need time for approval.

## 9. Best Practices

1. **Use Test Ads During Development**: Always use test ad unit IDs during development.

2. **Handle Ad Loading Failures**: Always handle cases where ads fail to load.

3. **Respect User Experience**: Don't overload your app with too many ads.

4. **Platform-Specific IDs**: Use different ad unit IDs for Android and iOS.

5. **Initialize Once**: Initialize the AdMob SDK once at app startup.

6. **Clean Up**: Remove banner ads when components unmount.

7. **Comply with Policies**: Ensure your app complies with Google AdMob policies.

8. **Test on Real Devices**: Always test on real devices before releasing.

9. **Monitor Performance**: Monitor how ads affect your app's performance.

10. **Update SDK**: Keep the AdMob SDK updated to the latest version. 