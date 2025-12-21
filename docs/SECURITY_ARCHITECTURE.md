# 🛡️ Octra Wallet Technical Security Architecture (v2.0)

Dokumen ini menjelaskan implementasi keamanan tingkat militer yang digunakan pada Octra Wallet v2.0. Kami menggunakan pendekatan **Defense in Depth** untuk melindungi aset pengguna dari berbagai jenis serangan siber modern.

---

## 🏗️ 1. Pertahanan Utama (Core Defense)

| Teknologi Keamanan | Fungsi Utama | Melindungi Dari Hacker Tipe Apa? |
| :--- | :--- | :--- |
| **PBKDF2-SHA256** (1 Juta Iterasi) | Mengubah password user menjadi kunci enkripsi 256-bit. Menggunakan **1.000.000 iterasi** (di atas standar rekomendasi OWASP 600k) untuk memperlambat proses brute-force secara signifikan. | **🎯 Hacker Brute-Force:** Hacker yang mencoba menebak password dengan miliaran kombinasi akan gagal karena setiap tebakan membutuhkan biaya komputasi yang sangat mahal (high CPU cost). |
| **AES-256-GCM** | Standar enkripsi militer AS untuk mengunci data sensitif (Private Key) sehingga menjadi sampah acak tanpa password. Menggunakan mode GCM untuk keamanan & kecepatan terverifikasi. | **🎯 Malware/Spyware:** Jika hacker mencuri file `localStorage` dari komputer korban, mereka hanya mendapatkan data acak yang tidak bisa dibaca tanpa password. |
| **HMAC-SHA256** | Tanda tangan digital tak terlihat yang disematkan pada setiap data terenkripsi untuk memverifikasi keasliannya dan mencegah modifikasi diam-diam. | **🎯 Tampering/Corruptor:** Hacker yang mencoba mengubah 1 bit data terenkripsi (misal: mengubah alamat tujuan) akan terdeteksi instan karena tanda tangan digitalnya rusak. App akan menolak memuat data tersebut. |

---

## 🧠 2. Manajemen Memori (RAM Security)

| Teknologi Keamanan | Fungsi Utama | Melindungi Dari Hacker Tipe Apa? |
| :--- | :--- | :--- |
| **5-Pass Secure Wipe** | Menghapus data sensitif (Private Key) dari RAM dengan menimpanya 5 kali (0, Random, 0, 0xFF, 0) segera setelah dipakai. | **🎯 Memory Dump Forensics:** Hacker canggih yang bisa membaca sisa-sisa data di RAM komputer (Cold Boot Attack) tidak akan menemukan apa-apa karena data asli sudah ditimpa sampah acak. |
| **Disposable Buffers** | Variabel kunci hanya hidup dalam hitungan milidetik saat *signing* transaksi, lalu langsung dimusnahkan. | **🎯 Debugger/Inspector:** Jika hacker mencoba mengintip variabel memori lewat DevTools saat transaksi berjalan, window waktunya terlalu sempit. |
| **Unified Keyring Model** | Logika keamanan `KeyringService` sekarang diseragamkan antara Web & Extension untuk konsistensi. | **🎯 Inconsistency Exploiter:** Menutup celah keamanan yang mungkin muncul karena perbedaan implementasi logika antara versi web dan ekstensi. |

---

## 🌐 3. Proteksi Platform & Jaringan

| Teknologi Keamanan | Fungsi Utama | Melindungi Dari Hacker Tipe Apa? |
| :--- | :--- | :--- |
| **Strict CSP (Content Security Policy)** | Header HTTP ketat yang melarang browser menjalankan script liar (`eval()`, inline script berbahaya). | **🎯 XSS (Cross-Site Scripting):** Mencegah hacker menyuntikkan kode jahat ke website wallet untuk mencuri data session atau key. |
| **Isolated Extension Context** | Arsitektur ekstensi memisahkan UI (Popup) dari Logic (Service Worker). Kunci tidak pernah menyentuh UI. | **🎯 UI Interaction Attacks:** Serangan yang menargetkan antarmuka pengguna tidak bisa menyentuh private key yang terisolasi aman di background process. |
| **Auto-Lock (Activity Aware)** | Wallet otomatis terkunci setelah 5 menit diam, mendeteksi gerakan mouse/keyboard. | **🎯 "Evil Maid" / Physical Access:** Orang iseng atau jahat yang fisik mengakses komputer Anda saat Anda pergi ke toilet tidak bisa membuka wallet yang sudah terkunci otomatis. |

---

## 🚀 4. Alur Keamanan Transaksi (The Safe Path)

Bagaimana keamanan bekerja saat User mengirim koin?

1.  **Unlock:** User input password -> PBKDF2 memproses 1 Juta iterasi (~100-200ms) -> Decrypt Vault.
2.  **Load:** Private Key dimuat ke RAM dalam variable terisolasi.
3.  **Sign:** `KeyringService` menandatangani transaksi menggunakan `tweetnacl` (Ed25519).
4.  **WIPE:** **DETIK ITU JUGA**, Private Key di-overwrite 5x dengan sampah (`secureWipe`).
5.  **Broadcast:** Hanya hasil tanda tangan (aman untuk publik) yang dikirim ke jaringan. Private key tidak pernah meninggalkan RAM sesaat itu.

---

## 📊 5. Perbandingan v1 (Lama) vs v2 (Sekarang)

| Fitur | Octra Wallet v1 (Lama) ❌ | Octra Wallet v2 (Sekarang) ✅ |
| :--- | :--- | :--- |
| **Hashing Password** | PBKDF2 (Standard/Weak) | **PBKDF2 (1 Juta Iterasi)** (High-Security) |
| **Integritas Data** | Tidak ada | **HMAC-SHA256 Signatures** |
| **Pembersihan RAM** | Basic Garbage Collection | **Aggressive 5-Pass Overwrite** |
| **Arsitektur** | Web Simple | **Extension-Ready Isolation** |

---

**Dokumen ini valid untuk:**
- Octra Wallet Web Version
- Octra Wallet Browser Extension
- Octra Mobile (React Native - shared logic)

**Last Updated:** Dec 2024
**Status:** ✅ PRODUCTION READY
