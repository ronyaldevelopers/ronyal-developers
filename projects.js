import { db } from "./firebase-config.js";
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
const gallery = document.querySelector(".gallery");
if (gallery) {
  try {
    const snap = await getDocs(query(collection(db,"projects"),orderBy("createdAt","desc")));
    if (snap.size) {
      gallery.replaceChildren();
      snap.forEach((d) => {
        const p = d.data(), card = document.createElement("article"); card.className = "project";
        const img = document.createElement("img"); img.loading = "lazy"; img.src = p.imageUrl || ""; img.alt = p.title || "Project";
        const label = document.createElement("span"); label.textContent = p.title || "Project";
        card.append(img,label); gallery.append(card);
      });
    }
  } catch (err) { console.error("Projects could not be loaded:",err); }
}