const restaurantSelect = document.getElementById('restaurants')
const usernameField = document.querySelector("#inputUsername");
const userFeedbackArea = document.querySelector(".username-feedback");
const emailField = document.querySelector("#inputEmail");
const emailFeedbackArea = document.querySelector(".email-feedback");
const passwordField = document.querySelector("#inputPassword");
const showPasswordToggle = document.querySelector("#showPasswordToggle");
const submitBtn = document.querySelector("#submitBtn");

document.addEventListener('DOMContentLoaded', function () {
    restaurantSelect.addEventListener('change', function () {
        const selectedRestaurantId = this.value
        console.log(selectedRestaurantId)
        fetchEmployees(selectedRestaurantId)
    })
    fetchEmployees(restaurantSelect.value)
})

function fetchEmployees(restaurantId) {
    console.log('called')
    fetch(`api/employee/?id=${restaurantId}`)
        .then((response) => response.json())
        .then((data) => {
            console.log(data) // Log the data to inspect its structure
            const tableBody = document.getElementById('employeeList').getElementsByTagName('tbody')[0]
            tableBody.innerHTML = ''
            data.forEach((employee) => {
                const row = tableBody.insertRow(-1)
                const cell1 = row.insertCell(0)
                const cell2 = row.insertCell(1)
                const cell3 = row.insertCell(2)
                cell1.innerHTML = employee['employee__username']
                cell2.innerHTML = employee['employee__email']
                cell3.innerHTML = employee['employee__date_joined']
            })
        })
        .catch((error) => console.error('Error fetching Employees:', error))
}

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

usernameField.addEventListener("keyup", () => {
    validateUsername();
});

emailField.addEventListener("keyup", () => {
    validateEmail();
});

passwordField.addEventListener("keyup", () => {
    validatePassword();
});

function validateUsername() {
    const usernameVal = usernameField.value;

    if (usernameVal.length > 0) {
        fetch("/accounts/validate-username/", {
            body: JSON.stringify({ username: usernameVal }),
            method: "POST",
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.username_error) {
                    usernameField.classList.add("is-invalid");
                    userFeedbackArea.style.display = "block";
                    userFeedbackArea.innerHTML = `<p>${data.username_error}</p>`;
                    disableSubmit();
                } else {
                    usernameField.classList.remove("is-invalid");
                    usernameField.classList.add("is-valid");
                    userFeedbackArea.style.display = "none";
                    checkEnableSubmit();
                }
            });
    }
}

function validateEmail() {
    const emailVal = emailField.value;

    if (emailVal.length > 0) {
        fetch("/accounts/validate-email/", {
            body: JSON.stringify({ email: emailVal }),
            method: "POST",
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.email_error) {
                    emailField.classList.add("is-invalid");
                    emailFeedbackArea.style.display = "block";
                    emailFeedbackArea.innerHTML = `<p>${data.email_error}</p>`;
                    disableSubmit();
                } else {
                    emailField.classList.remove("is-invalid");
                    emailField.classList.add("is-valid");
                    emailFeedbackArea.style.display = "none";
                    checkEnableSubmit();
                }
            })
    }
}

function validatePassword() {
    // Add your password validation logic here
    const passwordVal = passwordField.value;

    // For illustration purposes, let's assume a simple validation
    if (passwordVal.length < 8) {
        passwordField.classList.add("is-invalid");
        // Add feedback or error message display logic if needed
        disableSubmit();
    } else {
        passwordField.classList.remove("is-invalid");
        passwordField.classList.add("is-valid");
        // Clear any previous error messages or feedback
        // Add additional validation logic if needed
        checkEnableSubmit();
    }
}

function checkEnableSubmit() {
    const isUsernameValid = !usernameField.classList.contains("is-invalid");
    const isEmailValid = !emailField.classList.contains("is-invalid");
    const isPasswordValid = !passwordField.classList.contains("is-invalid");

    submitBtn.disabled = !(isUsernameValid && isEmailValid && isPasswordValid);
}

function disableSubmit() {
    submitBtn.disabled = true;
}


document.getElementById('add-employee').addEventListener('submit', function (event) {
    event.preventDefault();


    const formData = new FormData(this);
    const fetchUrl = `/accounts/register/`;
    const fetchOptions = {
        method: 'POST',
        headers: {
            'X-CSRFToken': formData.get('csrfmiddlewaretoken'),
        },
        body: formData,
    };

    formData.append('is_employee', 'true');
    formData.append('restaurant_id', restaurantSelect.value);

    fetch(fetchUrl, fetchOptions)
        .then(response => response.json())
        .then(data => {
            console.log('Registration result:', data);
            document.getElementById('add-employee').reset()
            fetchEmployees(restaurantSelect.value)
        })
        .catch(error => {
            console.error('Error during registration:', error);
        });

});
