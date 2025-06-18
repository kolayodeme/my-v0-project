# PocketBase Kurulumu ve Yapılandırması

Bu belge, Football App için PocketBase kurulumunu ve yapılandırmasını açıklar. PocketBase, kullanıcı yönetimi, üyelik sistemi ve kredi sistemi için backend olarak kullanılmaktadır.

## PocketBase Nedir?

PocketBase, tek bir çalıştırılabilir dosya olarak dağıtılan açık kaynaklı bir backend çözümüdür. SQLite veritabanı, otomatik API, dosya depolama ve kimlik doğrulama gibi özellikler sunar.

## Kurulum Adımları

### 1. PocketBase İndirme

PocketBase'in en son sürümünü [resmi web sitesinden](https://pocketbase.io/docs/) indirin.

```bash
# Linux/macOS için
curl -fsSL https://github.com/pocketbase/pocketbase/releases/download/v0.19.4/pocketbase_0.19.4_linux_amd64.zip -o pocketbase.zip
unzip pocketbase.zip
chmod +x pocketbase

# Windows için
# Resmi siteden zip dosyasını indirin ve çıkartın
```

### 2. PocketBase'i Çalıştırma

```bash
# Varsayılan port 8090
./pocketbase serve
```

İlk çalıştırmada, admin hesabı oluşturmanız istenecektir. Bu hesap, PocketBase yönetim paneline erişim için kullanılacaktır.

### 3. Admin Paneline Erişim

PocketBase çalıştıktan sonra, tarayıcınızda `http://127.0.0.1:8090/_/` adresine giderek admin paneline erişebilirsiniz.

### 4. Koleksiyonları Oluşturma

PocketBase admin panelinde, aşağıdaki koleksiyonları oluşturun:

#### Users Koleksiyonu

Bu koleksiyon otomatik olarak oluşturulur. Aşağıdaki özel alanları ekleyin:

| Alan Adı | Tip | Gerekli | Not |
|----------|-----|---------|-----|
| credits | Number | Evet | Varsayılan: 5 |
| isPro | Boolean | Evet | Varsayılan: false |
| proExpiryDate | Date | Hayır | |
| isAdmin | Boolean | Evet | Varsayılan: false |
| isActive | Boolean | Evet | Varsayılan: true |

#### Transactions Koleksiyonu

| Alan Adı | Tip | Gerekli | Not |
|----------|-----|---------|-----|
| userId | Relation (users) | Evet | |
| type | Text | Evet | CREDIT_PURCHASE, CREDIT_USE, PRO_PURCHASE, PRO_EXPIRED, ADMIN_CREDIT, PRO_ENABLED, PRO_DISABLED |
| amount | Number | Evet | |
| description | Text | Evet | |
| adminId | Relation (users) | Hayır | |
| created | Date | Evet | |

### 5. İzinleri Yapılandırma

Her koleksiyon için aşağıdaki izinleri yapılandırın:

#### Users Koleksiyonu

- Create: Herkes (kayıt için)
- View: Kimliği doğrulanmış kullanıcılar (kendi kayıtları) ve adminler (tüm kayıtlar)
- Update: Kimliği doğrulanmış kullanıcılar (kendi kayıtları) ve adminler (tüm kayıtlar)
- Delete: Adminler

#### Transactions Koleksiyonu

- Create: Adminler
- View: Kimliği doğrulanmış kullanıcılar (kendi işlemleri) ve adminler (tüm işlemler)
- Update: Adminler
- Delete: Adminler

### 6. Admin Kullanıcısı Oluşturma

1. Önce normal bir kullanıcı hesabı oluşturun
2. Admin panelinden bu kullanıcıyı bulun
3. `isAdmin` alanını `true` olarak ayarlayın

### 7. Ortam Değişkenlerini Yapılandırma

Projenizin kök dizininde `.env.local` dosyasını oluşturun ve aşağıdaki değişkenleri ekleyin:

```
NEXT_PUBLIC_POCKETBASE_URL=http://127.0.0.1:8090
```

Prodüksiyon ortamında, bu URL'yi gerçek PocketBase sunucunuzun URL'si ile değiştirin.

## Sunucuya Dağıtım

PocketBase'i bir VPS'ye dağıtmak için:

1. PocketBase dosyasını sunucuya yükleyin
2. Bir systemd servisi oluşturun (opsiyonel)
3. Bir reverse proxy yapılandırın (nginx veya caddy)
4. SSL sertifikası ekleyin

Örnek systemd servis dosyası:

```ini
[Unit]
Description=PocketBase
After=network.target

[Service]
Type=simple
User=pocketbase
Group=pocketbase
WorkingDirectory=/opt/pocketbase
ExecStart=/opt/pocketbase/pocketbase serve
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

## Uygulama Entegrasyonu

Uygulama, `lib/pocketbase-config.ts` dosyasındaki yapılandırmayı kullanarak PocketBase'e bağlanır. Ortam değişkeninizi doğru şekilde ayarladığınızdan emin olun.

## Sorun Giderme

- **Bağlantı Hatası**: PocketBase'in çalıştığından ve doğru URL'nin yapılandırıldığından emin olun
- **Yetkilendirme Hatası**: Koleksiyon izinlerini kontrol edin
- **API Hatası**: PocketBase loglarını inceleyin

## Veri Yedekleme

PocketBase veritabanını düzenli olarak yedeklemek için:

```bash
# Manuel yedekleme
./pocketbase backup data.db

# Otomatik yedekleme için bir cron görevi oluşturun
```

## Güvenlik Notları

- Güçlü admin şifreleri kullanın
- Prodüksiyonda her zaman HTTPS kullanın
- Düzenli olarak yedekleme alın
- Güvenlik duvarını yapılandırın
- PocketBase'i düzenli olarak güncelleyin

## Kaynaklar

- [PocketBase Resmi Dokümantasyon](https://pocketbase.io/docs/)
- [PocketBase GitHub Deposu](https://github.com/pocketbase/pocketbase)