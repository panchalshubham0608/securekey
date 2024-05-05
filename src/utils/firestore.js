
const getPassKeyValue = ({account, username}) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve("password");
        }, 1000);
    });
}

let keys = [
    { account: "GitHub", username: "octocat", password: "password" },
    { account: "LinkedIn", username: "octocat", password: "password" },
    { account: "Google", username: "shubhampanchal9773@gmail.com", password: "password"},
    { account: "SBI", username: "testsbiuser", password: "password" },
    { account: "Microsoft", username: "octocat", password: "password" },
    { account: "IncomeTax", username: "octocat", password: "password" },
    { account: "UAN", username: "octocat", password: "password"},
    { account: "UHCP", username: "octocat", password: "password" },
    { account: "NPM", username: "octocat", password: "password" },
    { account: "Udemy", username: "octocat", password: "password" },
    { account: "Paypal", username: "octocat", password: "password" },
]

const getPassKeys = () => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(keys.sort((a, b) => a.account.localeCompare(b.account)));
        }, 1000);
    });
}

const upsertPassKey = ({account, username, password}) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            keys.push({account, username, password});
            console.log("Passkey added successfully", account);
            resolve();
        }, 1000);
    });
}

module.exports = {
    getPassKeyValue,
    getPassKeys,
    upsertPassKey
}
