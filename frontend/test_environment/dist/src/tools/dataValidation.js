const validateData = (data, pattern) => {
    return pattern.test(data);
};
const checkForForbiddenCharacters = (data, word) => {
    if (validateData(data, /['";#\\]/)) {
        Swal.fire({
            title: 'Error!',
            text: "The " + word + " contains one of the forbidden characters: (', \", ;, #, \\)",
            icon: 'error',
        });
        return true;
    }
    return false;
};
export const emailValidation = (data) => {
    if (!data) {
        Swal.fire({
            title: 'Error!',
            text: "The email field cannot be empty!",
            icon: 'error',
        });
        return false;
    }
    if (checkForForbiddenCharacters(data, "email"))
        return false;
    if (!validateData(data, /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)) {
        Swal.fire({
            title: 'Error!',
            text: 'The email is not in the correct format!',
            icon: 'error',
        });
        return false;
    }
    return true;
};
export const passwordValidation = (password) => {
    if (checkForForbiddenCharacters(password, "password"))
        return true;
    return false;
};
export const loginPasswordValidation = (password) => {
    if (!password) {
        Swal.fire({
            title: 'Error!',
            text: "The password field cannot be empty!",
            icon: 'error',
        });
        return false;
    }
    if (checkForForbiddenCharacters(password, "password"))
        return false;
    if (!validateData(password, /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)) {
        Swal.fire({
            title: 'Error!',
            text: 'The password is not in the correct format! Try again!',
            icon: 'error',
        });
        return false;
    }
    return true;
};
export const registerPasswordValidation = (password, passwordConfirmation) => {
    if (!password || !passwordConfirmation) {
        Swal.fire({
            title: 'Error!',
            text: "The password fields cannot be empty!",
            icon: 'error',
        });
        return false;
    }
    if (password !== passwordConfirmation) {
        Swal.fire({
            title: 'Error!',
            text: "The passwords don't match!",
            icon: 'error',
        });
        return false;
    }
    if (checkForForbiddenCharacters(password, "password"))
        return false;
    if (!validateData(password, /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)) {
        Swal.fire({
            title: 'Error!',
            text: 'The password is not in the correct format! Your password needs to contain at least: 1 lowercase letter, 1 uppercase letter, 1 digit, one special character (@$!%*?&) and needs to be at least 8 characters long.',
            icon: 'error',
        });
        return false;
    }
    return true;
};
export const usernameValidation = (data) => {
    if (!data) {
        Swal.fire({
            title: 'Error!',
            text: "The username field cannot be empty!",
            icon: 'error',
        });
        return false;
    }
    if (checkForForbiddenCharacters(data, "username"))
        return false;
    if (!validateData(data, /^(?!.*[_.]{2})[a-zA-Z0-9](?:[a-zA-Z0-9._]{1,14}[a-zA-Z0-9])?$/)) {
        Swal.fire({
            title: 'Error!',
            text: 'The username is not in the correct format! Your username cannot have consecutive dots or underscored, must start with a letter or a number, cannot end in _ or . and has to be between 3 and 16 characters.',
            icon: 'error',
        });
        return false;
    }
    return true;
};
