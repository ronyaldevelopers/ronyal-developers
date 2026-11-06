import { auth, db } from "./firebase-config.js";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { collection, addDoc, getDocs, query, orderBy, doc, updateDoc, deleteDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const ADMIN_UID = "vuU33Mp4WhaMB5RW8R9qbb8UOC83";
const $ = (id) => document.getElementById(id);
const loginPanel = $("loginPanel"), managePanel = $("managePanel");
let projects = [];
let existingImageUrl = "";


async function compressImage(file) {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file.");
  const source = await new Promise((resolve,reject) => {
    const reader = new FileReader();
    reader.onload = () => { const img = new Image(); img.onload = () => resolve(img); img.onerror = reject; img.src = reader.result; };
    reader.onerror = reject; reader.readAsDataURL(file);
  });
  const canvas = document.createElement("canvas");
  const scale = Math.min(1, 1200 / Math.max(source.width, source.height));
  canvas.width = Math.round(source.width * scale); canvas.height = Math.round(source.height * scale);
  const ctx = canvas.getContext("2d"); ctx.drawImage(source,0,0,canvas.width,canvas.height);
  let quality = 0.78, data = canvas.toDataURL("image/jpeg",quality);
  while (data.length > 650000 && quality > 0.35) { quality -= 0.08; data = canvas.toDataURL("image/jpeg",quality); }
  if (data.length > 650000) throw new Error("Photo bohat bari hai. Choti image select karein.");
  return data;
}
function status(id, message) { $(id).textContent = message; }
function clearForm() {
  $("projectForm").reset(); $("projectId").value = ""; existingImageUrl = ""; $("imagePreview").textContent = ""; $("saveBtn").textContent = "Add project";
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
    edit.addEventListener("click", () => { $("projectId").value = p.id; $("title").value = p.title || ""; $("category").value = p.category || ""; existingImageUrl = p.imageUrl || ""; $("imagePreview").textContent = existingImageUrl ? "Current project photo is saved. Select another photo only if you want to replace it." : "No photo saved."; $("description").value = p.description || ""; $("saveBtn").textContent = "Save changes"; window.scrollTo({top:0,behavior:"smooth"}); });
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
  try {
    const file = $("imageFile").files[0];
    let imageUrl = existingImageUrl;
    if (file) imageUrl = await compressImage(file);
    if (!imageUrl) throw new Error("Please select a project photo from your gallery.");
    const data = { title:$("title").value.trim(), category:$("category").value.trim(), imageUrl, description:$("description").value.trim(), updatedAt:serverTimestamp() };
    const id = $("projectId").value;
    if (id) await updateDoc(doc(db,"projects",id),data);
    else await addDoc(collection(db,"projects"),{...data,createdAt:serverTimestamp()});
    clearForm(); status("manageStatus","Project saved."); await loadProjects();
  } catch(err) { console.error("Project save error:", err); let detail = err?.message || err?.code || (typeof err === "string" ? err : "Unknown error. Check internet connection and Firebase settings."); if (err?.code) detail = err.code + " — " + detail; status("manageStatus","Could not save: " + detail); }
});
onAuthStateChanged(auth, async (user) => {
  if (!user) { loginPanel.classList.remove("hidden"); managePanel.classList.add("hidden"); return; }
  if (user.uid !== ADMIN_UID) { await signOut(auth); status("loginStatus","This account is not authorised as the website admin."); return; }
  loginPanel.classList.add("hidden"); managePanel.classList.remove("hidden");
  try { await loadProjects(); } catch(err) { status("manageStatus","Could not load projects: " + err.message); }
});