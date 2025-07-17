export const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    console.log("The token is: ", value);
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2)
        return parts.pop()?.split(";").shift() || null;
    return null;
};
export const togglePassword = () => {
    const input = document.querySelector('#password');
    const inputConfirmation = document.querySelector('#passwordConfirmation');
    const shouldShow = input.type === 'password' || (inputConfirmation && inputConfirmation.type === 'password');
    input.type = shouldShow ? 'text' : 'password';
    if (inputConfirmation) {
        inputConfirmation.type = shouldShow ? 'text' : 'password';
    }
};
