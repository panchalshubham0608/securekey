# Secure Key
[![CI Pipeline](https://github.com/panchalshubham0608/securekey/actions/workflows/react_test.yml/badge.svg?branch=main)](https://github.com/panchalshubham0608/securekey/actions/workflows/react_test.yml)

[SecureKey](https://main.d1io7b6nj2kxkf.amplifyapp.com) is a web application that allows you to securely store your secrets. 

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
   - The application will be available at `http://localhost:3000`.

5. **Make Changes and Test Locally**:
   - Make your changes and test them locally.
   - Ensure that your branch name is not `test` or `main`.  
   **Tip:** Use a descriptive branch name for your feature or fix.

6. **Test Your Changes on test environment**:
   - Once you are satisfied with your changes, push them to the `test` branch:
     ```sh
     git checkout -b test
     git push origin test --force
     ```
   - After pushing to the `test` branch, test your changes in the test environment available at [https://test.d1io7b6nj2kxkf.amplifyapp.com](https://test.d1io7b6nj2kxkf.amplifyapp.com).

7. **Create a Pull Request**:
   - Once you have tested your changes, create a pull request from your branch to the `main` branch.
   - Provide a detailed description of the changes and any relevant information.

8. **Wait for Approval**:
   - Wait for the pull request to be reviewed and approved by the maintainers.

9. **Production Deployment**:
    - After your pull request is merged into the `main` branch, a production deployment will be triggered automatically.

10. **Observe Production**:
    - Observe production for any issues with your deployment, if you see something is broken then create a roll-back of your changes.

## Additional Notes

- **Branch Naming**: Do not use `test` or `main` as branch names. Choose descriptive names for feature branches.
- **Coding Style**: Follow the project's coding style and conventions.
- **Testing**: Ensure that all tests pass before submitting your pull request.


## Help
If you have any questions or need help, please contact me at [shubhampanchal9773@gmail.com](mailto:shubhampanchal9773@gmail.com)
