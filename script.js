// ----- Smooth scroll for the menu -----
const menuLinks = document.querySelectorAll("nav a");
menuLinks.forEach(function (link) {
  link.addEventListener("click", function (event) {
    const href = link.getAttribute("href") || "";
    const id = href.startsWith("#") ? href.slice(1) : href;
    const section = id ? document.getElementById(id) : null;
    if (section) {
      event.preventDefault();
      section.scrollIntoView({ behavior: "smooth" });
    }
  });
});

// ----- Reviews (Supabase) -----
const SUPABASE_URL = "https://vqumlvstudrjhbjdthgf.supabase.co";
const SUPABASE_KEY = "sb_publishable_m0FYxBar1NScPT0UjaeFww_2lFoDWrw";

const form = document.getElementById("knight-review-form");
const msg = document.getElementById("review-msg");

let db = null;
try {
  db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
} catch (err) {
  if (msg) msg.textContent = "Could not connect: " + err.message;
}

if (form) {
  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    if (!db) {
      msg.textContent = "Could not connect. Please refresh the page.";
      return;
    }
    const data = new FormData(form);
    const btn = form.querySelector("button");
    btn.disabled = true;
    msg.textContent = "Sending…";

    const { error } = await db.from("reviews").insert({
      name: data.get("name").trim(),
      email: data.get("email").trim() || null,
      rating: Number(data.get("rating")),
      review: data.get("review").trim()
    });

    btn.disabled = false;
    if (error) {
      msg.textContent = "Something went wrong: " + error.message;
      return;
    }
    form.reset();
    msg.textContent = "Thanks! Your review will appear once it is approved.";
  });
}

async function loadReviews() {
  const summary = document.getElementById("summary");
  const list = document.getElementById("review-list");
  if (!db || !summary || !list) return;

  const { data, error } = await db
    .from("reviews")
    .select("name, rating, review, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }
  if (!data || data.length === 0) return;

  const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
  const stars = document.createElement("span");
  stars.className = "stars";
  stars.textContent = "★★★★★";
  summary.textContent = "";
  summary.append(stars, " " + avg.toFixed(1) + " from " + data.length + (data.length === 1 ? " review" : " reviews"));

  list.textContent = "";
  data.slice(0, 12).forEach((r) => {
    const fig = document.createElement("figure");
    fig.className = "review";

    const rate = document.createElement("div");
    rate.className = "stars";
    rate.setAttribute("aria-label", r.rating + " out of 5 stars");
    rate.append("★".repeat(r.rating));
    if (r.rating < 5) {
      const off = document.createElement("span");
      off.className = "off";
      off.textContent = "★".repeat(5 - r.rating);
      rate.append(off);
    }

    const text = document.createElement("p");
    text.textContent = r.review;

    const foot = document.createElement("footer");
    const date = document.createElement("span");
    date.textContent = new Date(r.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" });
    foot.append(r.name, date);

    fig.append(rate, text, foot);
    list.append(fig);
  });
}

loadReviews();
