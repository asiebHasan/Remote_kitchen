
const passwordField = document.querySelector("#inputPassword");
const showPasswordToggle = document.querySelector("#showPasswordToggle");

const handleToggleInput = (e) => {
    if (showPasswordToggle.innerHTML == '<i class="fa fa-eye" aria-hidden="true"></i>') {
        showPasswordToggle.innerHTML = '<i class="fa fa-eye-slash" aria-hidden="true"></i>';
        passwordField.setAttribute("type", "password");
    } else {
        showPasswordToggle.innerHTML = '<i class="fa fa-eye" aria-hidden="true"></i>';
        passwordField.setAttribute("type", "text");
    }
}

showPasswordToggle.addEventListener("click", handleToggleInput);