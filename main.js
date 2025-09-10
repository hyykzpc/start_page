// 从 triggers.json 加载触发区域配置
fetch("triggers.json")
  .then(response => response.json())
  .then(triggersConfig => {
    const container = document.querySelector('.bg-container');

    // 创建触发区域
    triggersConfig.forEach(cfg => {
      const trigger = document.createElement("div");
      trigger.className = "trigger-area";
      trigger.style.left = cfg.left;
      if (cfg.width) trigger.style.width = cfg.width;
      if (cfg.height) trigger.style.height = cfg.height;
      if(cfg.top) trigger.style.top = cfg.top;

      trigger.dataset.type = cfg.type;
      if(cfg.target) trigger.dataset.target = cfg.target;
      if(cfg.message) trigger.dataset.message = cfg.message;

      container.appendChild(trigger);
    });

    const drawers = document.querySelectorAll('.drawer');

    // 点击触发区域逻辑
    document.querySelectorAll('.trigger-area').forEach(trigger => {
      trigger.addEventListener('click', e => {
        e.stopPropagation();
        const type = trigger.dataset.type;

        switch(type) {
          case "drawer":
            drawers.forEach(d => d.classList.remove('open'));
            document.getElementById(trigger.dataset.target)?.classList.toggle('open');
            break;
          case "audio":
            playAudio(trigger.dataset.message || "audio1.mp3");
            break;
          case "bili":
            window.open("https://www.bilibili.com", "_blank");
            break;
          case "music":
            playAudio(trigger.dataset.message || "audio2.mp3");
            break;
        }
      });
    });

    // 点击抽屉内部阻止关闭
    drawers.forEach(d => d.addEventListener('click', e => e.stopPropagation()));

    // 点击页面其他区域收起所有抽屉
    document.addEventListener('click', () => {
      drawers.forEach(d => d.classList.remove('open'));
    });
  });

// ----------------- 抽屉内网站收藏夹逻辑 -----------------
let drawersData = JSON.parse(localStorage.getItem("drawersData")) || {
  drawer1: [], drawer2: [], drawer3: []
};

function saveData() {
  localStorage.setItem("drawersData", JSON.stringify(drawersData));
}

// ----------------- 音频播放逻辑（改为单一 audio 元素） -----------------
const player = document.getElementById("player"); // HTML 中添加 <audio id="player"></audio>

function playAudio(src) {
  if (player.src.endsWith(src) && !player.paused) {
    player.pause();
    player.currentTime = 0;
    return;
  }
  player.src = src;
  player.play();
}

// ----------------- 抽屉渲染 -----------------
function renderDrawer(drawerId) {
  const drawer = document.getElementById(drawerId);
  let container = drawer.querySelector(".square-container");

  if(!container){
    container = document.createElement("div");
    container.className = "square-container";
    container.style.display = "grid";
    container.style.gridTemplateColumns = "repeat(8, 1fr)";
    container.style.gridAutoRows = "1fr";
    container.style.gap = "10px";
    drawer.appendChild(container);
  }

  container.innerHTML = "";

  const sites = drawersData[drawerId];

  for(let i=0; i<32; i++){
    const btnWrapper = document.createElement("div");
    btnWrapper.style.position = "relative";
    btnWrapper.style.display = "flex";
    btnWrapper.style.flexDirection = "column";
    btnWrapper.style.alignItems = "center";

    if(i < sites.length){
      const site = sites[i];
      const btn = document.createElement("div");
      btn.className = "square-btn";
      btn.style.width = "100%";
      btn.style.aspectRatio = "1 / 1";
      btn.style.borderRadius = "50%";
      btn.style.backgroundColor = "#ddd";
      btn.style.display = "flex";
      btn.style.justifyContent = "center";
      btn.style.alignItems = "center";
      btn.style.position = "relative";
      btn.style.cursor = "pointer";

      const img = document.createElement("img");
      try{
        img.src = `https://www.google.com/s2/favicons?domain=${new URL(site.url).hostname}`;
      }catch(e){ img.src = ""; }
      btn.appendChild(img);

      btn.addEventListener("click", ()=>window.open(site.url, "_blank"));

      const del = document.createElement("div");
      del.className = "delete-btn";
      del.textContent = "×";
      del.style.position = "absolute";
      del.style.top = "2px";
      del.style.right = "2px";
      del.style.cursor = "pointer";
      del.style.display = "none";
      btn.appendChild(del);

      btn.addEventListener("mouseenter", ()=>del.style.display="block");
      btn.addEventListener("mouseleave", ()=>del.style.display="none");

      del.addEventListener("click", e=>{
        e.stopPropagation();
        sites.splice(i,1);
        saveData();
        renderDrawer(drawerId);
      });

      const label = document.createElement("div");
      label.className = "square-label";
      label.style.textAlign = "center";
      label.style.marginTop = "5px";
      label.textContent = site.name;

      btnWrapper.appendChild(btn);
      btnWrapper.appendChild(label);
      container.appendChild(btnWrapper);

    } else if(i === sites.length){
      const btn = document.createElement("div");
      btn.className = "square-btn add-btn";
      btn.style.width = "100%";
      btn.style.aspectRatio = "1 / 1";
      btn.style.borderRadius = "50%";
      btn.style.backgroundColor = "#eee";
      btn.style.display = "flex";
      btn.style.justifyContent = "center";
      btn.style.alignItems = "center";
      btn.style.cursor = "pointer";
      btn.textContent = "+";

      btn.addEventListener("click", ()=>showInputPopup(btn, drawerId));

      btnWrapper.appendChild(btn);
      container.appendChild(btnWrapper);
    } else {
      const emptyDiv = document.createElement("div");
      btnWrapper.appendChild(emptyDiv);
      container.appendChild(btnWrapper);
    }
  }
}

// ----------------- 弹出输入框添加网站 -----------------
function showInputPopup(targetBtn, drawerId){
  const popup = document.createElement("div");
  popup.className = "input-popup";
  popup.style.position = "absolute";
  popup.style.backgroundColor = "#fff";
  popup.style.border = "1px solid #888";
  popup.style.padding = "10px";
  popup.style.zIndex = "2000";
  popup.style.display = "flex";
  popup.style.flexDirection = "column";
  popup.innerHTML = `
    <input placeholder="网站名称" class="site-name">
    <input placeholder="网址" class="site-url">
    <button>添加</button>
  `;
  document.body.appendChild(popup);

  popup.addEventListener("click", e=>e.stopPropagation());

  const rect = targetBtn.getBoundingClientRect();
  popup.style.top = `${rect.bottom + window.scrollY}px`;
  popup.style.left = `${rect.left + window.scrollX}px`;

  popup.querySelector("button").addEventListener("click", ()=>{
    const name = popup.querySelector(".site-name").value.trim();
    let url = popup.querySelector(".site-url").value.trim();
    if(!name || !url) return alert("名称和网址不能为空");
    if(!/^https?:\/\//.test(url)) url = "https://" + url;

    drawersData[drawerId].push({name, url});
    saveData();
    renderDrawer(drawerId);
    document.body.removeChild(popup);
  });

  const closePopup = e=>{
    if(!popup.contains(e.target)){
      document.body.removeChild(popup);
      document.removeEventListener("click", closePopup);
    }
  };
  setTimeout(()=>document.addEventListener("click", closePopup), 0);
}
const searchInput = document.querySelector(".search");

searchInput.addEventListener("keydown", function(e) {
  if (e.key === "Enter") {       // 按下回车
    const query = searchInput.value.trim();
    if (query) {
      // 跳转到必应搜索
      const url = "https://www.bing.com/search?q=" + encodeURIComponent(query);
      window.open(url, "_blank"); // 在新标签打开
      searchInput.value = "";     // 可选：清空输入框
    }
  }
});
// ----------------- 初始化渲染抽屉 -----------------
["drawer1","drawer2","drawer3"].forEach(renderDrawer);
