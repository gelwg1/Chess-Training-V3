import './style.css'

const backendUrl = import.meta.env.VITE_BACKEND_URL;

async function loadUsers() {
  const res = await fetch(`${backendUrl}/api/puzzles`);
  console.log(`${backendUrl}/api/puzzles`)
  const data = await res.json();

  const list = document.getElementById("puzzlesList");
  list.innerHTML = "";

  data.forEach(puzzle => {
    const li = document.createElement("li");
    li.textContent = puzzle.fen;   // assuming "users" has "name"
    list.appendChild(li);
  });
}

document.getElementById("loadPuzzles").addEventListener("click", loadUsers);

