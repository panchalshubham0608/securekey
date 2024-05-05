import React from "react";

import GitHubIcon from "../assets/GitHub.svg";
import GoogleIcon from "../assets/Google.svg";
import IncomeTaxIcon from "../assets/IncomeTax.png";
import LinkedInIcon from "../assets/LinkedIn.svg";
import MicrosoftIcon from "../assets/Microsoft.svg";
import NPMIcon from "../assets/NPM.png";
import OtherIcon from "../assets/Other.svg";
import PaypalIcon from "../assets/PayPal.svg";
import SBIIcon from "../assets/SBI.webp";
import UANIcon from "../assets/UAN.svg";
import UdemyIcon from "../assets/Udemy.webp";

export default function AccountLogoProvider(props) {
    const { account } = props;
    let logo = OtherIcon;
    switch (account) {
        case "GitHub":
            logo = GitHubIcon;
            break;
        case "Google":
            logo = GoogleIcon;
            break;
        case "IncomeTax":
            logo = IncomeTaxIcon;
            break;
        case "LinkedIn":
            logo = LinkedInIcon;
            break;
        case "NPM":
            logo = NPMIcon;
            break;
        case "Microsoft":
            logo = MicrosoftIcon;
            break;
        case "Paypal":
            logo = PaypalIcon;
            break;
        case "SBI":
            logo = SBIIcon;
            break;
        case "UAN":
            logo = UANIcon;
            break;
        case "Udemy":
            logo = UdemyIcon;
            break;
        default:
            logo = OtherIcon;
    }
    return <img src={logo} alt="logo" className="account-logo" />;
}

