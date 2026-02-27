// 音频可视化功能
function initAudioVisualizer() {
  const audio = document.getElementById('player');
  const canvas = document.getElementById('audioVisualizer');
  const ctx = canvas.getContext('2d');
  
  // 设置canvas大小
  function resizeCanvas() {
    const box = document.querySelector('.box');
    canvas.width = box.offsetWidth;
    canvas.height = box.offsetHeight;
  }
  
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  
  let audioContext, analyser, dataArray, animationId;
  
  // 开始可视化
  function startVisualization() {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(audioContext.destination);
      
      analyser.fftSize = 4096;
      const bufferLength = analyser.frequencyBinCount;
      dataArray = new Uint8Array(bufferLength);
    }
    
    visualize();
  }
  
  // 停止可视化
  function stopVisualization() {
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  
  // 可视化渲染
  function visualize() {
    if (audio.paused) {
      stopVisualization();
      return;
    }
    
    animationId = requestAnimationFrame(visualize);
    
    analyser.getByteFrequencyData(dataArray);
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const barCount = 128;
    const barWidth = canvas.width / barCount;
    const center = barCount / 2;
    
    for (let i = 0; i < barCount; i++) {
      // 计算距离中心的位置，实现中间高两边低的效果
      const distanceFromCenter = Math.abs(i - center);
      const index = Math.floor((distanceFromCenter / center) * (dataArray.length - 1));
      const barHeight = (dataArray[index] / 255) * (canvas.height / 2);
      
      // 计算X坐标
      const x = i * barWidth;
      
      // 绘制上半部分
      ctx.fillStyle = `rgb(${100 + dataArray[index] / 3}, ${100 + dataArray[index] / 3}, ${100 + dataArray[index] / 3})`;
      ctx.fillRect(x, canvas.height / 2 - barHeight, barWidth * 0.6, barHeight);
      
      // 绘制下半部分（对称）
      ctx.fillRect(x, canvas.height / 2, barWidth * 0.6, barHeight);
    }
  }
  
  // 监听音频播放状态
  audio.addEventListener('play', startVisualization);
  audio.addEventListener('pause', stopVisualization);
  audio.addEventListener('ended', stopVisualization);
}

// 从 triggers.json 加载触发区域配置
fetch("triggers.json")
  .then(response => response.json())
  .then(triggersConfig => {
    const container = document.querySelector('.bg-container');

    let songList = [];

    fetch("songs.json")
      .then(res => res.json())
      .then(data => {
        songList = data.songs; // 保存曲库
      });

    // 创建触发区域
    triggersConfig.forEach(cfg => {
      const trigger = document.createElement("div");
      trigger.className = "trigger-area";
      trigger.style.left = cfg.left;
      if (cfg.width) trigger.style.width = cfg.width;
      if (cfg.height) trigger.style.height = cfg.height;
      if (cfg.top) trigger.style.top = cfg.top;

      trigger.dataset.type = cfg.type;
      if (cfg.target) trigger.dataset.target = cfg.target;
      if (cfg.message) trigger.dataset.message = cfg.message;

      container.appendChild(trigger);
    });

    const drawers = document.querySelectorAll('.drawer');

    // 点击触发区域逻辑
    document.querySelectorAll('.trigger-area').forEach(trigger => {
      trigger.addEventListener('click', e => {
        e.stopPropagation();
        const type = trigger.dataset.type;

        // 添加点击反馈动画
        trigger.style.transform = 'scale(0.95)';
        setTimeout(() => {
          trigger.style.transform = 'scale(1)';
        }, 150);

        switch (type) {
          case "drawer":
            drawers.forEach(d => d.classList.remove('open'));
            document.getElementById(trigger.dataset.target)?.classList.toggle('open');
            break;
          case "bili":
            window.open("https://www.bilibili.com", "_blank","noopener noreferrer");
            break;
          case "AI":
            window.open("https://chatgpt.com", "_blank","noopener noreferrer");
            break;
          case "GIT":
            window.open("https://github.com", "_blank","noopener noreferrer");
            break;
          case "music":
            if (!player.paused) {
              // 如果正在播放 → 停止
              player.pause();
              player.currentTime = 0;
              console.log("音乐已停止");
            } else {
              // 如果没有播放 → 随机抽一首来播
              if (songList.length > 0) {
                const randomIndex = Math.floor(Math.random() * songList.length);
                const randomSong = songList[randomIndex];
                playAudio(randomSong);
                console.log("播放随机歌曲:", randomSong);
              } else {
                console.warn("曲库未加载或为空，播放默认歌曲");
                playAudio("audio2.mp3");
              }
            }
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
  player.play().catch(error => {
    console.error("播放失败:", error);
    // 显示播放失败提示
    showNotification("播放失败，请检查音频文件", "error");
  });
}

// ----------------- 抽屉渲染 -----------------
function renderDrawer(drawerId) {
  const drawer = document.getElementById(drawerId);
  let container = drawer.querySelector(".square-container");

  if (!container) {
    container = document.createElement("div");
    container.className = "square-container";
    drawer.appendChild(container);
  }

  container.innerHTML = "";

  const sites = drawersData[drawerId];

  for (let i = 0; i < 32; i++) {
    const btnWrapper = document.createElement("div");
    btnWrapper.style.position = "relative";
    btnWrapper.style.display = "flex";
    btnWrapper.style.flexDirection = "column";
    btnWrapper.style.alignItems = "center";

    if (i < sites.length) {
      const site = sites[i];
      const btn = document.createElement("div");
      btn.className = "square-btn";
      
      const img = document.createElement("img");
      try {
        img.src = `https://www.google.com/s2/favicons?domain=${new URL(site.url).hostname}`;
      } catch (e) { img.src = ""; }
      btn.appendChild(img);

      btn.addEventListener("click", () => {
        // 添加点击动画
        btn.style.transform = 'scale(0.95)';
        setTimeout(() => {
          btn.style.transform = 'scale(1)';
          window.open(site.url, "_blank");
        }, 150);
      });

      const del = document.createElement("div");
      del.className = "delete-btn";
      del.textContent = "×";
      btn.appendChild(del);

      del.addEventListener("click", e => {
        e.stopPropagation();
        // 添加删除动画
        btn.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => {
          sites.splice(i, 1);
          saveData();
          renderDrawer(drawerId);
          showNotification("网站已删除", "success");
        }, 300);
      });

      const label = document.createElement("div");
      label.className = "square-label";
      label.textContent = site.name;

      btnWrapper.appendChild(btn);
      btnWrapper.appendChild(label);
      container.appendChild(btnWrapper);

    } else if (i === sites.length) {
      const btn = document.createElement("div");
      btn.className = "square-btn add-btn";
      btn.textContent = "+";

      btn.addEventListener("click", () => {
        // 添加点击动画
        btn.style.transform = 'scale(0.95)';
        setTimeout(() => {
          btn.style.transform = 'scale(1)';
          showInputPopup(btn, drawerId);
        }, 150);
      });

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
function showInputPopup(targetBtn, drawerId) {
  const popup = document.createElement("div");
  popup.className = "input-popup";
  popup.innerHTML = `
    <input placeholder="网站名称" class="site-name">
    <input placeholder="网址" class="site-url">
    <button>添加</button>
  `;
  document.body.appendChild(popup);

  popup.addEventListener("click", e => e.stopPropagation());

  const rect = targetBtn.getBoundingClientRect();
  popup.style.top = `${rect.bottom + window.scrollY}px`;
  popup.style.left = `${rect.left + window.scrollX}px`;

  popup.querySelector("button").addEventListener("click", () => {
    const name = popup.querySelector(".site-name").value.trim();
    let url = popup.querySelector(".site-url").value.trim();
    if (!name || !url) return showNotification("名称和网址不能为空", "error");
    if (!/^https?:\/\//.test(url)) url = "https://" + url;

    drawersData[drawerId].push({ name, url });
    saveData();
    renderDrawer(drawerId);
    document.body.removeChild(popup);
    showNotification("网站已添加", "success");
  });

  const closePopup = e => {
    if (!popup.contains(e.target)) {
      document.body.removeChild(popup);
      document.removeEventListener("click", closePopup);
    }
  };
  setTimeout(() => document.addEventListener("click", closePopup), 0);
}

// ----------------- 通知功能 -----------------
function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 8px;
    color: white;
    font-weight: 600;
    z-index: 1000;
    animation: slideInRight 0.3s ease, fadeOut 0.3s ease 2.7s;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  `;
  
  // 根据类型设置颜色
  switch (type) {
    case "success":
      notification.style.backgroundColor = "#4CAF50";
      break;
    case "error":
      notification.style.backgroundColor = "#f44336";
      break;
    case "info":
    default:
      notification.style.backgroundColor = "#2196F3";
      break;
  }
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    document.body.removeChild(notification);
  }, 3000);
}

// ----------------- 搜索功能 -----------------
const searchInput = document.querySelector(".search");

searchInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter") {       // 按下回车
    const query = searchInput.value.trim();
    if (query) {
      // 跳转到必应搜索
      const url = "https://www.bing.com/search?q=" + encodeURIComponent(query);
      window.open(url, "_blank"); // 在新标签打开
      searchInput.value = "";     // 清空输入框
      
      // 添加搜索动画
      const box = document.querySelector('.box');
      box.style.transform = 'scale(0.95)';
      setTimeout(() => {
        box.style.transform = 'scale(1)';
      }, 150);
    }
  }
});

// ----------------- 初始化 -----------------
function init() {
  // 初始化音频可视化
  initAudioVisualizer();
  
  // 初始化抽屉
  ["drawer1"].forEach(renderDrawer);
  
  // 添加页面加载动画
  document.body.style.opacity = "0";
  document.body.style.transition = "opacity 0.5s ease";
  setTimeout(() => {
    document.body.style.opacity = "1";
  }, 100);
}

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', init);

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes fadeOut {
    from {
      opacity: 1;
      transform: scale(1);
    }
    to {
      opacity: 0;
      transform: scale(0.8);
    }
  }
  
  .notification {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 8px;
    color: white;
    font-weight: 600;
    z-index: 1000;
    animation: slideInRight 0.3s ease, fadeOut 0.3s ease 2.7s;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  }
`;
document.head.appendChild(style);
