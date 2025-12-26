# Secure Key
[![CI Pipeline](https://github.com/panchalshubham0608/securekey/actions/workflows/react_test.yml/badge.svg?branch=main)](https://github.com/panchalshubham0608/securekey/actions/workflows/react_test.yml)
[![Deploy React App to GitHub Pages](https://github.com/panchalshubham0608/securekey/actions/workflows/deploy.yml/badge.svg)](https://github.com/panchalshubham0608/securekey/actions/workflows/deploy.yml)

[SecureKey](https://panchalshubham0608.github.io/securekey) is a **secure, client-side encrypted password manager** that allows you to safely store and manage your secrets directly in your browser.

## ✨ Key Features
- 🔐 **Client-side encryption** — your secrets are encrypted before they leave your device
- 🧠 **Master Encryption Key (MEK) architecture**
- 🔑 **Password-based login**
- ⚡ **Quick Unlock using biometric / PIN (WebAuthn)**
   * Fingerprint, Face ID, or device PIN
   * Device-bound and secure
- 🔄 **Seamless migration** from legacy encryption to MEK-based encryption
- 🕓 **Password history tracking**
- ☁️ **Secure cloud sync** using Firebase Firestore
- 🎨 **Clean and intuitive UI**

## 🔒 Security Model (High Level)
- Secrets are encrypted locally using a Master Encryption Key (MEK)
- **MEK is never stored in plaintext**
- For Quick Unlock:
   - MEK is encrypted with a **device-specific key**
   - Device key is stored securely in IndexedDB
   - Biometric / PIN verification is required to unlock
- Encryption uses **AES-GCM (256-bit)**
- 🔐 Your data remains unreadable to anyone without your credentials — including the server.

## 🔄 Migration Support
- SecureKey has upgraded its encryption design.
- If you don’t see your existing passwords after login:
   - Use Migration from the hamburger menu
   - Existing passwords will be securely re-encrypted using the new MEK system
   - Migration happens locally and securely

## ⚠️ Important Notes
- **Do not forget your master password**
- If you lose:
   - Your password and
   - Access to your device (Quick Unlock)
- 👉 Your data **cannot be recovered**.  
(This is by design for maximum security.)

## 🧪 Browser Support
- Modern Chromium-based browsers (Chrome, Edge, Brave)
- WebAuthn required for biometric / PIN unlock
- HTTPS is required for cryptographic APIs

## Development Flow
1. **Clone the Repository**:
   - Clone the repository to your local machine:
     ```sh
     git clone https://github.com/panchalshubham0608/securekey.git
     cd securekey
     ```

2. **Set Up Environment Variables**:
   - Create a `.env` file in the root directory of the project if it doesn't already exist.
   - Add the following environment variables to the `.env` file:
     ```env
     REACT_APP_FIREBASE_CONFIG=your_firebase_config
     REACT_APP_FIRESTORE_KEYS_COLLECTION_NAME=your_firestore_keys_collection_name
     REACT_APP_FIRESTORE_USERS_COLLECTION_NAME=your_firestore_USERS_collection_name
     REACT_APP_FIRESTORE_VAULTS_COLLECTION_NAME=your_firestore_VAULTS_collection_name
     ```

3. **Install Packages**:
   - Install the necessary packages using npm:
     ```sh
     npm install
     ```

4. **Run the Application**:
   - Start the development server:
     ```sh
     npm start
     ```
   - The application will be available at `http://localhost:3000/securekey`.

5. **Make Changes and Test Locally**:
   - Make your changes and test them locally.  
   **Tip:** Use a descriptive branch name for your feature or fix.

6. **Create a Pull Request**:
   - Once you have tested your changes, create a pull request from your branch to the `main` branch.
   - Provide a detailed description of the changes and any relevant information.

7. **Wait for Approval**:
   - Wait for the pull request to be reviewed and approved by the maintainers.

8. **Production Deployment**:
    - After your pull request is merged into the `main` branch, a production deployment will be triggered automatically.

9. **Observe Production**:
    - Observe production for any issues with your deployment, if you see something is broken then create a roll-back of your changes.

## 🧾 Additional Notes
- Coding Style: Follow existing patterns and conventions
- Security-sensitive code: Add comments and rationale
- Testing: Ensure all tests pass before submitting PRs

## Help
If you have any questions or need help, please contact me at [shubhampanchal9773@gmail.com](mailto:shubhampanchal9773@gmail.com)
