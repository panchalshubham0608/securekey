# Secure Key
[![CI Pipeline](https://github.com/panchalshubham0608/securekey/actions/workflows/react_test.yml/badge.svg?branch=main)](https://github.com/panchalshubham0608/securekey/actions/workflows/react_test.yml)
![Deploy React App](https://github.com/panchalshubham0608/securekey/actions/workflows/deploy.yml/badge.svg)


[SecureKey](https://panchalshubham0608.github.io/securekey) is a web application that allows you to securely store your secrets. 

## Features
- Securely store your secrets
- AES encryption
- Password protected
- Easy to use

## Why Secure Key?
Secure Key is a simple and secure way to store your secrets. It uses AES encryption to store your secrets. You can store your secrets in a secure way and access them whenever you want with ease.

## !! Important Note !!
Please make sure to remember your password. If you forget your password, you will not be able to access your secrets.

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

## Additional Notes

- **Coding Style**: Follow the project's coding style and conventions.
- **Testing**: Ensure that all tests pass before submitting your pull request.


## Help
If you have any questions or need help, please contact me at [shubhampanchal9773@gmail.com](mailto:shubhampanchal9773@gmail.com)
