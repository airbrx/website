var tags = []; var articlemanifest = []
var logconf = getObjects(`/js/conf.json`)
var logserver =''
try {
  let tmp = JSON.parse(logconf)
  logserver = tmp.logserver
} catch {}
var siteData = {}
try {siteData = JSON.parse(getObjects(`/sitedata.json`))}catch {console.log("sitedata problem")}

try {articlemanifest = JSON.parse(getObjects(`/articles/articles.json`))}catch {console.log('no articles')}

articlemanifest.sort((x, y) => y.published - x.published);
var now = new Date();
now = now.getTime();
articlemanifest = articlemanifest.filter(function(item) {
   return (item.published < (now/1000) && item.published !== null)
});
sessionStorage.setItem('newmanifest', JSON.stringify(articlemanifest))

try {tags = JSON.parse(getObjects(`/tags.json`))}catch {console.log('no tags')}

function pageContent() {
  var siteData = JSON.parse(getObjects(`/sitedata.json`))
  var path = window.location.pathname
  if (path == '/') {path = '/index.html'}
  path = path.replace(/^\//g, "")

  var pageData = siteData.pages.find(item => {
   return item.fileName == path
  })

  if (pageData) {
     if (pageData.pageElements.includes('mainarticle') && pageData.article) {
       document.getElementById('mainarticle').innerHTML = pageData.article
     }
    // page type runs the gallery functions automtically
    if (pageData.pageElements.includes('gallery')) {
      document.addEventListener("DOMContentLoaded", generateGrid(articlemanifest))
    }

    // page type builds a list of articles
    if (pageData.pageElements.includes('articleindex')) {
      filterarticles(articlemanifest)
    }
  }

  // page type is an article
  if (window.location.pathname.split('/')[1] == 'articles') {
    let currentArticleIndex = articlemanifest.findIndex(article => article.slug === window.location.pathname.split('/')[2].split('.')[0])
    currentArticle = articlemanifest[currentArticleIndex]
    if (currentArticle.bioId) {
      let bios = JSON.parse(getObjects(`/bios.json`))
      let bioIndex = bios.findIndex(bio => bio.bioId === currentArticle.bioId)
      let bio = bios[bioIndex]
      let bioTxt = `
        <div id="authorbio" style=" display: flex; align-items: flex-start; gap: 20px;">
          <img src="${bio.image}" alt="${bio.name}" style="max-width: 200px; height: auto;">
          <div class="bio-text">
            <b>${bio.name} -- ${bio.title}</b><br />${bio.bio}<br/><a href="${bio.linkedIn}" target="_blank"><i class="fa fa-linkedin fa-xs button"></i></a>
          </div>
        </div>
      `
      document.getElementById('author').innerHTML += bioTxt
    }
    let prev = {}; let next ={}
    if (currentArticleIndex == 0) {
      prev = articlemanifest[(articlemanifest.length-1)]
    }
    else (prev = articlemanifest[currentArticleIndex-1])
    if (currentArticleIndex == articlemanifest.length-1) {
      next = articlemanifest[0]
    }
    else (next = articlemanifest[currentArticleIndex+1])
    var prevnext = ''
    if (articlemanifest.length > 2) {
     prevnext = `
      <div style="padding-top:20px;width:100%;text-align:center">
        <hr />
        <br/>
        <span onclick="window.location.href='/articles/${prev.slug}.html'" style="cursor:pointer;width:50%;text-align:left">&lt;&lt;${prev.articleTitle} | </span>
        <span onclick="window.location.href='/articles/${next.slug}.html'" style="cursor:pointer;width:50%;text-align:left">${next.articleTitle}&gt;&gt;</span>
      </div>
    `
    }
    document.getElementById('mainarticle').innerHTML += prevnext


    imgClicker()
  }
}

function filterarticles(fitleredManfiest) {
  var resp = ""
  fitleredManfiest.forEach(item => {
    var dateObject = new Date(item.published * 1000)
    let options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }
    var pubdate =  dateObject.toLocaleDateString('en-US', options)
    let thumb = '/assets/placeholder.webp'
    var regex = /^\/articleimages/;
    let match = regex.test(item.images[0]);
    if (match) {
      thumb = item.images[0].replace(/^\/articleimages\//, "/articleimages/thumbs/")
    }
    resp += `
    <center><div class="article-item">
      <img src="${thumb}" alt="${item.articleTitle}" onclick="window.location.href='/articles/${item.slug}.html'">
      <div class="article-text">
        <span onclick="window.location.href='/articles/${item.slug}.html'"><b>${item.articleTitle}</b><Br><span style="font-size:smaller">${pubdate}</span><br/>${item.articleBlurb}</span><br />
      `
    item.tags.forEach(tag => {
      resp += `<button onclick="tagFilter('${tag}')">${tag}</button>`
    })
    resp += `</div></div><hr/>`
  })
 document.getElementById('articles').innerHTML = resp
}

function menu() {
  pageContent()

  var resp = '<UL>';
  var menuItems = JSON.parse(getObjects(`/sitedata.json`))
  menuItems.pages.forEach(item => {
      if (item.fileName != 'error.html') {
        resp += `<li onclick="window.location.href='/${item.fileName}'">${item.pageName}</li>`
      }
  })
  resp += `</UL>`
  if (articlemanifest.length > 20) {
    resp += `<input type="text" id="searchTitle" placeholder="Search titles" oninput="filterArticlesByTitle()">`
  }
  document.getElementById("menu").innerHTML = resp
  return;
}

function tagFilter(tag) {
  let newmanifest = articlemanifest.filter(item => item.tags.includes(tag))
  sessionStorage.setItem('newmanifest', JSON.stringify(newmanifest))

  var path = window.location.pathname
  if (path == '/') {path = '/index.html'}
  path = path.replace(/^\//g, "")
  var pageData = siteData.pages.find(item => {
   return item.fileName == path
  })

  if (pageData) {

    // page type runs the gallery functions automtically
    if (pageData.pageElements.includes('gallery')) {
      generateGrid(newmanifest);
    }

    // page type builds a list of articles
    if (pageData.pageElements.includes('articleindex')) {
      filterarticles(newmanifest)
    }
  }

}

function updateTags() {
    const form = document.getElementById('tagList');
    var newtags = Array.from(form.querySelectorAll('input[name="tags"]:checked'))
    .map(cb => cb.value)

    var totalTags = form.querySelectorAll('input[name="tags"]');
    if (newtags.length == totalTags.length) {
      generateGrid(articlemanifest)
      sessionStorage.setItem('newmanifest', JSON.stringify(articlemanifest))
      return;
    }
    var newmanifest = []
    newtags.forEach(tag => {
        let foundObjects = articlemanifest.filter(item => item.tags.includes(tag))
        newmanifest.push(...foundObjects); // Spread to add multiple matches
    });
    newmanifest = removeDuplicates(newmanifest)
    sessionStorage.setItem('newmanifest', JSON.stringify(newmanifest))

    generateGrid(newmanifest)
}

function generateGrid(articles) {
  const container = document.getElementById("grid-container");
  if (articles.length == 0 ) {
    container.innerHTML = ''
    return;
  }
  container.innerHTML = "";
  articles.sort((x, y) => y.published - x.published);

  articles.forEach(item => {
      const div = document.createElement("div");
      div.classList.add("grid-item");
      div.setAttribute("onclick", `slideshow('${item.slug}')`);

      const img = document.createElement("img");
      var regex = /^\/articleimages/;
      let match = regex.test(item.images[0]);
      if (match) {
        let tmp = item.images[0].replace(/^\/articleimages\//, "/articleimages/thumbs/")
        img.src = tmp
      }
      else {
        img.src = item.images[0]
      }
      img.alt = item.articleTitle;
      img.classList.add("grid-image");

      const title = document.createElement("p");
      title.textContent = item.articleTitle;

      div.appendChild(img);
      div.appendChild(title);
      container.appendChild(div);
  });
}

function getObjects(apiPath) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', apiPath, false); // get synchronously
  xhr.send();

  // Check the status and return data if request was successful
  if (xhr.status === 200) {
    return xhr.responseText;
  }
  else {
    console.log(xhr.responseText, xhr.status)
  }
}

function slideshow(slug, articles) {

    var articlemanifestfiltered = sessionStorage.getItem('newmanifest')
    if (!articlemanifestfiltered) {
      articlemanifestfiltered = articlemanifest
    }
    else {
      try {
        articlemanifestfiltered = JSON.parse(sessionStorage.getItem('newmanifest'))
      }
      catch {
        articlemanifestfiltered = articlemanifest
        sessionStorage.setItem('newmanifest', JSON.stringify(articlemanifest))
      }
    }
    let currentArticleIndex = articlemanifestfiltered.findIndex(article => article.slug === slug);
    if (currentArticleIndex === -1) return;

    let currentImageIndex = 0;

    // Create slideshow container
    const slideshowContainer = document.createElement("div");
    slideshowContainer.id = "slideshow-container";
    slideshowContainer.style = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100dvh;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 100000;
    `;

    const imgElement = document.createElement("img");
    imgElement.style = "width: 100%; height: 100%; object-fit: contain;";
    slideshowContainer.appendChild(imgElement);
    document.body.appendChild(slideshowContainer);

    function showImage() {
        const currentArticle = articlemanifestfiltered[currentArticleIndex];
        if (!currentArticle || !currentArticle.images.length) return;

        imgElement.style.opacity = 0;
        setTimeout(() => {
            imgElement.src = currentArticle.images[currentImageIndex];
            imgElement.style.opacity = 1;
        }, 200);
    }

    function nextImage() {
        const currentArticle = articlemanifestfiltered[currentArticleIndex];
        if (currentImageIndex < currentArticle.images.length - 1) {
            currentImageIndex++;
        } else {
            currentArticleIndex = (currentArticleIndex + 1) % articlemanifestfiltered.length;
            currentImageIndex = 0;
        }
        showImage();
    }

    function prevImage() {
        if (currentImageIndex > 0) {
            currentImageIndex--;
        } else {
            currentArticleIndex = (currentArticleIndex - 1 + articlemanifestfiltered.length) % articlemanifestfiltered.length;
            currentImageIndex = articlemanifestfiltered[currentArticleIndex].images.length - 1;
        }
        showImage();
    }

    function closeSlideshow() {
        document.body.removeChild(slideshowContainer);
    }

    slideshowContainer.addEventListener("click", (event) => {
        if (event.clientX < window.innerWidth / 2) {
            prevImage();
        } else {
            nextImage();
        }
    });

    let touchStartX = 0;
    slideshowContainer.addEventListener("touchstart", (event) => {
        touchStartX = event.touches[0].clientX;
    });

    slideshowContainer.addEventListener("touchend", (event) => {
        let touchEndX = event.changedTouches[0].clientX;
        if (touchEndX < touchStartX - 30) {
            nextImage();
        } else if (touchEndX > touchStartX + 30) {
            prevImage();
        }
    });

    document.addEventListener("keydown", function onKeyPress(event) {
        if (event.key === "Escape") {
            closeSlideshow();
            document.removeEventListener("keydown", onKeyPress);
        } else if (event.key === "ArrowRight") {
            nextImage();
        } else if (event.key === "ArrowLeft") {
            prevImage();
        }
    });

    // fullscreen maybe
    // Create fullscreen toggle button
    const fullscreenButton = document.createElement("button");
    fullscreenButton.innerHTML = `&#9974;`; // Fullscreen icon
    fullscreenButton.classList.add("slideshow-button");

    // Create redirect button
    const copyButton = document.createElement("button");
    copyButton.innerHTML = `&#128279;`; // Link icon
    copyButton.classList.add("slideshow-button");

    // Create copy URL button
    const redirectButton = document.createElement("button");
    redirectButton.innerHTML = `&#128203;`; // Clipboard icon
    redirectButton.classList.add("slideshow-button");

    // Button container
    const buttonContainer = document.createElement("div");
    buttonContainer.style = `
        position: absolute;
        top: 10px;
        right: 10px;
        display: flex;
        gap: 5px;
        z-index: 1100;
        transition: opacity 0.5s;
    `;
    buttonContainer.appendChild(fullscreenButton);
    buttonContainer.appendChild(redirectButton);
    buttonContainer.appendChild(copyButton);
    slideshowContainer.appendChild(buttonContainer);

    // Function to toggle fullscreen mode
    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            if (slideshowContainer.requestFullscreen) {
                slideshowContainer.requestFullscreen().catch(err => {
                    console.error("Fullscreen request failed", err);
                });
            } else if (slideshowContainer.mozRequestFullScreen) {
                slideshowContainer.mozRequestFullScreen();
            } else if (slideshowContainer.webkitRequestFullscreen) {
                slideshowContainer.webkitRequestFullscreen();
            } else if (slideshowContainer.msRequestFullscreen) {
                slideshowContainer.msRequestFullscreen();
            }
            startAutoHide(); // Start hiding controls
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
            closeSlideshow();
            stopAutoHide(); // Stop hiding controls
        }
    }

    // Function to redirect to a webpage
    function redirectToPage() {
      window.location.href= `/articles/${articlemanifestfiltered[currentArticleIndex].slug}.html`;
    }

    // Function to copy the URL to the clipboard
    function copyToClipboard() {
        const url = `${window.location.protocol}//${window.location.host}/articles/${articlemanifestfiltered[currentArticleIndex].slug}.html`
          navigator.clipboard.writeText(url).then(() => {
            alert("Link to posting copied to clipboard!");
        }).catch(err => {
            console.error("Failed to copy URL", err);
        });
    }

    // Auto-hide controls when in fullscreen mode
    let hideTimeout;
    function startAutoHide() {
        buttonContainer.style.opacity = "1"; // Ensure buttons are visible

        clearTimeout(hideTimeout);
        hideTimeout = setTimeout(() => {
            if (document.fullscreenElement) {
                buttonContainer.style.opacity = "0"; // Hide buttons
            }
        }, 10000); // 10 seconds
    }

    // Stop auto-hide when exiting fullscreen
    function stopAutoHide() {
        clearTimeout(hideTimeout);
        buttonContainer.style.opacity = "1";
    }

    // Show controls again when user interacts
    document.addEventListener("mousemove", () => {
        if (document.fullscreenElement) {
            startAutoHide();
        }
    });

    // Add event listeners
    fullscreenButton.addEventListener("click", (event) => {
        event.stopPropagation();
        toggleFullscreen();
    });

    redirectButton.addEventListener("click", (event) => {
        event.stopPropagation();
        redirectToPage();
    });

    copyButton.addEventListener("click", (event) => {
        event.stopPropagation();
        copyToClipboard();
    });

    imgElement.addEventListener("click", () => {
        if (!document.fullscreenElement) {
            toggleFullscreen();
        } else {
            nextImage();
        }
    });

    showImage();
}

function startGallery(img) {
  var path = window.location.pathname.split('/')
  var slug = path[path.length-1].split('.')[0]
  var article =JSON.parse(getObjects(`/articles/${slug}.json`))
  let articles = []; articles.push(article)
  slideshow(slug, articles)
}

function imgClicker() {
  const div = document.getElementById("mainarticle");

  if (!div) {
    console.error(`Div not found.`);
  return;
  }

  // Get all image elements within the div.
  const images = div.getElementsByTagName('img');

  // Iterate over each image and add a click event listener.
  for (let i = 0; i < images.length; i++) {
    images[i].style = "cursor:pointer"
    images[i].addEventListener('click', function() {
      // Call the provided click function.
      startGallery(this); // 'this' refers to the clicked image element.
    });
  }
}


function filterArticlesByTitle() {
  var path = window.location.pathname
  if (path == '/') {path = '/index.html'}
  path = path.replace(/^\//g, "")

  let searchText = document.getElementById('searchTitle').value.toLowerCase();
  let filteredArticles = articlemanifest.filter(article =>
      article.articleTitle.toLowerCase().includes(searchText)
  );

  var pageData = siteData.pages.find(item => {
   return item.fileName == path
  })

  if (pageData) {

    // page type runs the gallery functions automtically
    if (pageData.pageElements.includes('gallery')) {
      generateGrid(filteredArticles);
    }

    // page type builds a list of articles
    if (pageData.pageElements.includes('articleindex')) {
      filterarticles(filteredArticles)
    }
  }
}

function removeDuplicates(jsonArray) {
    const uniqueSlugs = new Set();
    return jsonArray.filter(item => {
        if (!uniqueSlugs.has(item.slug)) {
            uniqueSlugs.add(item.slug);
            return true;
        }
        return false;
    });
}

function toggleCheckboxes(checkAll) {
    const form = document.forms['tagList'];
    if (!form) return;

    const checkboxes = form.elements['tags'];
    if (!checkboxes) return;

    if (checkboxes.length) {
        for (let checkbox of checkboxes) {
            checkbox.checked = checkAll;
        }
    } else {
        checkboxes.checked = checkAll;
    }

    updateTags();
}

document.addEventListener("DOMContentLoaded", function () {
    const menuToggle = document.getElementById("menu-toggle");
    const menu = document.getElementById("menu");

    menuToggle.addEventListener("click", function () {
        menu.classList.toggle("active");
    });
});

async function getFingerprint() {
  if (!logserver) {return}
 const fingerprint = {
   userAgent: navigator.userAgent,
   language: navigator.language,
   languages: navigator.languages,
   vendor: navigator.vendor,
   platform: navigator.platform,
   screen: {
     width: screen.width,
     height: screen.height,
     colorDepth: screen.colorDepth,
   },
   mimetypes: navigator.mimeTypes,
   timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
   plugins: Array.from(navigator.plugins).map(plugin => plugin.name),
   touchPoints: navigator.maxTouchPoints,
   hardwareConcurrency: navigator.hardwareConcurrency,
   memory: navigator.deviceMemory || 'unknown',
 }


 const fonts = ["Arial", "Verdana", "Courier", "Times", "Georgia", "Comic Sans MS"];
 const canvas = document.createElement('canvas');
 const ctx = canvas.getContext('2d');
 ctx.textBaseline = 'top';
 ctx.font = '16px sans-serif';

 const defaultWidth = ctx.measureText("A").width;

 fingerprint.fonts = fonts.filter(font => {
     ctx.font = `16px ${font}, sans-serif`;
     return ctx.measureText("A").width !== defaultWidth;
 });

 // WebGL Fingerprint
 const canvas2 = document.createElement('canvas');
 const gl = canvas2.getContext('webgl') || canvas2.getContext('experimental-webgl');
 if (gl) {
 const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
 fingerprint.gl = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'unknown';
 } else {
 fingerprint.gl = 'no-webgl';
 }

 // Graphics rendering fingerprint (Canvas)
 const canvas1 = document.createElement('canvas');
 ctx.textBaseline = 'top';
 ctx.font = '16px Arial';
 ctx.fillText('Browser fingerprinting!', 10, 50);
 fingerprint.graphic = canvas1.toDataURL();

 // Hash the fingerprint for uniqueness
 const encoder = new TextEncoder();
 const data = encoder.encode(JSON.stringify(fingerprint));
 const hashBuffer = await crypto.subtle.digest('SHA-256', data);
 const hashArray = Array.from(new Uint8Array(hashBuffer));
 const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

 var siteData = JSON.parse(getObjects(`/sitedata.json`))
 var siteName = siteData.siteName.replace(/ /g, '-')
 var checksumold = getCookie(siteName)
 var payload = {
   fingerprint: fingerprint,
   checksum: hashHex,
   checksumold: checksumold,
   referrer: document.referrer,
   page: window.location.pathname
 }
 var xhr = new XMLHttpRequest();
 xhr.open('POST', logserver, true);
 xhr.setRequestHeader("Content-Type", "application/json");
 xhr.send(JSON.stringify(payload));
 document.cookie =`${siteName}=${hashHex}`;

 return { hash: hashHex, fingerprint };
}

function getCookie(name) {
  var value = `; ${document.cookie}`;
  value = value.replace(/\n/, ' ')
  value = value.replace(/\r/, ' ')
  const parts = value.split(`; `);
  for (let i = 0; i < parts.length; i++) {
    var tmp = parts[i].split(`=`)
    if (tmp[0] === name) {
      return tmp[1]
    }
  }
}
getFingerprint()
