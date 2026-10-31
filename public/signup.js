const form = document.querySelector("#signupForm");
const signupMessage = document.querySelector("#signupMessage");
const togglePassword = document.querySelector("#togglePassword");
const toggleConfirmPassword = document.querySelector("#toggleConfirmPassword");
 const loginForm = document.getElementById("loginForm");
// const signupPassword = document.querySelector("#signupPassword");
// const confirmPassword = document.querySelector("#confirmPassword");

// sign up into atelier anya
// form.addEventListener("submit", async (event) => {
//   event.preventDefault();
//   const email = document.getElementById("email").value;
//   const password = document.getElementById("password").value;
//   const fullName = document.getElementById("fullName").value;

//   const response = await fetch("/user", {
//     method: "POST",
//     headers: {
//         "Content-Type": "application/json"
//     },
//     body: JSON.stringify({
//         email: email,
//         password: password,
//         name: fullName
//     })
//   });

//   const data = await response.json();
//   console.log(data);
//   form.reset();
//   alert("Your account has been created successfully, proceed to log in")

//   if (togglePassword) {
//     togglePassword.addEventListener("click", () => {
//         if (password.type === "password") {
//             password.type = "text";
//             togglePassword.innerHTML =
//                 '<i class="fa-regular fa-eye-slash"></i>';
//         } else {
//             password.type = "password";
//             togglePassword.innerHTML =
//                 '<i class="fa-regular fa-eye"></i>';
//         }
//     });
// }
// });

// if (toggleConfirmPassword) {
//     toggleConfirmPassword.addEventListener("click", () => {
//         if (confirmPassword.type === "password") {
//             confirmPassword.type = "text";
//             toggleConfirmPassword.innerHTML ='<i class="fa-regular fa-eye-slash"></i>';
//         } else {
//             confirmPassword.type = "password";
//             toggleConfirmPassword.innerHTML ='<i class="fa-regular fa-eye"></i>';
//         }
//     });
// }
// if (signupForm) {
//     form.addEventListener("submit", (event) => {
//         event.preventDefault();
//         const firstName = document.querySelector("#firstName").value.trim();
//         const lastName = document.querySelector("#lastName").value.trim();
//         const email = document.querySelector("#signupEmail").value.trim();
//         const password = signupPassword.value;
//         const confirmPasswordValue = confirmPassword.value;
//         signupMessage.textContent = "";
//         if (
//             !firstName ||
//             !lastName ||
//             !email ||
//             !password ||
//             !confirmPasswordValue
//         ) {
//             signupMessage.textContent =
//                 "Please fill in all fields.";
//             signupMessage.style.color = "#d62828";
//             return;
//         }
//         const emailPattern =
//             /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//         if (!emailPattern.test(email)) {

//             signupMessage.textContent = "Please enter a valid email address.";
//             signupMessage.style.color = "#d62828";
//             return;
//         }
//         if (password.length < 8) {
//             signupMessage.textContent = "Password must be at least 8 characters.";
//             signupMessage.style.color = "#d62828";
//             return;
//         }
//         if (password !== confirmPasswordValue) {
//             signupMessage.textContent = "Passwords do not match.";
//             signupMessage.style.color = "#d62828";
//             return;
//         }
//         signupMessage.textContent = "Your information is valid. Account creation will be connected to the server soon.";
//         signupMessage.style.color = "#2e8b57";
//     });
// }
// // =========================
// // LOGIN to existing account

// // =========================

loginForm.addEventListener("submit", async(event )=> {
    event.preventDefault()
    console.log("ran")

 const email = document.getElementById("loginEmail").value;
 const password = document.getElementById("loginPassword").value;
 const response = await fetch ("/user/login", {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
        email, password
    })
    
 })
 console.log(response)
const data = await response.json();
 const loginMessage = document.querySelector("#loginMessage");

const toggleLoginPassword = document.querySelector("#toggleLoginPassword");

if (toggleLoginPassword) {

    toggleLoginPassword.addEventListener("click", () => {

        if (loginPassword.type === "password") {

            loginPassword.type = "text";

            toggleLoginPassword.innerHTML =
                '<i class="fa-regular fa-eye-slash"></i>';

        } else {

            loginPassword.type = "password";

            toggleLoginPassword.innerHTML =
                '<i class="fa-regular fa-eye"></i>';

        }

    });

}
localStorage.setItem("token", data.token)
localStorage.setItem("Id", data.Id)
localStorage.setItem("role", data.role)
})

//         // =========================
//         // CLEAR MESSAGE
//         // =========================

//         loginMessage.textContent = "";


//         // =========================
//         // CHECK FIELDS
//         // =========================

//         if (!email || !password) {

//             loginMessage.textContent =
//                 "Please enter your email and password.";

//             loginMessage.style.color = "#d62828";

//             return;
//         }


//         // =========================
//         // CHECK EMAIL
//         // =========================

//         const emailPattern =
//             /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

//         if (!emailPattern.test(email)) {

//             loginMessage.textContent =
//                 "Please enter a valid email address.";

//             loginMessage.style.color = "#d62828";

//             return;
//         }


//         // =========================
//         // FRONTEND VALIDATION COMPLETE
//         // =========================

//         loginMessage.textContent =
//             "Your information is valid. Login will be connected to the server soon.";

//         loginMessage.style.color = "#2e8b57";

//     });

// }