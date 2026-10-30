
/* SETTINGS */
const CONFIG = {
  email:"contact@wafflescreative.com",
  playlistUrl:"",
  products:[
    {
      id:"hoodie",
      colors:[{name:"Pink",hex:"#f5a0cb"}],
      name:"Sweet and Drippy Hoodie",
      description:"Pink oversized hoodie",
      price:null,
      image:"",
      sizes:["XS","S","M","L","XL","2XL","3XL"]
    },
    {
      id:"pants",
      name:"Sweet and Drippy Sweatpants",
      description:"Pink relaxed-fit sweatpants",
      price:null,
      image:"",
      sizes:["XS","S","M","L","XL","2XL","3XL"]
    },
    {
      id:"set",
      name:"Sweet and Drippy Matching Set",
      description:"Matching pink hoodie and sweatpants. Save 10% as a set.",
      price:null,
      bundleDiscount:0.10,
      image:"",
      sizes:["XS","S","M","L","XL","2XL","3XL"],
      isSet:true
    },
    {
      id:"hat",
      name:"Sweet and Drippy Hat",
      description:"Pink hat",
      price:null,
      image:"",
      sizes:["One Size"]
    }
  ]
};

const $ = id => document.getElementById(id);
const products = CONFIG.products;

let currentProduct = null;
let chosenSize = "";
let chosenPantsSize = "";
let chosenColor = "";
let previousWaffleCount = 0;

function esc(s) {
  return String(s).replace(/[&<>"']/g,c=>({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    '"':"&quot;",
    "'":"&#39;"
  })[c]);
}

function money(n) {
  return "$"+Number(n).toFixed(2);
}

function actualProductPrice(p) {
  if(!p) return null;
  if(typeof p.price === "number") return p.price;
  if(p.isSet && typeof p.bundleDiscount === "number") {
    const hoodie = products.find(item => item.id === "hoodie");
    const pants = products.find(item => item.id === "pants");
    if(typeof hoodie?.price === "number" && typeof pants?.price === "number") {
      return Math.round((hoodie.price + pants.price) * (1 - p.bundleDiscount) * 100) / 100;
    }
  }
  return null;
}

function price(p) {
  const value = actualProductPrice(p);
  return typeof value === "number" ? money(value) : "Price coming soon";
}

function load(key) {
  try {
    const v = JSON.parse(localStorage.getItem(key));
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function save(key,data) {
  try {
    localStorage.setItem(key,JSON.stringify(data));
  } catch {}
}

/* WAFFLE DRAWING */
const WAFFLE_SVG = `
<svg viewBox="0 0 40 40"
 xmlns="http://www.w3.org/2000/svg"
 aria-hidden="true">
  <rect x="4" y="4" width="32" height="32" rx="7"
    fill="#e8a654" stroke="#b96c35" stroke-width="2"/>
  <rect x="9" y="9" width="22" height="22" rx="3"
    fill="#f8c878"/>
  <path d="M16 9V31 M24 9V31 M9 16H31 M9 24H31"
    fill="none" stroke="#bf7a3b" stroke-width="2.8"/>
</svg>`;

$("mascot-flying").innerHTML = WAFFLE_SVG;

/* Original supplied WC mark used as white-thread hoodie embroidery on product illustrations. */
const WC_EMBROIDERY_LOGO = "data:image/webp;base64,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";

/* CLOTHING ART PLACEHOLDERS */
function art(id) {
  if(id === "hat") return `
<svg class="product-art" viewBox="0 0 300 350" aria-hidden="true">
  <path d="M73 213 C77 146 112 111 157 112 C211 112 239 153 239 216 Z"
        fill="#f5a0cb" stroke="#db75a6" stroke-width="4"/>
  <path d="M71 214 C124 197 193 199 258 222
           C231 251 174 254 128 242 C101 237 81 228 71 214 Z"
        fill="#f8b7d8" stroke="#db75a6" stroke-width="4"/>
  <path d="M157 115 L157 206" fill="none"
        stroke="#db75a6" stroke-width="3"/>
</svg>`;

  if(id === "pants") return `
    <svg class="product-art" viewBox="0 0 300 350">
      <path d="M77 32H223L250 319H173L150 162L127 319H50Z"
        fill="#f5a0cb" stroke="#db75a6" stroke-width="3"/>
      <path d="M77 47H223" stroke="#d67ba6" stroke-width="8"/>
      <text x="95" y="138" fill="white" font-size="13">SWEET</text>
      <text x="95" y="158" fill="white" font-size="13">&amp; DRIPPY</text>
    </svg>`;

  if(id === "set") return `
    <svg class="product-art" viewBox="0 0 300 350">
      <path d="M105 45Q150 0 195 45L245 78L275 173L230 188L211 125L214 234H86L89 125L70 188L25 173L55 78Z"
        fill="#f5a0cb" stroke="#db75a6" stroke-width="3"/>
      <path d="M105 45Q150 110 195 45Q150 0 105 45Z"
        fill="#f8b7d8" stroke="#db75a6" stroke-width="3"/>
      <image class="embroidery-logo" x="113" y="109" width="74" height="50"
        href="${WC_EMBROIDERY_LOGO}" preserveAspectRatio="xMidYMid meet"/>
      <path d="M92 239H208L230 339H166L150 275L134 339H70Z"
        fill="#f5a0cb" stroke="#db75a6" stroke-width="3"/>
    </svg>`;

  return `
    <svg class="product-art" viewBox="0 0 300 350">
      <path d="M105 68Q150 9 195 68L250 96L285 245L233 260L216 167L224 324H76L84 167L67 260L15 245L50 96Z"
        fill="#f5a0cb" stroke="#db75a6" stroke-width="3"/>
      <path d="M105 68Q150 149 195 68Q150 9 105 68Z"
        fill="#f8b7d8" stroke="#db75a6" stroke-width="3"/>
      <image class="embroidery-logo" x="113" y="166" width="75" height="51"
        href="${WC_EMBROIDERY_LOGO}" preserveAspectRatio="xMidYMid meet"/>
    </svg>`;
}

function photo(p) {
  return p.image
    ? `<img src="${esc(p.image)}" alt="${esc(p.name)}">`
    : art(p.id);
}


/* OPTIONAL PRODUCT COLOR VARIANTS */
function productColors(p) {
  const colors = Array.isArray(p?.colors) ? p.colors : [];
  return colors.filter(c =>
    c && typeof c.name === "string" &&
    typeof c.hex === "string" &&
    /^#[0-9a-fA-F]{6}$/.test(c.hex)
  );
}

function colorInk(hex) {
  const rgb = [1,3,5].map(i =>
    parseInt(hex.slice(i,i+2),16)/255
  ).map(v =>
    v <= .04045 ? v/12.92 : ((v+.055)/1.055)**2.4
  );
  const luminance =
    .2126*rgb[0] + .7152*rgb[1] + .0722*rgb[2];
  return luminance > .179 ? "#111" : "#fff";
}

function tintCartButton(button, color) {
  if (!button) return;
  const hex = color?.hex || "";
  button.style.backgroundColor = hex;
  button.style.borderColor =
    hex.toLowerCase() === "#ffffff" ? "#111" : hex;
  button.style.color = hex ? colorInk(hex) : "";
}

function chooseProductColor(name) {
  const selected = productColors(currentProduct)
    .find(c => c.name === name);

  chosenColor = selected?.name || "";

  document.querySelectorAll("[data-color-choice]")
    .forEach(button => {
      const active =
        button.dataset.colorChoice === chosenColor;
      button.classList.toggle("selected",active);
      button.setAttribute("aria-pressed",String(active));
    });

  const label = $("selected-color-label");
  if (label) label.textContent =
    chosenColor || "Select a color";

  tintCartButton($("add-cart"), selected);
}

/* FAVORITES */
let liked = [...new Set(
  load("waffles-liked-v1")
    .filter(id=>products.some(p=>p.id===id))
)];

function favoriteControls(p,prefix) {
  const key = prefix+"-"+p.id;

  return `
  <div class="favorite-controls">
    <label for="${key}-size">
      ${p.isSet?"Hoodie Size":"Size"}
    </label>
    <select id="${key}-size">
      <option value="">Select size</option>
      ${p.sizes.map(s=>`
        <option value="${s}">${s}</option>
      `).join("")}
    </select>

    ${p.isSet?`
      <label for="${key}-pants">Sweatpants Size</label>
      <select id="${key}-pants">
        <option value="">Select size</option>
        ${p.sizes.map(s=>`
          <option value="${s}">${s}</option>
        `).join("")}
      </select>
    `:""}

    ${productColors(p).length ? `
      <label for="${key}-color">Color</label>
      <select id="${key}-color"
        data-favorite-color="${key}">
        <option value="">Select color</option>
        ${productColors(p).map(c=>`
          <option value="${esc(c.name)}">
            ${esc(c.name)}
          </option>
        `).join("")}
      </select>
    ` : ""}

    <label for="${key}-qty">Quantity</label>
    <input id="${key}-qty" type="number"
      min="1" max="99" value="1">

    <button class="btn" data-favorite-add="${p.id}"
      data-prefix="${key}">
      Add to Cart
    </button>

    <p id="${key}-message" class="message" role="status"></p>
  </div>`;
}

function productCard(p,withControls=false,prefix="fav") {
  return `
  <article class="product-card ${withControls?"favorite-card":""}">
    <div class="product-wrap">
      <button class="product-image" data-product="${p.id}"
        aria-label="View ${esc(p.name)}">
        ${photo(p)}
      </button>

      ${p.isSet ? '<span class="product-label">BUNDLE · SAVE 10%</span>' : ""}

      <button class="like-btn ${liked.includes(p.id)?"liked":""}"
        data-like="${p.id}" aria-label="Like ${esc(p.name)}">
        ${liked.includes(p.id)?"&#9829;":"&#9825;"}
      </button>
    </div>

    <h3>${esc(p.name)}</h3>
    <p>${esc(p.description)}</p>
    <p>${price(p)}</p>
    ${p.isSet ? '<p class="set-saving">SAVE 10% WHEN YOU BUY THE MATCHING SET</p>' : ""}
    <p class="product-designer">Designed by <a class="artist-name-link" href="#artist-waffleswithsyruppp">Waffleswithsyruppp</a></p>

    <button class="btn outline" data-product="${p.id}">
      View Item
    </button>

    ${withControls?favoriteControls(p,prefix):""}
  </article>`;
}

function renderProducts() {
  $("products").innerHTML =
    products.map(p=>productCard(p)).join("");
}

function renderLiked() {
  const chosen = products.filter(p=>liked.includes(p.id));

  $("liked-products").innerHTML = chosen.length
    ? chosen.map(p=>productCard(p,true,"liked")).join("")
    : `<div class="empty">
        <h2>No Liked Items Yet</h2>
        <p class="muted">Tap a heart on any product to save it here.</p>
        <a href="#collection" class="btn">Explore Collection</a>
      </div>`;
}

function renderLikedPreview() {
  const chosen = products.filter(p=>liked.includes(p.id));

  $("preview-liked-items").innerHTML = chosen.length
    ? chosen.map(p=>`
      <div class="preview-row">
        <button class="thumb" data-product="${p.id}">
          ${photo(p)}
        </button>

        <div class="preview-info">
          <h3>
            <button class="product-link" data-product="${p.id}">
              ${esc(p.name)}
            </button>
          </h3>
          <p>${price(p)}</p>
          <button class="text-link" data-like="${p.id}">
            Remove
          </button>
          ${favoriteControls(p,"preview")}
        </div>
      </div>`).join("")
    : `<div class="empty">
        <p>No liked items yet.</p>
      </div>`;
}

function toggleLike(id) {
  if(liked.includes(id)) {
    liked=liked.filter(x=>x!==id);
  } else {
    liked.push(id);
  }

  save("waffles-liked-v1",liked);
  $("liked-count").textContent=liked.length;

  renderProducts();
  renderLiked();
  renderLikedPreview();
}

/* PRODUCT DETAILS */
function openProduct(id) {
  const p=products.find(x=>x.id===id);
  if(!p)return;

  currentProduct=p;
  chosenSize="";
  chosenPantsSize="";
  chosenColor="";

  $("product-detail").innerHTML=`
    <div class="detail-image">${photo(p)}</div>

    <div class="detail-info">
      <div class="eyebrow">Sweet and Drippy Collection</div>
      <h1>${esc(p.name)}</h1>
      <p>${esc(p.description)}</p>
      <p class="product-designer">Designed by <a class="artist-name-link" href="#artist-waffleswithsyruppp">Waffleswithsyruppp</a></p>
      <h2>${price(p)}</h2>
      ${p.isSet ? '<p class="set-saving">SAVE 10% WHEN YOU BUY THE MATCHING SET</p>' : ""}

      <label>${p.isSet?"Hoodie Size":"Select Size"}</label>
      <div class="sizes">
        ${p.sizes.map(s=>`
          <button class="size-btn"
            data-size-group="hoodie"
            data-size="${s}">${s}</button>
        `).join("")}
      </div>

      ${p.isSet?`
        <label>Sweatpants Size</label>
        <div class="sizes">
          ${p.sizes.map(s=>`
            <button class="size-btn"
              data-size-group="pants"
              data-size="${s}">${s}</button>
          `).join("")}
        </div>
      `:""}

      ${productColors(p).length ? `
        <label>Color:
          <span id="selected-color-label">Select a color</span>
        </label>
        <div class="color-options" role="group"
          aria-label="Available colors">
          ${productColors(p).map(c=>`
            <button type="button" class="color-choice"
              data-color-choice="${esc(c.name)}"
              aria-pressed="false">
              <span class="color-dot"
                style="background:${c.hex}"></span>
              ${esc(c.name)}
            </button>
          `).join("")}
        </div>
      ` : ""}

      <label for="quantity">Quantity</label>
      <input id="quantity" class="quantity"
        type="number" min="1" max="99" value="1">

      <div style="margin-top:25px">
        <button class="btn" id="add-cart">Add to Cart</button>
      </div>

      <p id="product-message" class="message" role="status"></p>

      <button class="text-link" id="back-products">
        Back to Collection
      </button>
    </div>`;

  location.hash="product";
  showPage("product");
}

function selectSize(group,value) {
  if(group==="hoodie") {
    chosenSize=value;
  } else {
    chosenPantsSize=value;
  }

  document.querySelectorAll(
    `[data-size-group="${group}"]`
  ).forEach(btn=>{
    btn.classList.toggle(
      "selected",
      btn.dataset.size===value
    );
  });
}

/* CART */
let cart=load("waffles-cart-v3").filter(i=>
  products.some(p=>p.id===i.id) &&
  Number.isInteger(i.qty) &&
  i.qty>=1 &&
  i.qty<=99
);

function totalItems() {
  return cart.reduce((sum,i)=>sum+i.qty,0);
}

function subtotalText() {
  if(!cart.length)return "$0.00";

  if(!cart.every(i=>
    typeof actualProductPrice(products.find(p=>p.id===i.id))==="number"
  )) {
    return "Prices pending";
  }

  return money(cart.reduce((sum,i)=>{
    const p=products.find(p=>p.id===i.id);
    return sum+actualProductPrice(p)*i.qty;
  },0));
}

function renderCartPreview() {
  $("preview-cart-items").innerHTML=cart.length
    ? cart.slice(-3).map(i=>{
      const p=products.find(x=>x.id===i.id);

      return `
      <div class="preview-row">
        <button class="thumb" data-product="${p.id}">
          ${photo(p)}
        </button>

        <div class="preview-info">
          <h3>
            <button class="product-link" data-product="${p.id}">
              ${esc(p.name)}
            </button>
          </h3>

          <p>${p.isSet?"Hoodie":"Size"}: ${esc(i.size)}</p>
          ${i.color ? `<p>Color: ${esc(i.color)}</p>` : ""}
          ${p.isSet?`<p>Pants: ${esc(i.pantsSize)}</p>`:""}
          <p>${price(p)}</p>
          <p>Qty: ${i.qty}</p>
        </div>
      </div>`;
    }).join("")
    : `<div class="empty"><p>Your bag is empty.</p></div>`;

  $("preview-subtotal").textContent=subtotalText();
}

function renderFullCart() {
  $("full-cart-items").innerHTML=cart.length
    ? cart.map((i,index)=>{
      const p=products.find(x=>x.id===i.id);

      return `
      <article class="cart-row">
        <button class="cart-picture" data-product="${p.id}"
          aria-label="View ${esc(p.name)}">
          ${photo(p)}
        </button>

        <div class="cart-row-info">
          <h3>
            <button class="product-link" data-product="${p.id}">
              ${esc(p.name)}
            </button>
          </h3>

          <p>${p.isSet?"Hoodie":"Size"}: ${esc(i.size)}</p>
          ${i.color ? `<p>Color: ${esc(i.color)}</p>` : ""}
          ${p.isSet?`<p>Pants: ${esc(i.pantsSize)}</p>`:""}
          <p>${price(p)}</p>

          <div class="qty-control">
            <button data-cart-action="minus"
              data-index="${index}">−</button>
            <span>${i.qty}</span>
            <button data-cart-action="plus"
              data-index="${index}">+</button>
          </div>

          <button class="text-link"
            data-cart-action="remove"
            data-index="${index}">
            Remove
          </button>
        </div>
      </article>`;
    }).join("")
    : `<div class="empty">
        <h2>Your Shopping Cart Is Empty</h2>
        <p class="muted">Your next favorite piece is waiting.</p>
        <a href="#collection" class="btn">Shop the Collection</a>
      </div>`;

  $("full-subtotal").textContent=subtotalText();
}

/* CAT EMOTIONS + BAG WAFFLE */
let catEmotionTimer;
let bagWaffleTimer;

function makeCatHappy() {
  const cat=$("mascot-cat");
  if(!cat)return;

  clearTimeout(catEmotionTimer);

  cat.classList.remove("sad","happy","celebrate");
  void cat.offsetWidth;
  cat.classList.add("happy");

  catEmotionTimer=setTimeout(()=>{
    cat.classList.remove("happy");
  },1300);
}

function makeCatCry() {
  const cat=$("mascot-cat");
  if(!cat)return;

  clearTimeout(catEmotionTimer);

  cat.classList.remove("happy","celebrate");
  cat.classList.add("sad");

  catEmotionTimer=setTimeout(()=>{
    cat.classList.remove("sad");
  },3200);
}

function animateBagWaffle() {
  const waffle=$("bag-waffle");
  if(!waffle)return;

  clearTimeout(bagWaffleTimer);
  waffle.classList.remove("peek");

  void waffle.offsetWidth;
  waffle.classList.add("peek");

  bagWaffleTimer=setTimeout(()=>{
    waffle.classList.remove("peek");
  },1500);
}

/* WAFFLE COLLECTOR */
function updateWaffleCollector(animate=false) {
  const count=totalItems();
  const box=$("mascot-waffles");
  const old=previousWaffleCount;

  previousWaffleCount=count;

  $("mascot-count").textContent=
    count+" "+(count===1?"waffle":"waffles")+" collected";

  while(box.children.length>count) {
    box.lastElementChild.remove();
  }

  while(box.children.length<count) {
    const wrapper=document.createElement("span");
    wrapper.innerHTML=WAFFLE_SVG;

    if(animate&&count>old) {
      wrapper.firstElementChild.classList.add("new-waffle");
    }

    box.appendChild(wrapper);
  }
}

function renderCart(animate=false) {
  $("bag-count").textContent=totalItems();

  renderCartPreview();
  renderFullCart();
  updateWaffleCollector(animate);
}

function addItem(id,size,pantsSize,qty,color="") {
  const p=products.find(x=>x.id===id);

  if(!p ||
    !p.sizes.includes(size) ||
    (p.isSet&&!p.sizes.includes(pantsSize)) ||
    !Number.isInteger(qty) ||
    qty<1 ||
    qty>99) {
    return false;
  }

  const colors = productColors(p);
  if (colors.length && !colors.some(c=>c.name===color))
    return false;

  const item={
    id,
    color:colors.length ? color : "",
    size,
    pantsSize:p.isSet?pantsSize:"",
    qty
  };

  const existing=cart.find(x=>
    x.id===item.id &&
    x.size===item.size &&
    x.pantsSize===item.pantsSize &&
    (x.color || "")===item.color
  );

  const before=totalItems();

  if(existing) {
    existing.qty=Math.min(99,existing.qty+qty);
  } else {
    cart.push(item);
  }

  const increased=totalItems()>before;

  save("waffles-cart-v3",cart);
  renderCart(increased);

  if(increased) {
    makeCatHappy();
    animateBagWaffle();
  }

  return true;
}

function addFromProduct() {
  const msg=$("product-message");
  const qty=Number($("quantity").value);

  if(!chosenSize ||
    (currentProduct.isSet&&!chosenPantsSize)) {
    msg.textContent="Please select all required sizes.";
    return;
  }

  if(productColors(currentProduct).length && !chosenColor) {
    msg.textContent="Please choose a color.";
    return;
  }

  if(addItem(
    currentProduct.id,
    chosenSize,
    chosenPantsSize,
    qty,
    chosenColor
  )) {
    msg.textContent="Added to your bag!";
  } else {
    msg.textContent="Choose a quantity between 1 and 99.";
  }
}

function addFromFavorites(button) {
  const id=button.dataset.favoriteAdd;
  const prefix=button.dataset.prefix;
  const p=products.find(x=>x.id===id);

  if(!p)return;

  const size=$(prefix+"-size").value;
  const pants=p.isSet?$(prefix+"-pants").value:"";
  const qty=Number($(prefix+"-qty").value);
  const colorField=$(prefix+"-color");
  const color=colorField ? colorField.value : "";
  const msg=$(prefix+"-message");

  if(!size||(p.isSet&&!pants)) {
    msg.textContent="Please choose all sizes.";
    return;
  }

  if(productColors(p).length && !color) {
    msg.textContent="Please choose a color.";
    return;
  }

  const added=addItem(id,size,pants,qty,color);

  if(msg) {
    msg.textContent=added
      ?"Added to your bag!"
      :"Choose a quantity between 1 and 99.";
  }
}

/* MODIFY CART */
function modifyCart(index,action) {
  if(!cart[index])return;

  const previousCount=totalItems();

  if(action==="remove") {
    cart.splice(index,1);
  }
  else if(action==="plus") {
    cart[index].qty=Math.min(
      99,
      cart[index].qty+1
    );
  }
  else if(action==="minus") {
    cart[index].qty--;

    if(cart[index].qty<=0) {
      cart.splice(index,1);
    }
  }

  const newCount=totalItems();

  save("waffles-cart-v3",cart);
  renderCart(false);

  if(newCount<previousCount) {
    makeCatCry();
  }
  else if(newCount>previousCount) {
    makeCatHappy();
    animateBagWaffle();
  }
}

/* PREVIEW PANELS */
function closePreviews() {
  $("preview-backdrop").classList.remove("open");
  $("cart-preview").classList.remove("open");
  $("liked-preview").classList.remove("open");
  document.body.classList.remove("locked");
}

function openPreview(type) {
  closePreviews();

  if(type==="cart") {
    renderCartPreview();
  } else {
    renderLikedPreview();
  }

  $("preview-backdrop").classList.add("open");

  $(
    type==="cart"?"cart-preview":"liked-preview"
  ).classList.add("open");

  document.body.classList.add("locked");
}

/* NAVIGATION */
const pages=[
  "collection",
  "product",
  "liked",
  "shopping-cart",
  "artists",
  "playlist",
  "contact"
];

function showPage(id) {
  if(!pages.includes(id))id="collection";
  document.body.classList.toggle("home-landing",id==="collection");

  document.querySelectorAll(".page").forEach(p=>{
    p.classList.toggle("active",p.id===id);
  });

  const selected = ["product","liked","shopping-cart"]
    .includes(id) ? "collection" : id;

  document.querySelectorAll(".footer-links [data-nav]")
    .forEach(a=>{
      const active = a.dataset.nav === selected;
      a.classList.toggle("active", active);
      if(active) a.setAttribute("aria-current","page");
      else a.removeAttribute("aria-current");
    });
  closePreviews();
  window.scrollTo(0,0);
}

function navigate() {
  const hash=location.hash.slice(1);

  if(hash==="pitch") {
    // Old links still work but now go to the form on the Contact page.
    showPage("contact");
    requestAnimationFrame(() => {
      $("artist-submissions").scrollIntoView({behavior:"smooth",block:"start"});
    });
  }
  else if(hash==="collection") {
    showPage("collection");
  }
  else if(hash.startsWith("artist-") && document.getElementById(hash)) {
    showPage("artists");
    requestAnimationFrame(()=>{
      document.getElementById(hash).scrollIntoView({behavior:"smooth",block:"start"});
    });
  }
  else if(hash==="product"&&currentProduct) {
    showPage("product");
  }
  else {
    showPage(
      pages.includes(hash)&&hash!=="product"
        ?hash:"collection"
    );
  }
}

window.addEventListener("hashchange",navigate);

/* RELIABLE INTERNAL LINK NAVIGATION */
document.addEventListener("click",event=>{
  const anchor=event.target.closest('a[href^="#"]');
  if(!anchor)return;
  const target=anchor.getAttribute("href").slice(1);
  if(target==="product")return;
  if(!pages.includes(target) && target!=="pitch" && !(target.startsWith("artist-") && document.getElementById(target))) return;
  event.preventDefault();
  if(location.hash!=="#"+target)location.hash=target;
  navigate();
});

/* CLICK HANDLERS */
document.addEventListener("click",event=>{
  const like=event.target.closest("[data-like]");

  if(like) {
    toggleLike(like.dataset.like);
    return;
  }

  const favorite=event.target.closest("[data-favorite-add]");

  if(favorite) {
    addFromFavorites(favorite);
    return;
  }

  const product=event.target.closest("[data-product]");

  if(product) {
    openProduct(product.dataset.product);
    return;
  }

  const colorChoice=event.target.closest("[data-color-choice]");
  if(colorChoice) {
    chooseProductColor(colorChoice.dataset.colorChoice);
    return;
  }

  const size=event.target.closest("[data-size-group]");

  if(size) {
    selectSize(
      size.dataset.sizeGroup,
      size.dataset.size
    );
    return;
  }

  const action=event.target.closest("[data-cart-action]");

  if(action) {
    modifyCart(
      Number(action.dataset.index),
      action.dataset.cartAction
    );
    return;
  }

  if(event.target.id==="add-cart") {
    addFromProduct();
  }

  if(event.target.id==="back-products") {
    location.hash="collection";
    navigate();
  }
});

/* Keep favorite-page buttons synced with color selection. */
document.addEventListener("change",event=>{
  const select=event.target.closest("[data-favorite-color]");
  if(!select) return;
  const button=document.querySelector(
    `[data-prefix="${select.dataset.favoriteColor}"]`
  );
  const product=products.find(
    p=>p.id===button?.dataset.favoriteAdd
  );
  const color=productColors(product).find(
    c=>c.name===select.value
  );
  tintCartButton(button,color);
});

/* HEADER BUTTONS */
$("bag-button").addEventListener("click",()=>{
  openPreview("cart");
});

$("liked-button").addEventListener("click",()=>{
  openPreview("liked");
});

$("view-cart").addEventListener("click",()=>{
  closePreviews();
  location.hash="shopping-cart";
  navigate();
});

$("view-liked").addEventListener("click",()=>{
  closePreviews();
  location.hash="liked";
  navigate();
});

document.querySelectorAll("[data-close-preview]")
  .forEach(button=>{
    button.addEventListener("click",closePreviews);
  });

$("preview-backdrop").addEventListener(
  "click",
  closePreviews
);

document.addEventListener("keydown",event=>{
  if(event.key==="Escape") closePreviews();
});

/* PLAYLIST */
$("playlist-button").addEventListener("click",()=>{
  if(!CONFIG.playlistUrl) {
    alert("The playlist link has not been added yet.");
    return;
  }

  window.open(
    CONFIG.playlistUrl,
    "_blank",
    "noopener,noreferrer"
  );
});

/* INITIALIZE */
$("year").textContent=new Date().getFullYear();
$("liked-count").textContent=liked.length;

renderProducts();
renderLiked();
renderLikedPreview();
renderCart();
navigate();

/* WC_ONE_LINE_SLOGAN_FIT */
function fitWafflesHeaderSlogan() {
  const slogan = document.querySelector(".header-slogan");
  if (!slogan) return;

  let size = 15;
  slogan.style.setProperty("font-size", size + "px", "important");

  for (let i = 0; i < 5; i++) {
    if (slogan.scrollWidth <= slogan.clientWidth) break;
    if (slogan.clientWidth <= 0) break;

    const ratio =
      (slogan.clientWidth - 3) / slogan.scrollWidth;

    size = Math.max(5, size * ratio);
    slogan.style.setProperty(
      "font-size", size + "px", "important"
    );
  }
}

fitWafflesHeaderSlogan();

window.addEventListener("resize", () => {
  requestAnimationFrame(fitWafflesHeaderSlogan);
});

if (document.fonts) {
  document.fonts.ready.then(fitWafflesHeaderSlogan);
}
