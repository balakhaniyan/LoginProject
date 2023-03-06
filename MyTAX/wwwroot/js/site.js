class InputLabel {
    constructor(input) {
        this.input = input;
        this.label = input.parentNode.querySelector("label");
        this.label.style.top = "0";
        this.label.style.fontSize = "0.7rem";
        this.input.addEventListener("focus", () => this.onFocus());
        this.input.addEventListener("blur", () => this.onBlur());
        this.input.addEventListener("keyup", () => this.onKeyUp());
    }
    onFocus() {
        this.label.style.top = "-1rem";
        this.label.style.fontSize = "0.5rem";
    }
    onBlur() {
        if (this.input.value === "") {
            this.label.style.top = "0";
            this.label.style.fontSize = "0.7rem";
        }
    }
    onKeyUp() {
        if (this.input.value === "") {
            this.label.style.top = "0";
            this.label.style.fontSize = "0.7rem";
        } else {
            this.label.style.top = "-1rem";
            this.label.style.fontSize = "0.5rem";
        }
    }
}

class Password {
    static checkUpper(password) {
        return /[A-Z]/.test(password);
    }
    static checkLower(password) {
        return /[a-z]/.test(password);
    }
    static checkDigit(password) {
        return /[0-9]/.test(password);
    }
    static checkSymbol(password, specialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/) {
        return specialChars.test(password);
    }
    static checkLength(password, length = 8) {
        return password.length >= length;
    }
    static checkPassword(password, config) {
        let problems = {};
        if (config.RequiredUppercase && !Password.checkUpper(password)) {
            problems.upper = true;
        }
        if (config.RequiredLowercase && !Password.checkLower(password)) {
            problems.lower = true;
        }
        if (config.RequiredDigit && !Password.checkDigit(password)) {
            problems.digit = true;
        }
        if (config.RequiredSymbol && !Password.checkSymbol(password)) {
            problems.symbol = true;
        }
        if (!Password.checkLength(password, config.MinLength)) {
            problems.length = true;
        }
        return problems;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".input-holder input").forEach(input => new InputLabel(input));
});