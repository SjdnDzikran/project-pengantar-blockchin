# Sistem Ulasan Perusahaan Berbasis Blockchain - MVP

Platform terdesentralisasi untuk ulasan perusahaan yang transparan dan tidak dapat diubah dengan Ethereum.

## 🎯 Gambaran Umum

Sistem ini memungkinkan karyawan mengirim ulasan terverifikasi tentang perusahaannya. Ulasan disimpan di blockchain Ethereum privat sehingga:
- **Transparansi**: Semua ulasan ada di blockchain
- **Imutabilitas**: Ulasan tidak dapat diubah atau dihapus
- **Privasi**: Data personal di-hash sebelum disimpan
- **Verifikasi**: Hanya karyawan terverifikasi yang bisa mengirim ulasan

## 🏗️ Arsitektur

### Tumpukan Teknologi

- **Blockchain**: Geth (Ethereum) dengan Proof of Authority (Clique)
- **Smart Contract**: Solidity 0.8.0+
- **Backend**: Node.js + Express
- **Frontend**: React 18
- **Database**: PostgreSQL
- **State Management**: Zustand

### Fitur Utama

1. **Sistem Ulasan Sederhana**
   - Rating universal tunggal (1-5 bintang)
   - Hash konten ulasan disimpan di blockchain
   - Teks ulasan lengkap disimpan di database

2. **Desain Utamakan Privasi**
   - Alamat email di-hash dengan Keccak256
   - ID karyawan di-hash sebelum masuk blockchain
   - Konten ulasan di-hash untuk verifikasi integritas

3. **Verifikasi Status Karyawan**
   - Pengguna harus memverifikasi status karyawan sebelum mengulas
   - Auto-approval untuk MVP (bisa diperluas ke approval manual)

## 🔄 Cara Ulasan Disimpan

- **Yang masuk on-chain**: Hanya hash + rating. Smart contract menyimpan `reviewId`, `companyId` (hash), `reviewerHash` (hash dompet/email), `reviewHash` (hash teks ulasan + rating + timestamp), `employmentProof` (hash ID karyawan), rating, dan timestamp.
- **Yang tetap di Postgres**: Teks ulasan, rating, info perusahaan, dan metadata transaksi (tx hash, nomor blok, hash yang tersimpan) untuk pembacaan cepat.
- **Jenis transaksi**: Pemanggilan kontrak yang mengubah state (`storeReview`) dan ditandatangani di dompet pengguna; menulis data dan membayar gas tanpa transfer token.
- **Alur end-to-end**:
  1) Frontend memanggil `POST /api/reviews/prepare` → backend mengembalikan `reviewId` + hash.
  2) Dompet pengguna memanggil `storeReview(reviewId, companyId, reviewerHash, reviewHash, rating, employmentProof)` pada kontrak.
  3) Setelah tx ditambang, frontend memanggil `POST /api/reviews` → backend menyimpan tx hash/nomor blok + teks ulasan di Postgres.
  4) `GET /api/reviews/:id/verify` membandingkan hash DB vs hash on-chain untuk membuktikan integritas.

## 📜 Smart Contract (CompanyReviewLedger.sol)

- `storeReview(reviewId, companyId, reviewerHash, reviewHash, rating, employmentProof)` — hanya owner yang bisa menulis, rating 1–5, memicu `ReviewStored`.
- `reviewExists(reviewId)` — cek keberadaan.
- `getReview(reviewId)` — mengembalikan struct yang tersimpan.
- `getReviewsByCompanyId(companyId)` — daftar review ID untuk sebuah perusahaan.
- `getAllReviewIds()` — daftar semua review ID.
- `getReviewCount()` — total ulasan.
- `getTimestamp(reviewId)` — lookup timestamp.
- `verifyReviewHash(reviewId, reviewHash)` — bandingkan hash yang diberikan dengan yang tersimpan.

## 📁 Struktur Proyek

```
review-system-mvp/
├── blockchain/
│   ├── contracts/
│   │   └── CompanyReviewLedger.sol
│   ├── build/
│   ├── data/
│   │   └── keystore/
│   ├── genesis.json
│   └── deploy.py
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── utils/
│   │   └── server.js
│   ├── database/
│   │   └── migrations/
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   ├── store/
│   │   └── App.js
│   └── package.json
├── scripts/
│   ├── setup.sh
│   ├── init-blockchain.sh
│   ├── init-database.sh
│   ├── start-all.sh
│   ├── start-blockchain.sh
│   └── stop-all.sh
└── README.md
```

## 🚀 Mulai Cepat

### Prasyarat

- Node.js v16+
- npm atau yarn
- Python 3.8+
- PostgreSQL 12+
- Geth (go-ethereum)

### Instalasi

1. **Kloning dan masuk ke proyek:**
   ```bash
   cd review-system-mvp
   ```

2. **Jalankan setup lengkap:**
   ```bash
   chmod +x scripts/*.sh
   ./scripts/setup.sh
   ```

   Ini akan:
   - Inisialisasi blockchain (salin keystore, buat genesis)
   - Menyiapkan database PostgreSQL
   - Menginstal semua dependensi
   - Menyiapkan berkas environment

3. **Jalankan semua layanan:**
   ```bash
   ./scripts/start-all.sh
   ```

   Ini menjalankan:
   - Node blockchain (port 8545)
   - Backend API (port 3001)
   - Frontend app (port 3000)

4. **Deploy smart contract:**
   ```bash
   cd blockchain
   python3 deploy.py
   ```

   Salin alamat kontrak dari output (atau gunakan alamat yang sudah dikonfigurasi di frontend).

5. **Perbarui konfigurasi backend:**
   ```bash
   nano backend/.env
   # Set: CONTRACT_ADDRESS=0xYourContractAddress
   ```

6. **Restart layanan:**
   ```bash
   ./scripts/stop-all.sh
   ./scripts/start-all.sh
   ```

7. **Akses aplikasi:**
   Buka browser ke: http://localhost:3000

## 📝 Setup Manual (Alternatif)

### 1. Setup Blockchain

```bash
# Inisialisasi blockchain
./scripts/init-blockchain.sh

# Jalankan node blockchain
./scripts/start-blockchain.sh
```

### 2. Setup Database

```bash
# Buat database dan jalankan migrasi
./scripts/init-database.sh
```

Atau manual:
```bash
createdb company_review_db
psql -d company_review_db -f backend/database/migrations/001_initial_schema.sql
```

### 3. Setup Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env dengan konfigurasi Anda
npm start
```

### 4. Setup Frontend

```bash
cd frontend
npm install
npm start
```

## 🔧 Konfigurasi

### Variabel Environment Backend

Edit `backend/.env`:

```bash
# Server
PORT=3001
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=company_review_db
DB_USER=postgres
DB_PASSWORD=postgres

# Blockchain
BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545
BLOCKCHAIN_CHAIN_ID=110261
CONTRACT_ADDRESS=0xYourContractAddress
DEPLOYER_ADDRESS=0xd9232DB885e7db72eb0e55c25622e7C9413c4350
DEPLOYER_PASSWORD=admin123

# CORS
CORS_ORIGIN=http://localhost:3000
```

### Konfigurasi Blockchain

Parameter default chain lokal (jika memakai PoA bawaan):
- Chain/Network ID: 110261
- Konsensus: Clique (PoA), waktu blok 15s
- Deployer: `0xd9232DB885e7db72eb0e55c25622e7C9413c4350`
- Validator: `0x2c8983281c3aab992cdfb3eb5a4afe2c139aeae1`

Default frontend (perbarui jika perlu di `frontend/src/services/blockchain.js`):
- Network: DChain, Chain ID 17845
- Alamat kontrak: `0x3f9c46CF69c93B39c6D7e21723b465514Dd66758`

## 📊 Endpoint API

### Autentikasi
- `GET /api/auth/wallet/nonce/:walletAddress` - Ambil nonce untuk sign-in dompet
- `POST /api/auth/wallet/verify` - Verifikasi nonce bertanda tangan dan autentikasi dompet
- `GET /api/auth/me` - Ambil pengguna saat ini yang terautentikasi dompet (terproteksi)

### Perusahaan
- `GET /api/companies` - Daftar semua perusahaan
- `GET /api/companies/:id` - Detail perusahaan
- `GET /api/companies/:id/reviews` - Ulasan perusahaan
- `GET /api/companies/search?q=name` - Cari perusahaan
- `POST /api/companies` - Buat perusahaan (terproteksi)

### Ulasan
- `POST /api/reviews/prepare` - Siapkan hash + reviewId untuk tx blockchain
- `POST /api/reviews` - Simpan metadata ulasan setelah submit on-chain
- `GET /api/reviews/:id` - Detail ulasan
- `GET /api/reviews/:id/verify` - Verifikasi ulasan di blockchain
- `GET /api/reviews/user/:walletAddress` - Ambil ulasan milik dompet tertentu

### Verifikasi
- `POST /api/verifications` - Kirim verifikasi status karyawan (berbasis dompet)
- `GET /api/verifications/:companyId/:walletAddress` - Cek status verifikasi

## 🔐 Fitur Keamanan

1. **Wallet Auth**: Alur signature berbasis nonce; tidak butuh password di aplikasi
2. **Privasi Data**: Hashing Keccak256 untuk PII
3. **Rate Limiting**: Pembatasan laju API diaktifkan
4. **Perlindungan CORS**: Kebijakan CORS terkonfigurasi
5. **Pencegahan SQL Injection**: Query terparameterisasi

## 🧪 Pengujian

### Kirim Ulasan Uji

1. Hubungkan dompet dan masuk (alur nonce)
2. Verifikasi status karyawan
3. Kirim ulasan (prepare → tx dompet → persist)

## 📱 Panduan Penggunaan

### Untuk Pengguna

1. **Hubungkan Dompet**
   - Buka http://localhost:3000
   - Hubungkan dompet dan tanda tangani nonce untuk autentikasi

2. **Jelajahi Perusahaan**
   - Lihat daftar perusahaan
   - Lihat rating dan ulasan
   - Cari berdasarkan nama perusahaan

3. **Kirim Ulasan**
   - Klik sebuah perusahaan
   - Klik "Write a Review"
   - Hubungkan dompet dan verifikasi status karyawan (masukkan ID karyawan)
   - Beri rating perusahaan (1-5 bintang)
   - Tulis ulasan (opsional)
   - Setujui transaksi blockchain di dompet
   - Backend merekam metadata tx + teks ulasan

4. **Lihat Ulasan Anda**
   - Buka Dashboard
   - Lihat semua ulasan yang Anda kirim
   - Cek tx hash blockchain dan status verifikasi

### Untuk Administrator

1. **Tambah Perusahaan Baru**
   ```bash
   curl -X POST http://localhost:3001/api/companies \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "companyName": "New Company",
       "industry": "Technology",
       "location": "Jakarta"
     }'
   ```

## 🛠️ Pemeliharaan

### Lihat Log

```bash
# Log blockchain
tail -f logs/blockchain.log

# Log backend
tail -f logs/backend.log

# Log frontend
tail -f logs/frontend.log
```

### Hentikan Semua Layanan

```bash
./scripts/stop-all.sh
```

### Mulai Ulang Layanan

```bash
./scripts/stop-all.sh
./scripts/start-all.sh
```

### Reset Blockchain

```bash
./scripts/stop-all.sh
rm -rf blockchain/data/geth
./scripts/init-blockchain.sh
./scripts/start-all.sh
# Deploy ulang kontrak
```

## 🐛 Pemecahan Masalah

### Port Sudah Dipakai

```bash
# Cek port yang terpakai
lsof -i :8545  # Blockchain
lsof -i :3001  # Backend
lsof -i :3000  # Frontend

# Matikan proses
kill $(lsof -t -i:8545)
```

### Error Koneksi Database

```bash
# Cek PostgreSQL berjalan
sudo systemctl status postgresql

# Jalankan PostgreSQL
sudo systemctl start postgresql

# Tes koneksi
psql -U postgres -d company_review_db -c "SELECT 1"
```

### Gagal Deploy Kontrak

```bash
# Pastikan blockchain berjalan
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Cek saldo akun
cd blockchain
python3 -c "from web3 import Web3; w3=Web3(Web3.HTTPProvider('http://localhost:8545')); print(w3.eth.get_balance('0xd9232DB885e7db72eb0e55c25622e7C9413c4350'))"
```

## 📈 Peningkatan Mendatang

- [ ] Alur verifikasi karyawan manual
- [ ] Unggah berkas bukti kerja (integrasi IPFS)
- [ ] Dashboard analitik lanjutan
- [ ] Sistem moderasi ulasan
- [ ] Dukungan multi-bahasa
- [ ] Aplikasi mobile
- [ ] Opsi deploy ke blockchain publik

## 📄 Lisensi

Lisensi MIT

## 👥 Kontribusi

Kontribusi terbuka! Silakan buka issue atau kirim pull request.

## 📞 Dukungan

Untuk masalah dan pertanyaan:
- Cek bagian pemecahan masalah
- Lihat log di direktori `logs/`
- Buka issue di GitHub

---

**Dibangun dengan ❤️ menggunakan Ethereum, React, dan Node.js**
