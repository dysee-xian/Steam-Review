# Dokumentasi Pengembangan Aplikasi Steam Review

> Dokumen acuan untuk pengembangan aplikasi melalui Visual Studio Code
> dan GitHub Copilot.\
> Copilot harus membaca dokumen ini sebelum mengubah atau membuat kode.

## 1. Gambaran Umum Proyek

**Nama aplikasi:** Steam Review\
**Tujuan:** Membangun aplikasi web dashboard untuk menyajikan hasil
pengolahan dataset Steam Reviews, terutama ringkasan persona pemain dan
distribusi sentimen yang telah disimpan di Firebase Cloud Firestore.

Aplikasi dikembangkan secara bertahap. Prioritas saat ini adalah
menampilkan data yang memang sudah tersedia di Firestore. Jangan membuat
fitur seolah-olah sudah memiliki data apabila proses analisis atau
ekspornya belum tersedia.

### 1.1 Teknologi yang digunakan

  -----------------------------------------------------------------------
  Bagian                  Teknologi               Tanggung jawab
  ----------------------- ----------------------- -----------------------
  Frontend                React                   Komponen dan antarmuka
                                                  aplikasi

  Development server dan  Vite                    Menjalankan aplikasi
  bundler                                         selama pengembangan

  Bahasa frontend         JavaScript / JSX        Logika dan tampilan
                                                  React

  Database                Firebase Cloud          Menyimpan ringkasan
                          Firestore               dashboard dan persona

  SDK frontend            Firebase JavaScript SDK Membaca data Firestore
                                                  dari React

  Analisis data           Python, Pandas, NumPy,  Pembersihan dan
                          DuckDB                  analisis dataset

  Clustering              scikit-learn,           Membentuk empat
                          MiniBatchKMeans         kelompok persona

  Visualisasi dashboard   Library grafik React    Menampilkan grafik dari
                          (pilih dan pasang bila  data Firestore
                          diperlukan)             
  -----------------------------------------------------------------------

**Backend FastAPI/Python:** folder `backend/` sudah tersedia pada
proyek, tetapi belum menjadi jalur utama untuk pembacaan dashboard saat
ini. Jangan menambahkan ketergantungan FastAPI jika kebutuhan dapat
dipenuhi oleh pembacaan Firestore dari frontend.

### 1.2 Arsitektur data saat ini

``` text
Dataset Steam Reviews (Kaggle)
        |
        v
Notebook Python (steam-review.ipynb)
        |
        +--> Data cleaning dan EDA
        |
        +--> Profil pemain dan clustering persona
        |
        +--> Ringkasan persona dan data grafik
        |
        v
Firebase Admin SDK dari Kaggle
        |
        v
Cloud Firestore
        |
        +--> dashboard_summaries/persona_dashboard
        |
        +--> personas/cluster_0 ... cluster_3
        |
        v
Firebase JavaScript SDK
        |
        v
React + Vite
        |
        v
Dashboard Steam Review
```

Notebook yang menjadi sumber analisis saat ini adalah
`steam-review.ipynb`. Notebook tersebut diunggah bersama permintaan
pembuatan dokumentasi ini. Jangan menganggap semua tahap penelitian di
notebook sudah menjadi fitur aplikasi.

## 2. Kondisi Implementasi Saat Ini

### 2.1 Yang sudah berhasil

-   Project React + Vite dapat dijalankan menggunakan `npm run dev`.
-   Firebase JavaScript SDK sudah terpasang dan dapat diinisialisasi.
-   Project Firebase yang terbaca adalah `steam-review-89fe1`.
-   Frontend sudah berhasil terhubung ke Cloud Firestore.
-   Frontend berhasil membaca dokumen
    `dashboard_summaries/persona_dashboard`.
-   Frontend berhasil membaca empat dokumen dalam koleksi `personas`.
-   Pengujian pembacaan data dilakukan melalui
    `src/services/testFirebase.js`.

### 2.2 File frontend yang sudah diketahui

``` text
steam-review/
├── public/
│   └── images/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Navbar.jsx
│   │   │   └── MainLayout.jsx
│   │   └── dashboard/
│   ├── services/
│   │   ├── firebase.js
│   │   └── testFirebase.js
│   └── App.jsx
├── backend/
├── .env
├── .env.local
├── .gitignore
└── package.json
```

Struktur di atas merupakan gambaran file yang telah diketahui dari
pengerjaan sebelumnya, bukan jaminan bahwa seluruh file tersebut sudah
dibuat. **Periksa struktur aktual di VS Code sebelum membuat file
baru.** Jangan membuat file atau folder duplikat jika komponen sejenis
sudah tersedia.

### 2.3 Cara menjalankan aplikasi

Jalankan perintah dari folder root proyek `D:\Big data\Steam_Review`.

``` powershell
npm run dev
```

Jika terminal PowerShell yang baru tidak mengenali `npm` karena
inisialisasi FNM belum berjalan, jalankan:

``` powershell
fnm env --use-on-cd --shell powershell | Out-String | Invoke-Expression
fnm use 26
node -v
npm -v
npm run dev
```

Buka alamat lokal yang ditampilkan Vite, biasanya
`http://localhost:5173/`.

## 3. Konfigurasi Firebase

### 3.1 File konfigurasi

Lokasi: `src/services/firebase.js`

Konfigurasi frontend menggunakan variabel lingkungan Vite dengan awalan
`VITE_`.

Contoh struktur file:

``` javascript
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

console.log("Firebase Project:", app.options.projectId);
```

### 3.2 Variabel lingkungan

Simpan konfigurasi Firebase frontend pada `.env.local`, dengan nama
variabel berikut:

``` env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=steam-review-89fe1
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

Ketentuan keamanan:

-   Jangan menuliskan API key atau konfigurasi rahasia secara langsung
    di komponen React.
-   Jangan pernah menaruh Firebase Service Account JSON atau private key
    di frontend, file `VITE_`, atau repository publik.
-   `.env.local` harus masuk `.gitignore`.
-   Firebase Web API key bukan pengganti Firestore Security Rules.
    Keamanan data harus ditentukan melalui Rules dan, jika diperlukan,
    Firebase Authentication.
-   Jika file `.env.local` berubah, restart Vite agar variabel baru
    dibaca.

## 4. Struktur Cloud Firestore

Project Firestore: `steam-review-89fe1`

Saat ini aplikasi menggunakan dua koleksi berikut.

### 4.1 Koleksi `dashboard_summaries`

Dokumen yang digunakan:

`dashboard_summaries/persona_dashboard`

Field dokumen:

  -----------------------------------------------------------------------
  Field                   Tipe                    Keterangan
  ----------------------- ----------------------- -----------------------
  `grafik_distribusi`     Map/Object              Data jumlah pemain
                                                  untuk setiap cluster

  `grafik_sentimen`       Map/Object              Data persentase
                                                  sentimen per cluster

  `jumlah_persona`        Number                  Jumlah persona, saat
                                                  ini 4

  `sumber`                String                  Sumber data, saat ini
                                                  `Steam Review Kaggle`
  -----------------------------------------------------------------------

Struktur `grafik_distribusi`:

``` json
{
  "cluster": [0, 1, 2, 3],
  "jumlah_pemain": [198312, 187360, 68246, 46082]
}
```

Angka di atas merupakan contoh nilai yang tampak pada data yang telah
diperiksa. Saat implementasi, **baca nilai aktual dari Firestore**,
jangan menanam angka contoh sebagai data permanen.

Struktur `grafik_sentimen`:

``` json
{
  "cluster": [0, 1, 2, 3],
  "positif": [0, 0, 0, 0],
  "negatif": [0, 0, 0, 0]
}
```

Array `positif` dan `negatif` berisi persentase sentimen untuk cluster
yang bersesuaian. Nilai nol pada contoh di atas hanya placeholder bentuk
struktur, bukan hasil analisis. Jangan gunakan placeholder tersebut
sebagai data tampilan.

### 4.2 Koleksi `personas`

Koleksi ini berisi empat dokumen:

-   `personas/cluster_0`
-   `personas/cluster_1`
-   `personas/cluster_2`
-   `personas/cluster_3`

Field persona yang dihasilkan notebook:

  --------------------------------------------------------------------------
  Field                      Tipe                    Keterangan
  -------------------------- ----------------------- -----------------------
  `cluster`                  Number                  Nomor cluster

  `nama_persona`             String                  Nama persona

  `jumlah_pemain`            Number                  Jumlah pemain dalam
                                                     cluster

  `median_review`            Number                  Median jumlah review
                                                     pemain

  `median_playtime_review`   Number                  Median rata-rata
                                                     playtime saat review,
                                                     dalam menit

  `median_playtime_total`    Number                  Median rata-rata total
                                                     playtime, dalam menit

  `persentase_positif`       Number                  Persentase sentimen
                                                     positif

  `persentase_negatif`       Number                  Persentase sentimen
                                                     negatif
  --------------------------------------------------------------------------

Nama persona yang digunakan:

  ID dokumen    Nama persona
  ------------- -------------------------------
  `cluster_0`   Casual Positive Player
  `cluster_1`   High Playtime Positive Player
  `cluster_2`   Negative Response Player
  `cluster_3`   Active Reviewer Player

Catatan: dokumen aktual dapat memiliki variasi field tambahan atau nilai
yang belum tersedia. Gunakan hasil pembacaan Firestore sebagai sumber
kebenaran. Jika field tidak ada, tangani dengan aman di UI; jangan
mengarang nilai.

### 4.3 Hubungan data untuk grafik

-   Grafik distribusi: gunakan
    `dashboard_summaries/persona_dashboard.grafik_distribusi.cluster`
    sebagai label sumbu kategori dan `jumlah_pemain` sebagai nilai.
-   Grafik sentimen: gunakan `grafik_sentimen.cluster` sebagai label
    kategori, `positif` sebagai seri positif, dan `negatif` sebagai seri
    negatif.
-   Kartu jumlah persona: gunakan `jumlah_persona`.
-   Kartu atau tabel profil persona: gunakan dokumen-dokumen dari
    koleksi `personas`.

Pastikan urutan array tetap sejajar. Elemen pada indeks yang sama
mewakili cluster yang sama.

## 5. Firestore Security Rules

Rules yang digunakan pada tahap pengujian saat ini:

``` javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    match /dashboard_summaries/{document} {
      allow read: if true;
      allow write: if false;
    }

    match /personas/{document} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

Aturan tersebut membuat dua koleksi dapat dibaca publik dan tidak dapat
ditulis melalui client. Aturan ini hanya boleh dipakai jika isi kedua
koleksi memang layak menjadi data publik. Sebelum aplikasi dipakai
secara luas atau menyimpan data sensitif, evaluasi kembali aturan dan
gunakan autentikasi serta pembatasan akses yang sesuai.

Jangan mengganti Rules dengan `allow read, write: if true` sebagai
solusi cepat. Jangan membuka akses tulis dari frontend jika tidak ada
kebutuhan yang jelas.

## 6. Rekomendasi Struktur Kode Frontend

Gunakan struktur aktual yang sudah ada. Struktur target yang disarankan:

``` text
src/
├── assets/
├── components/
│   ├── layout/
│   │   ├── Sidebar.jsx
│   │   ├── Navbar.jsx
│   │   └── MainLayout.jsx
│   ├── dashboard/
│   │   ├── StatCard.jsx
│   │   ├── PersonaDistributionChart.jsx
│   │   ├── SentimentChart.jsx
│   │   └── PersonaCard.jsx
│   └── common/
│       ├── LoadingState.jsx
│       └── ErrorState.jsx
├── pages/
│   ├── Dashboard.jsx
│   └── Personas.jsx
├── services/
│   ├── firebase.js
│   ├── dashboardService.js
│   └── personaService.js
├── App.jsx
└── main.jsx
```

Jangan membuat seluruh struktur sekaligus jika belum dibutuhkan.
Implementasikan per bagian dan manfaatkan kembali komponen yang sudah
ada.

### 6.1 Tanggung jawab service

`src/services/firebase.js` - Inisialisasi Firebase satu kali. -
Mengekspor instance Firestore dengan nama `db`.

`src/services/dashboardService.js` - Mengambil dokumen
`dashboard_summaries/persona_dashboard` dengan `getDoc()`. Fungsi
`getDashboardSummary()` mengembalikan field dokumen apa adanya dan
melempar error yang jelas jika dokumen tidak ditemukan atau pembacaan
gagal.

`src/services/personaService.js` - Mengambil seluruh dokumen dari
koleksi `personas` dengan `getDocs()`. Fungsi `getPersonas()`
mengembalikan array berisi field setiap dokumen beserta `id` dokumen;
jika koleksi kosong, hasilnya array kosong. Kegagalan pembacaan
dilemparkan sebagai error yang jelas.

Komponen React tidak boleh berisi query Firestore berulang-ulang.
Pisahkan akses data di folder `services/`.

Contoh pola service dashboard:

``` javascript
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

export async function getDashboardSummary() {
  const ref = doc(db, "dashboard_summaries", "persona_dashboard");
  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) {
    throw new Error("Dokumen dashboard_summaries/persona_dashboard tidak ditemukan.");
  }

  return snapshot.data();
}
```

Contoh pola service persona:

``` javascript
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";

export async function getPersonas() {
  const snapshot = await getDocs(collection(db, "personas"));

  return snapshot.docs
    .map((item) => ({
      id: item.id,
      ...item.data()
    }))
    .sort((a, b) => Number(a.cluster) - Number(b.cluster));
}
```

### 6.2 Tanggung jawab halaman Dashboard

Halaman Dashboard bertugas: - Memanggil service untuk mengambil
ringkasan dashboard dan data persona. - Menampilkan status loading
ketika data sedang dimuat. - Menampilkan pesan error yang jelas jika
Firestore gagal diakses. - Menampilkan kartu statistik. - Menampilkan
grafik distribusi pemain per persona. - Menampilkan grafik sentimen
positif dan negatif per persona. - Menampilkan ringkasan empat persona.

Jangan menulis data dummy sebagai fallback yang seolah-olah data asli.
Jika data belum tersedia, tampilkan empty state atau pesan yang
menjelaskan data belum tersedia.

### 6.3 Tanggung jawab halaman Personas

Halaman Personas bertugas menampilkan detail empat persona berdasarkan
dokumen Firestore. Setiap kartu atau baris persona dapat menampilkan: -
Nama persona. - Cluster. - Jumlah pemain. - Median jumlah review. -
Median playtime saat review. - Median total playtime. - Persentase
sentimen positif. - Persentase sentimen negatif.

Format waktu bermain dari Firestore adalah menit. Jika ingin menampilkan
jam, konversikan menit menjadi jam hanya pada lapisan tampilan. Jangan
mengubah nilai asli yang disimpan di Firestore.

## 7. Rancangan Halaman Aplikasi

### 7.1 Dashboard

Komponen informasi yang disarankan:

1.  **Total Persona** --- berasal dari `jumlah_persona`.
2.  **Total Pemain Terklaster** --- jumlahkan `jumlah_pemain` dari empat
    persona, atau gunakan array distribusi yang tersedia. Pastikan tidak
    menghitung ganda.
3.  **Grafik Distribusi Persona** --- membandingkan jumlah pemain pada
    cluster 0 sampai 3.
4.  **Grafik Sentimen Persona** --- membandingkan persentase positif dan
    negatif pada setiap cluster.
5.  **Ringkasan Persona** --- empat kartu singkat berisi nama, jumlah
    pemain, dan sentimen dominan.

Jika total pemain dihitung dari dokumen persona, pastikan semua empat
dokumen berhasil diambil. Tampilkan sumber data dan waktu pembaruan
hanya jika timestamp pembaruan memang tersedia.

### 7.2 Halaman Persona

Tampilkan empat kelompok persona dalam urutan cluster 0, 1, 2, dan 3.
Gunakan nama persona yang berasal dari Firestore, bukan hardcode nama
untuk menggantikan nilai database. Nama persona dapat digunakan sebagai
fallback label hanya jika dokumen benar-benar tidak memiliki
`nama_persona`, dan fallback tersebut harus terlihat sebagai fallback.

### 7.3 Navigasi

Gunakan komponen layout yang sudah ada, yaitu Sidebar, Navbar, dan
MainLayout jika file tersebut tersedia. Jangan mengganti desain atau
struktur navigasi yang sudah dibuat tanpa memeriksa implementasinya
terlebih dahulu.

## 8. Panduan Visual dan UX

Arah desain aplikasi: - Dashboard analitik yang rapi, modern, dan mudah
dibaca. - Gunakan hierarki visual yang jelas: judul halaman, kartu
statistik, grafik, lalu ringkasan. - Gunakan warna sentimen secara
konsisten: positif dan negatif harus mudah dibedakan. - Gunakan label
cluster dan nama persona yang jelas. - Angka besar gunakan pemisah
ribuan agar mudah dibaca. - Persentase tampilkan maksimal dua angka
desimal bila diperlukan. - Durasi playtime tampilkan dalam menit atau
konversi ke jam dengan label satuan yang jelas. - Desain harus responsif
untuk desktop dan layar yang lebih kecil. - Hindari dekorasi berlebihan
yang mengurangi keterbacaan grafik.

Jangan mengubah tema, warna utama, atau layout global yang sudah ada
tanpa memeriksa file CSS dan komponen saat ini.

## 9. Catatan Penting dari Notebook Analisis

Bagian ini penting agar Copilot tidak salah menganggap tahapan
penelitian sudah selesai atau tersedia di aplikasi.

### 9.1 Dataset dan pembersihan

Notebook menggunakan dataset Steam Reviews dari Kaggle dan DuckDB untuk
memproses CSV berukuran besar. Tahap yang telah dicatat di notebook
meliputi: - Pemeriksaan struktur dan tipe data. - Pemeriksaan missing
values. - Pemeriksaan duplikasi. - Penghapusan 295 baris duplikat. -
Penanganan 581 nilai ekstrem `votes_funny` dengan mengubahnya menjadi
`NULL`. - Analisis distribusi sentimen dan playtime.

Hasil EDA di notebook mencatat 13.424.036 ulasan positif (86,96%) dan
2.013.140 ulasan negatif (13,04%). Angka ini adalah hasil analisis
notebook, bukan field yang saat ini tersedia di dokumen dashboard
Firestore.

### 9.2 Persona pemain

Notebook membentuk profil pemain dengan agregasi berdasarkan `steamid`,
lalu melakukan clustering menggunakan `MiniBatchKMeans` dengan empat
cluster.

Fitur clustering yang digunakan: - `jumlah_review` -
`rata_playtime_review` - `rata_playtime_total` - `rata_sentimen` -
`rata_votes_up`

Notebook mengambil sampel 500.000 pemain untuk pembentukan clustering,
melakukan transformasi log pada sejumlah fitur, dan standardisasi
menggunakan `StandardScaler`. Model clustering empat cluster kemudian
digunakan untuk memberi label pada seluruh profil pemain.

Nama persona: - Cluster 0: Casual Positive Player. - Cluster 1: High
Playtime Positive Player. - Cluster 2: Negative Response Player. -
Cluster 3: Active Reviewer Player.

Interpretasi persona merupakan interpretasi berdasarkan karakteristik
cluster, bukan diagnosis atau label psikologis yang telah tervalidasi.

### 9.3 ABSA

Notebook memuat kamus kata pemicu untuk delapan aspek: - Gameplay -
Graphics - Story - Performance - Audio - Multiplayer - Price & Value -
Developer & Update

Notebook juga menyiapkan sampel dan anotasi manual awal. Namun, tahapan
tersebut **belum berarti ABSA skala penuh telah diterapkan ke seluruh
ulasan**.

Penting untuk implementasi aplikasi: - Saat ini dokumen Firestore yang
sudah dipastikan tersedia hanya ringkasan dashboard dan persona. - Belum
ada koleksi ABSA yang dikonfirmasi tersedia di Firestore. - Jangan
membuat grafik ABSA, skor aspek, atau halaman hasil ABSA dengan angka
rekaan. - Jika halaman ABSA disiapkan di masa depan, buat sebagai fitur
belum tersedia atau tunggu sampai dataset hasil ABSA yang tervalidasi
diekspor dan disimpan.

### 9.4 Model regresi tambahan playtime

Target yang dirumuskan di notebook:

``` python
playtime_after_review = max(playtime_forever - playtime_at_review, 0)
```

Target tersebut adalah tambahan durasi bermain yang tercatat setelah
ulasan, dalam menit. Fatigue Point digunakan sebagai istilah konseptual
untuk menginterpretasikan indikasi aktivitas lanjutan rendah, bukan
bukti langsung kondisi psikologis pemain.

Notebook telah mencoba LightGBM Regressor dengan target yang
ditransformasi menggunakan `log1p`. Hasil evaluasi yang dicatat: - MAE:
5.035,64 menit. - RMSE: 23.579,22 menit. - R²: -0,03345.

Notebook sendiri menyimpulkan bahwa performa model LightGBM tersebut
belum baik dan belum layak disebut model prediksi optimal.

Karena itu: - Jangan menampilkan hasil prediksi seolah-olah sudah
akurat. - Jangan menyebut model sudah siap dipakai untuk prediksi
produksi. - Jangan membuat halaman prediksi yang mengklaim hasil
real-time. - Hasil model dan evaluasi belum termasuk dalam dua koleksi
Firestore yang sudah dikonfirmasi.

### 9.5 SAW / Resonance

Notebook memuat perhitungan SAW untuk skor kesesuaian persona dengan
game berdasarkan: - Kesesuaian sentimen. - Kesesuaian playtime. -
Kesesuaian aktivitas review.

Bobot awal yang digunakan dalam query notebook adalah 0,3333; 0,3333;
dan 0,3334. Notebook juga melakukan analisis sensitivitas bobot dan
menyimpan hasil Top 10 ke CSV.

Namun, hasil SAW tersebut belum dikonfirmasi tersimpan di Firestore.
Jangan membuat halaman rekomendasi game berbasis SAW dengan data dummy
atau menganggap file CSV otomatis tersedia di frontend.

## 10. Tahapan Pengembangan yang Disarankan

Kerjakan secara berurutan. Selesaikan dan uji satu tahap sebelum pindah
ke tahap berikutnya.

### Tahap 1 --- Audit proyek

-   Periksa `package.json`, struktur `src/`, file layout, dan CSS yang
    sudah ada.
-   Pastikan tidak membuat komponen duplikat.
-   Pertahankan koneksi Firebase yang sudah berhasil.

### Tahap 2 --- Rapikan layanan data

-   Buat `dashboardService.js` dan `personaService.js` jika belum ada.
-   Pindahkan query Firestore dari file pengujian ke service.
-   Tambahkan penanganan error dan dokumen kosong.
-   Uji pembacaan dua koleksi.

### Tahap 3 --- Bangun kerangka layout

-   Periksa Sidebar, Navbar, dan MainLayout yang sudah ada.
-   Pastikan navigasi dan layout konsisten.
-   Pastikan responsif.

### Tahap 4 --- Bangun Dashboard

-   Ambil data Firestore.
-   Buat loading, error, dan empty state.
-   Buat kartu statistik.
-   Buat grafik distribusi.
-   Buat grafik sentimen.
-   Buat ringkasan persona.

### Tahap 5 --- Bangun halaman Personas

-   Ambil empat dokumen persona.
-   Tampilkan detail tiap persona.
-   Format angka dan satuan secara konsisten.

### Tahap 6 --- Validasi

-   Cocokkan angka di UI dengan Firestore Console.
-   Pastikan urutan cluster benar.
-   Pastikan grafik memakai data aktual.
-   Uji saat internet terputus atau Firestore gagal.
-   Periksa console agar tidak ada error React atau Firebase.

### Tahap 7 --- Pengembangan lanjutan

Fitur ABSA, Fatigue Point, regresi, dan SAW baru boleh diimplementasikan
ke UI setelah output terstruktur dan tervalidasi tersedia di database
atau melalui backend yang benar-benar dibangun.

## 11. Standar Implementasi untuk Copilot

Ikuti semua ketentuan berikut ketika menghasilkan atau mengubah kode:

1.  Baca dokumentasi ini dan periksa file proyek yang benar-benar ada
    sebelum menulis kode.
2.  Jangan menebak nama file, nama field Firestore, atau isi dokumen.
3.  Gunakan nama koleksi dan field persis seperti yang tercantum pada
    bagian skema Firestore.
4.  Jangan membuat data dummy yang terlihat seperti data asli.
5.  Jangan mengubah konfigurasi Firebase yang telah berhasil tanpa
    alasan teknis yang jelas.
6.  Jangan mengubah Firestore Rules secara otomatis.
7.  Jangan menaruh Service Account JSON atau private key di frontend.
8.  Pisahkan query Firestore ke folder `services/`.
9.  Gunakan React hooks dengan benar dan hindari pemanggilan fetch
    berulang yang tidak perlu.
10. Sediakan loading, error, dan empty state.
11. Pastikan tampilan responsif dan aksesibel.
12. Jangan menginstal library baru sebelum memeriksa `package.json` dan
    kebutuhan proyek.
13. Jika membutuhkan library grafik, jelaskan pilihan dan instalasinya
    terlebih dahulu atau gunakan library yang sudah tersedia.
14. Jangan mengklaim ABSA, regresi, Fatigue Point, atau SAW sudah
    tersedia di Firestore jika belum ada bukti dokumen/collection-nya.
15. Jangan menghapus file atau mengubah banyak file sekaligus tanpa
    menjelaskan dampaknya.
16. Kerjakan bertahap. Setelah satu tahap, sebutkan file yang
    dibuat/diubah, fungsi masing-masing, dan cara mengujinya.
17. Jika struktur aktual berbeda dari dokumentasi, prioritaskan
    pemeriksaan kode aktual dan laporkan perbedaannya sebelum melakukan
    perubahan besar.

## 12. Prompt Awal untuk GitHub Copilot

Salin prompt berikut setelah menambahkan dokumen ini ke root proyek:

> Baca seluruh file `DOKUMENTASI_STEAM_REVIEW_COPILOT.md` terlebih
> dahulu. Setelah itu audit struktur proyek React + Vite yang
> benar-benar ada, terutama `package.json`, `src/App.jsx`,
> `src/services/firebase.js`, komponen layout, dan file CSS.
>
> Jangan langsung mengubah kode. Laporkan: 1. Struktur proyek aktual. 2.
> File yang sudah tersedia dan dapat digunakan kembali. 3. Bagian
> dokumentasi yang sudah sesuai dengan implementasi. 4. Bagian yang
> belum dibuat. 5. Rencana implementasi bertahap untuk menampilkan
> Dashboard dari Firestore.
>
> Gunakan hanya koleksi `dashboard_summaries/persona_dashboard` dan
> `personas` yang sudah tersedia. Jangan membuat data dummy, jangan
> mengubah Firestore Rules, jangan memasukkan Service Account ke
> frontend, dan jangan mengklaim fitur ABSA/regresi/SAW sudah tersedia
> di database. Tunggu persetujuan sebelum mengubah file.

## 13. Checklist Selesai

-   [ ] Copilot membaca dokumentasi.
-   [ ] Struktur proyek aktual telah diaudit.
-   [ ] Firebase tetap berhasil terhubung.
-   [ ] Service pembacaan dashboard tersedia.
-   [ ] Service pembacaan persona tersedia.
-   [ ] Dashboard menampilkan data Firestore aktual.
-   [ ] Grafik distribusi persona sesuai data.
-   [ ] Grafik sentimen sesuai data.
-   [ ] Empat persona tampil sesuai dokumen.
-   [ ] Loading, error, dan empty state tersedia.
-   [ ] Tidak ada data dummy yang disamarkan sebagai data asli.
-   [ ] Tidak ada kredensial Service Account di frontend.
