import { auth, db } from "./firebase-config.js";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { collection, addDoc, getDocs, query, orderBy, doc, updateDoc, deleteDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const ADMIN_UID = "vuU33Mp4WhaMB5RW8R9qbb8UOC83";
const $ = (id) => document.getElementById(id);
const loginPanel = $("loginPanel"), managePanel = $("managePanel");
let projects = [];

function status(id, message) { $(id).textContent = message; }
function clearForm() {
  $("projectForm").reset(); $("projectId").value = ""; $("saveBtn").textContent = "Add project";
}
function renderProjects() {
  const list = $("projectList");
  if (!projects.length) { list.innerHTML = '<p class="muted">No projects added yet.</p>'; return; }
  list.replaceChildren();
  projects.forEach((p) => {
    const item = document.createElement("article"); item.className = "item";
    const title = document.createElement("strong"); title.textContent = p.title || "Untitled";
    const meta = document.createElement("small"); meta.textContent = " · " + (p.category || "Project");
    const desc = document.createElement("p"); desc.className = "muted"; desc.textContent = p.description || "";
    item.append(title, meta, desc);
    if (p.imageUrl) { const img = document.createElement("img"); img.src = p.imageUrl; img.alt = p.title || "Project"; img.loading = "lazy"; item.append(img); }
    const edit = document.createElement("button"); edit.className = "secondary"; edit.textContent = "Edit";
    edit.addEventListener("click", () => { $("projectId").value = p.id; $("title").value = p.title || ""; $("category").value = p.category || ""; $("imageUrl").value = p.imageUrl || ""; $("description").value = p.description || ""; $("saveBtn").textContent = "Save changes"; window.scrollTo({top:0,behavior:"smooth"}); });
    const del = document.createElement("button"); del.className = "danger"; del.textContent = "Delete";
    del.addEventListener("click", async () => { if (!confirm("Delete this project?")) return; try { await deleteDoc(doc(db,"projects",p.id)); status("manageStatus","Project deleted."); await loadProjects(); } catch(e) { status("manageStatus",e.message); } });
    item.append(edit, del); list.append(item);
  });
}
async function loadProjects() {
  const snap = await getDocs(query(collection(db,"projects"), orderBy("createdAt","desc")));
  projects = snap.docs.map(d => ({id:d.id,...d.data()})); renderProjects();
}
$("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault(); status("loginStatus","Signing in…");
  try { await signInWithEmailAndPassword(auth,$("email").value.trim(),$("password").value); }
  catch(err) { status("loginStatus","Login failed: " + err.message); }
});
$("logoutBtn").addEventListener("click", () => signOut(auth));
$("clearBtn").addEventListener("click", clearForm);
$("projectForm").addEventListener("submit", async (e) => {
  e.preventDefault(); status("manageStatus","Saving…");
  const data = { title:$("title").value.trim(), category:$("category").value.trim(), imageUrl:$("imageUrl").value.trim(), description:$("description").value.trim(), updatedAt:serverTimestamp() };
  try {
    const id = $("projectId").value;
    if (id) await updateDoc(doc(db,"projects",id),data);
    else await addDoc(collection(db,"projects"),{...data,createdAt:serverTimestamp()});
    clearForm(); status("manageStatus","Project saved."); await loadProjects();
  } catch(err) { status("manageStatus","Could not save: " + err.message); }
});
onAuthStateChanged(auth, async (user) => {
  if (!user) { loginPanel.classList.remove("hidden"); managePanel.classList.add("hidden"); return; }
  if (user.uid !== ADMIN_UID) { await signOut(auth); status("loginStatus","This account is not authorised as the website admin."); return; }
  loginPanel.classList.add("hidden"); managePanel.classList.remove("hidden");
  try { await loadProjects(); } catch(err) { status("manageStatus","Could not load projects: " + err.message); }
});