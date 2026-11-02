# SecureKey
[![CI Pipeline](https://github.com/panchalshubham0608/securekey/actions/workflows/react_test.yml/badge.svg?branch=main)](https://github.com/panchalshubham0608/securekey/actions/workflows/react_test.yml)
[![Deploy React App to GitHub Pages](https://github.com/panchalshubham0608/securekey/actions/workflows/deploy.yml/badge.svg)](https://github.com/panchalshubham0608/securekey/actions/workflows/deploy.yml)
[![Check Assets for SVGs](https://github.com/panchalshubham0608/securekey/actions/workflows/check-assets.yml/badge.svg)](https://github.com/panchalshubham0608/securekey/actions/workflows/check-assets.yml)

[**SecureKey**](https://panchalshubham0608.github.io/securekey) is a **zero-knowledge, client-side encrypted password manager** that lets you safely store, audit, and manage your credentials directly in your browser.

---

## ✨ Key Features

- 🔐 **Zero-Knowledge Client-Side Encryption** — Secrets are encrypted and decrypted locally in your browser using **AES-GCM (256-bit)** before ever touching the network.
- 🧠 **Master Encryption Key (MEK) Architecture** — Your master password derives a wrapping key (PBKDF2-SHA256) to unwrap your vault's MEK in memory.
- ⚡ **Biometric Quick Unlock (WebAuthn)**
  - Unlock your vault with **Touch ID, Face ID, Windows Hello, or device PIN** directly from the sign-in screen.
  - Device-bound and isolated per browser/device using IndexedDB + WebAuthn.
- ⏱️ **Automatic Inactivity Lock & Ephemeral Reveal**
  - **Inactivity Auto-Lock**: Automatically locks the vault after **5 minutes** of inactivity, with a centered warning modal and live countdown at **4 minutes**.
  - **Masked by Default & 30s Auto-Collapse**: Expanding a vault item keeps the password masked (`************`) until explicitly revealed, and automatically collapses after **30 seconds**.
- 🛡️ **Password Health Scorecard**
  - Real-time vault health score (`%`) in the top navigation bar.
  - Tracks credentials that **Need Rotation** (`> 180 days`), are **Expiring Soon** (`150–180 days`), or are **Up to Date**, with one-click **Rotate** / **Update** shortcuts.
- 🕓 **Password Change History** — Full encrypted audit trail of previous passwords and rotation timestamps for every credential.
- 🎨 **Modern Glassmorphic UI & Dark/Light Themes**
  - Built-in **Dark** and **Light** themes with persistent preference.
  - Automatic brand icon detection for **27+ popular providers** (AWS, GitHub, Google, Apple, Discord, Netflix, Slack, Spotify, X, etc.) plus dynamic monogrammed squircle badges for custom services.
  - Touch-friendly slide-out action tray for quick access to **History**, **Edit**, and **Delete**.
- 🔄 **Seamless Legacy Vault Migration** — Built-in migration wizard to re-encrypt legacy credentials into the MEK-based vault architecture.

---

## 🔒 Security Model

- **Zero Plaintext Storage**: Your Master Password and plaintext MEK are never sent to the server or persisted in plaintext storage.
- **Quick Unlock Storage**:
  - When enabled, the MEK is encrypted using a non-extractable **AES-GCM `CryptoKey`** stored in **IndexedDB**, gated by a platform **WebAuthn** authenticator assertion.
- **Lock Vault vs. Log Out**:
  - **Lock Vault** *(manual or 5-minute inactivity timeout)*: Wipes the in-memory `mek` immediately while preserving your registered Quick Unlock device credentials so you can quickly re-authenticate with biometrics.
  - **Log Out**: Performs a full cryptographic cleanup — wipes `encrypted_mek`, `device_key`, `credential_id`, and `quick_unlock_user` from IndexedDB and `localStorage`, clears the in-memory `mek`, and signs out of Firebase Auth.
- 🔐 Even if the backend database is compromised, your vault remains unreadable without your credentials.

---

## 🔄 Legacy Vault Migration

If you have credentials from an earlier version of SecureKey:
1. Sign in to your account and open the **navigation drawer** (top-right menu).
2. Select **Migrate Legacy Data**.
3. Your existing credentials will be decrypted locally and re-encrypted under your new MEK.

---

## ⚠️ Important Notes

- **Do not forget your master password.**
- Because SecureKey uses zero-knowledge client-side encryption, **there is no password reset or server-side recovery**. If you lose both your master password and access to an enrolled Quick Unlock device, your vault cannot be decrypted.

---

## 🧪 Browser Support

- Modern browsers with **Web Crypto API** and **WebAuthn** support (Chrome, Edge, Brave, Safari, Firefox).
- **HTTPS** (or `localhost` during development) is required for Web Crypto and WebAuthn APIs.

---

## 🛠️ Development Flow

1. **Clone the Repository**:
   ```sh
   git clone https://github.com/panchalshubham0608/securekey.git
   cd securekey
   ```

2. **Set Up Environment Variables**:
   Create a `.env` file in the project root:
   ```env
   REACT_APP_FIREBASE_CONFIG=your_firebase_config_json
   REACT_APP_FIRESTORE_KEYS_COLLECTION_NAME=your_firestore_keys_collection_name
   REACT_APP_FIRESTORE_USERS_COLLECTION_NAME=your_firestore_users_collection_name
   REACT_APP_FIRESTORE_VAULTS_COLLECTION_NAME=your_firestore_vaults_collection_name
   ```

3. **Install Dependencies**:
   ```sh
   npm install
   ```

4. **Start the Development Server**:
   ```sh
   npm start
   ```
   The app will be available at `http://localhost:3000/securekey`.

5. **Lint & Run Unit Tests**:
   ```sh
   npm run lint
   TZ=Asia/Kolkata npm test
   ```

6. **Deployment**:
   Merging into `main` automatically triggers the GitHub Actions workflow ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)) to build and deploy to GitHub Pages.

---

## 📬 Contact

Questions or feedback? Reach out at [shubhampanchal9773@gmail.com](mailto:shubhampanchal9773@gmail.com).

