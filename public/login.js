
 // ========================================
 // LOGIN FORM
 // ========================================

 const loginForm = document.getElementById("loginForm");
 const loginEmail = document.getElementById("loginEmail");
 const loginPassword = document.getElementById("loginPassword");
 const loginMessage = document.getElementById("loginMessage");
 const toggleLoginPassword = document.getElementById("toggleLoginPassword");

 // ========================================
 // SHOW / HIDE PASSWORD
 // ========================================

 if (toggleLoginPassword && loginPassword) {
     toggleLoginPassword.addEventListener("click", () => {
         const isPassword = loginPassword.type === "password";

         loginPassword.type = isPassword ? "text" : "password";

         toggleLoginPassword.innerHTML = isPassword
             ? '<i class="fa-regular fa-eye-slash"></i>'
             : '<i class="fa-regular fa-eye"></i>';

         toggleLoginPassword.setAttribute(
             "aria-label",
             isPassword ? "Hide password" : "Show password"
         );
     });
 }

 // ========================================
 // LOGIN SUBMISSION
 // ========================================

 if (loginForm) {
     loginForm.addEventListener("submit", async (event) => {
         event.preventDefault();

         const email = loginEmail.value.trim();
         const password = loginPassword.value;

         if (!email || !password) {
             loginMessage.textContent = "Please fill in all fields.";
             return;
         }

         const submitButton = loginForm.querySelector(
             'button[type="submit"]'
         );

         try {
             submitButton.disabled = true;
             loginMessage.textContent = "Logging in...";

             const response = await fetch("/user/login", {
                 method: "POST",
                 headers: {
                     "Content-Type": "application/json"
                 },
                 body: JSON.stringify({
                     email,
                     password
                 })
             });

             const data = await response.json();

             if (!response.ok) {
                 throw new Error(
                     data.message || "Invalid email or password."
                 );
             }

             // Save authentication details
             localStorage.setItem("token", data.token);

             
                 localStorage.setItem("Id", data.Id);
             

             
              
                 localStorage.setItem("role", data.role);
             

             loginMessage.textContent = "Login successful!";

             // Redirect after successful login
             window.location.href = "index.html";

         } catch (error) {
             console.error("Login error:", error);

             loginMessage.textContent =
                 error.message || "Unable to log in. Please try again.";

         } finally {
             if (submitButton) {
                 submitButton.disabled = false;
             }
         }
     });
 }
