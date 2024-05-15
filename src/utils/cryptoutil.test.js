import * as cryptoutil from './cryptoutil';

describe('cryptoutil', () => {
    test('encrypt and decrypt', () => {
        // set the plaintext and key
        let plaintext = "hello world";
        let key = "secret";

        // encrypt the plaintext
        let ciphertext = cryptoutil.encrypt({plaintext, key});

        // ciphertext should not be equal to plaintext
        expect(ciphertext).not.toBe(plaintext);

        // ciphertext should not contain the plaintext
        expect(ciphertext).not.toContain(plaintext);

        // decrypt the ciphertext
        let decrypted = cryptoutil.decrypt({ciphertext, key});

        // decrypted should be equal to plaintext
        expect(decrypted).toBe(plaintext);
    });

    test('encrypt and decrypt with different key', () => {
        // set the plaintext and key
        let plaintext = "hello world";
        let key = "secret";

        // encrypt the plaintext
        let ciphertext = cryptoutil.encrypt({plaintext, key});

        // ciphertext should not be equal to plaintext
        expect(ciphertext).not.toBe(plaintext);

        // set a different key
        let differentKey = "different";

        // decrypt the ciphertext with a different key should throw an error
        expect(() => {
            cryptoutil.decrypt({ciphertext, differentKey});
        }).toThrow();
    });

    test('generate different ciphertexts for same plaintext with different keys', () => {
        // set the plaintext
        let plaintext = "hello world";

        // set the keys
        let key1 = "secret1";
        let key2 = "secret2";

        // encrypt the plaintext with key1
        let ciphertext1 = cryptoutil.encrypt({plaintext, key: key1});
        let ciphertext2 = cryptoutil.encrypt({plaintext, key: key2});

        // ciphertexts should not be equal
        expect(ciphertext1).not.toBe(ciphertext2);
    });

    test('generate different ciphertexts for same plaintext with same key', () => {
        // set the plaintext and key
        let plaintext = "hello world";
        let key = "secret";

        // encrypt the plaintext twice
        let ciphertext1 = cryptoutil.encrypt({plaintext, key});
        let ciphertext2 = cryptoutil.encrypt({plaintext, key});

        // ciphertexts should not be equal
        expect(ciphertext1).not.toBe(ciphertext2);
    });

    test('generate different ciphertexts for different plaintexts with same key', () => {
        // set the plaintext and key
        let plaintext1 = "hello world 1";
        let plaintext2 = "hello world 2";
        let key = "secret";

        // encrypt the plaintexts
        let ciphertext1 = cryptoutil.encrypt({plaintext: plaintext1, key});
        let ciphertext2 = cryptoutil.encrypt({plaintext: plaintext2, key});

        // ciphertexts should not be equal
        expect(ciphertext1).not.toBe(ciphertext2);
    });
});
