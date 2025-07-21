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
export const provideUserFeedback = (response) => {
    if (response.message) {
        switch (response.message) {
            case 'User updated successfully':
                Swal.fire({
                    title: 'Yay!',
                    text: 'Your profile has been updated!',
                    icon: 'success',
                });
                break;
            case 'New email has to be verified before it can be updated':
                Swal.fire({
                    title: 'Yay!',
                    text: 'Profile updated successfully, but the new email has to be verified before the changes are confirmed',
                    icon: 'success',
                });
                break;
        }
    }
    else if (response.error) {
        switch (response.error) {
            case 'Forbidden: You can only modify your own profile':
                Swal.fire({
                    title: 'Oops!',
                    text: 'You can only modify your own profile',
                    icon: 'error',
                });
                break;
            case 'User not found':
                Swal.fire({
                    title: 'Oops!',
                    text: 'No user is found in the database!',
                    icon: 'error',
                });
                break;
            case 'Old password required':
                Swal.fire({
                    title: 'Oops!',
                    text: 'You need to enter your old password!',
                    icon: 'error',
                });
                break;
            case 'Incorrect old password':
                Swal.fire({
                    title: 'Oops!',
                    text: 'The old password is incorrect!',
                    icon: 'error',
                });
                break;
            case 'Nickname can only contain printable characters':
                Swal.fire({
                    title: 'Oops!',
                    text: 'Nickname can only contain printable characters!',
                    icon: 'error',
                });
                break;
            case 'Password must contain at least 1 uppercase and 1 lowercase letter, 1 digit, 1 special character and be at least 8 characters long':
                Swal.fire({
                    title: 'Oops!',
                    text: 'Password must contain at least 1 uppercase and 1 lowercase letter, 1 digit, 1 special character and be at least 8 characters long!',
                    icon: 'error',
                });
                break;
            case 'Invalid email format':
                Swal.fire({
                    title: 'Oops!',
                    text: 'Invalid email format!',
                    icon: 'error',
                });
                break;
            case 'Failed to update user':
                Swal.fire({
                    title: 'Oops!',
                    text: 'Something went wrongm try again later!',
                    icon: 'error',
                });
                break;
        }
    }
};
