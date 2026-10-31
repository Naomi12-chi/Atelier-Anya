

const logoutButton = document.getElementById("logoutButton");
const totalCustomers = document.getElementById("totalCustomers");
const activeCustomers = document.getElementById("activeCustomers");
const disabledCustomers = document.getElementById("disabledCustomers");
const searchButton = document.getElementById("searchButton");
const userInfo = document.getElementById("userInfo");
const customersTableBody = document.getElementById("customersTableBody")

async function adminCheck() {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "../login.html";
  }
  try {
    const response = await fetch(`/user/adminCheck`, {
      method: "GET",
      headers: {
        Authorization: `bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem("token");
      localStorage.removeItem("Id");
      localStorage.removeItem("role");

      window.location.replace("../login.html");
      return;
    }
    if (!response.ok) {
      window.location.href = "../login.html";
      return false;
    }
    if (response.ok) return true;
  } catch (error) {
    window.location.href = "../login.html";
    return false;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  adminCheck();
});

//log out
logoutButton.addEventListener("click", () => {
  localStorage.removeItem("token");
  localStorage.removeItem("Id");
  localStorage.removeItem("role");

  window.location.href = "../login.html";
});

//all customers total numbers
async function allCustomers() {
  const token = localStorage.getItem("token");
  if (!token) return window.location.href("../login.html");

  try {
    const response = await fetch("/user/users", {
      method: "GET",
      headers: {
        Authorization: `bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.status === 403 || response.status === 401)
      return window.location.href("../login.html");
    const data = await response.json();
    const totalNumbers = data.users.length;
    totalCustomers.textContent = totalNumbers;
  } catch (error) {
    window.location.href = "../login.html";
  }
}

//account status display
async function accountStatus() {
  console.log("ran");
  const token = localStorage.getItem("token");
  if (!token) return (window.location.href = "../login.html");
  let active = 0;
  let unActive = 0;
  try {
    const response = await fetch("/user/users", {
      method: "GET",
      headers: {
        Authorization: `bearer ${token}`,
      },
    });
    const result = await response.json();
    const users = result.users
   users.forEach((user) => {
if (user.isActive === false) {
      unActive++;
    } else {
      active++;
    }
    activeCustomers.textContent = active;
    disabledCustomers.textContent = unActive;
   })
    
  } catch (error) {
    console.log(error);
  }
}

//get account by admin
async function getAccount() {
    const token = localStorage.getItem("token");
    if (!token) return window.location.href = "../login.html";
    const email = document.getElementById("customerSearch").value;
    
    try {
        const response = await fetch (`/user/getUser/${email}`, {
            method: "GET",
            headers: {
                Authorization: `bearer ${token}`
            }
        });
        const data = await response.json();
        const user = data.user
        userInfo.innerHTML = `
        <h3>Name: ${user.name}</h3>
        <h4>Email: ${user.email}</h4>
        <p>Role: ${user.role}<p>
        <p>isActive: ${user.isActive}</p>
        `
         
        
    } catch(error) {
console.log(error)
    }
}

searchButton.addEventListener("click", getAccount);

async function getUsers() {
    const token = localStorage.getItem("token");
    if(!token) return window.location.href = "../login.html"

    try {
        const response = await fetch("/user/users", {
            method: "GET",
            headers: {
                Authorization: `bearer ${token}`
            }
        })
        const result = await response.json();
        const users = result.users;

        users.forEach((user) => {
            const row = document.createElement("tr");
            const nameCell = document.createElement("td");
            nameCell.textContent = user.name;
            const emailCell = document.createElement("td");
            emailCell.textContent = user.email;
            const isActiveCell = document.createElement("td");
            isActiveCell.textContent = user.isActive;
            const roleCell = document.createElement("td")
            roleCell.textContent = user.role;

            row.appendChild(nameCell);
            row.appendChild(emailCell);
            row.appendChild(isActiveCell);
            row.appendChild(roleCell);

            customersTableBody.appendChild(row)
            
        })
    } catch(error) {
        console.error(error)
    }
}



allCustomers();
accountStatus();
getUsers();

