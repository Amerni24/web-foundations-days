console.log("users.js loaded");

const API_URL = "https://jsonplaceholder.typicode.com/users";

const loadBtn = document.querySelector("#load-users");
const filterInput = document.querySelector("#filter-input");
const statusText = document.querySelector("#status");
const usersList = document.querySelector("#users-list");

let users = []; // all loaded users are stored here

async function loadUsers() {
  statusText.textContent = "Loading users...";
  loadBtn.disabled = true;
  usersList.innerHTML = "";

  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}`);
    }

    users = await response.json();
    renderUsers(users);
    statusText.textContent = `Loaded ${users.length} users.`;
  } catch (error) {
    statusText.textContent = "Could not load users. Please try again.";
    console.error(error);
  } finally {
    loadBtn.disabled = false;
  }
}

function renderUsers(list) {
  usersList.innerHTML = "";

  if (list.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No users match your filter.";
    usersList.appendChild(li);
    return;
  }

  list.forEach((user) => {
    const li = document.createElement("li");
    li.textContent = `${user.name} | ${user.email} | ${user.address.city} | ${user.company.name}`;
    usersList.appendChild(li);
  });
}

loadBtn.addEventListener("click", loadUsers);

filterInput.addEventListener("input", () => {
  const text = filterInput.value.trim().toLowerCase();
  const filtered = users.filter((user) =>
    user.name.toLowerCase().includes(text)
  );
  renderUsers(filtered);
});