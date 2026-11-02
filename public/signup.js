// ========================================
// SIGNUP FORM
// ========================================

const signupForm = document.getElementById("signupForm");

if (signupForm) {
    signupForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const fullNameInput = document.getElementById("fullName");
        const emailInput = document.getElementById("email");
        const passwordInput = document.getElementById("password");
        const termsInput = document.getElementById("terms");
        const signupMessage = document.getElementById("signupMessage");

        const fullName = fullNameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!fullName || !email || !password) {
            showSignupMessage("Please complete all required fields.", false);
            return;
        }

        if (!termsInput.checked) {
            showSignupMessage("Please agree to the Terms & Conditions.", false);
            return;
        }

        const submitButton = signupForm.querySelector('button[type="submit"]');

if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Creating Account...";
}
        try {
            const response = await fetch("/user/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: fullName,
                    email,
                    password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to create your account."
                );
            }

            showSignupMessage(
                "Account created successfully! Redirecting to login...",
                true
            );

            signupForm.reset();

            setTimeout(() => {
                window.location.href = "login.html";
            }, 1500);

        } catch (error) {
            console.error("Signup error:", error);

            showSignupMessage(
                error.message || "Something went wrong. Please try again.",
                false
            );

        }
            finally {
    if (submitButton) {
        submitButton.disabled = false;
        submitButton.innerHTML = `
            Create Account
            <i class="fa-solid fa-arrow-right"></i>
        `;
    }
}
        
    });
}


// ========================================
// SIGNUP MESSAGE
// ========================================

function showSignupMessage(message, success) {
    const signupMessage = document.getElementById("signupMessage");

    if (signupMessage) {
        signupMessage.textContent = message;
        signupMessage.style.color = success ? "#2e8b57" : "#d62828";
    } else {
        alert(message);
    }
}


// ========================================
// PASSWORD VISIBILITY TOGGLE
// ========================================

const togglePassword = document.getElementById("togglePassword");

if (togglePassword) {
    togglePassword.addEventListener("click", () => {
        const passwordInput = document.getElementById("password");

        const isPasswordHidden = passwordInput.type === "password";

        passwordInput.type = isPasswordHidden ? "text" : "password";

        togglePassword.innerHTML = isPasswordHidden
            ? '<i class="fa-regular fa-eye-slash"></i>'
            : '<i class="fa-regular fa-eye"></i>';
    });
}

