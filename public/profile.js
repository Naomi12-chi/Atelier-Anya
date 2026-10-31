
const profileContainer = document.getElementById("profileContainer");
const logOut = document.getElementById("logout-btn");

const pageMessage = document.getElementById("page-message");

let currentUser = null;
let activeEditor = null;

// LOGOUT
logOut.addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("Id");

    window.location.href = "login.html";
});

// LOAD PROFILE WHEN PAGE OPENS
document.addEventListener("DOMContentLoaded", () => {
    getMyAccount();
});

// GET LOGGED-IN USER
async function getMyAccount() {
    const token = localStorage.getItem("token");
    const id = localStorage.getItem("Id");

    if (!token || !id) {
        window.location.replace("login.html");
        return;
    }

    try {
        const response = await fetch(`/user/myAccount/${id}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem("token");
            localStorage.removeItem("Id");

            window.location.replace("login.html");
            return;
        }

        if (!response.ok) {
            throw new Error("Failed to load profile");
        }

        const result = await response.json();

        currentUser = result;

        renderProfile(result);
        setupProfileEditing();

    } catch (error) {
        console.error("Profile loading error:", error);
        showMessage("Unable to load your profile. Please try again.", "error");
    }
}

// DISPLAY PROFILE DETAILS
function renderProfile(user) {
    const name = user.name || user.userName || "Customer";
    const email = user.email || "";

    document.getElementById("sidebar-name").textContent = name;
    document.getElementById("sidebar-email").textContent = email;

    document.getElementById("avatar").textContent =
        name.trim().charAt(0).toUpperCase() || "A";

    document.getElementById("value-userName").textContent =
        user.name || user.userName || "Not provided";

    document.getElementById("value-email").textContent =
        user.email || "Not provided";

    document.getElementById("value-phone").textContent =
        user.phone || "Not provided";

    // Optional: display these if the corresponding HTML elements exist.
    const roleElement = document.getElementById("account-role");
    if (roleElement) roleElement.textContent = user.role || "Customer";

    const activeElement = document.getElementById("account-status");
    if (activeElement) {
        activeElement.textContent = user.isActive ? "Active" : "Inactive";
    }
}

// STATUS MESSAGE
function showMessage(message, type = "success") {
    if (!pageMessage) {
        console.log(message);
        return;
    }

    pageMessage.textContent = message;
    pageMessage.className = `page-message ${type}`;
    pageMessage.hidden = false;
}

function clearMessage() {
    if (!pageMessage) return;

    pageMessage.textContent = "";
    pageMessage.hidden = true;
}

// OPEN AND CLOSE EDITING
function setupProfileEditing() {
    const profileFields = document.querySelectorAll(".profile-field");

    profileFields.forEach((field) => {
        const updateButton = field.querySelector(".update-btn");
        const form = field.querySelector(".edit-form");
        const cancelButton = field.querySelector(".cancel-btn");

        if (!updateButton || !form || !cancelButton) return;

        const input = form.querySelector("input");

        updateButton.addEventListener("click", () => {
            if (activeEditor && activeEditor !== field) {
                closeEditor(activeEditor);
            }

            clearMessage();

            const key = field.dataset.field;

            // Prefill the input with the current value.
            if (key === "userName") {
                input.value = currentUser.name || currentUser.userName || "";
            } else {
                input.value = currentUser[key] || "";
            }

            form.hidden = false;
            updateButton.hidden = true;
            activeEditor = field;

            input.focus();
        });

        cancelButton.addEventListener("click", () => {
            closeEditor(field);
            clearMessage();
        });

        form.addEventListener("submit", async (event) => {
            event.preventDefault();

            const key = field.dataset.field;
            console.log(key)
            const newValue = input.value.trim();

            if (key !== "phone" && !newValue) {
                showMessage("This field cannot be empty.", "error");
                return;
            }

            const oldValue = key === "name"
                ? (currentUser.name || currentUser.userName || "")
                : (currentUser[key] || "");

            if (newValue === oldValue) {
                closeEditor(field);
                return;
            }

            await updateProfileField(field, key, newValue);
        });
    });
}

function closeEditor(field) {
    const form = field.querySelector(".edit-form");
    const updateButton = field.querySelector(".update-btn");

    form.hidden = true;
    updateButton.hidden = false;

    if (activeEditor === field) {
        activeEditor = null;
    }
}

// SAVE A SINGLE PROFILE FIELD
async function updateProfileField(field, key, newValue) {
    const token = localStorage.getItem("token");
    const id = localStorage.getItem("Id");

    if (!token || !id) {
        window.location.replace("login.html");
        return;
    }

    const form = field.querySelector(".edit-form");
    const input = form.querySelector("input");
    const saveButton = form.querySelector(".save-btn");
    const cancelButton = form.querySelector(".cancel-btn");

    saveButton.disabled = true;
    cancelButton.disabled = true;
    input.disabled = true;
    saveButton.textContent = "Saving...";

    try {
        // IMPORTANT:
        // Replace this URL and method if your existing update route differs.
        const response = await fetch(`/user/profileUpdate/${id}`, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                [key]: newValue
            })
        });
        const data = await response.json()
console.log(data)
        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem("token");
            localStorage.removeItem("Id");

            window.location.replace("login.html");
            return;
        }

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(
                result.message || "Failed to update your profile."
            );
        }

        // If the backend returns the updated user, use that record.
        if (result.user) {
            currentUser = { ...currentUser, ...result.user };
        } else if (result.data) {
            currentUser = { ...currentUser, ...result.data };
        } else {
            // Otherwise update the local display and reload from the server.
            if (key === "userName") {
                currentUser.name = newValue;
            } else {
                currentUser[key] = newValue;
            }
        }

        renderProfile(currentUser);
        closeEditor(field);

        showMessage("Your information has been updated successfully.");

    } catch (error) {
        console.error("Profile update error:", error);
        showMessage(error.message, "error");

    } finally {
        saveButton.disabled = false;
        cancelButton.disabled = false;
        input.disabled = false;
        saveButton.textContent = "Save Changes";
    }
}
