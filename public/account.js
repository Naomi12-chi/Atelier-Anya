const accountIcon = document.getElementById("accountIcon")
if (accountIcon) {
    accountIcon.addEventListener("click", (event) => {
        event.preventDefault();
        const token = localStorage.getItem("token");
        const role = localStorage.getItem("role")
        if(token && role === "user") {
            window.location.href = "profile.html";
        } else if(token && role === "admin" ) {
            window.location.href = "./admin/index.html"
        } else {
            window.location.href = "login.html"
        }
    })
}