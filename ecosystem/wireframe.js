let ecosystemData = [], workflows = [], ecoMeta = {title: '', description: ''};
let currentViewMode = 'all'; // 'all' or 'connected'
let selectedEntityId = null;
const params = new Proxy(new URLSearchParams(window.location.search), {
  get: (searchParams, prop) => searchParams.get(prop),
});
let projectId = 'workflows/ecosystem.json'
if (params.project)  {
  projectId = 'workflows/' + params.project
}
if (params.project)  {
  $.when(
    $.getJSON(projectId)
  ).done(function(ecoDefault) {
      ecosystemData = ecoDefault.ecosystem;
      workflows = ecoDefault.workflows;
      ecoMeta.title = ecoDefault.title
      ecoMeta.description = ecoDefault.description

      localStorage.setItem("ecosystemData", JSON.stringify(ecosystemData));
      localStorage.setItem("workflows", JSON.stringify(workflows));

      document.getElementById("ecosystemdesc").innerHTML = `
        <h1>${ecoDefault.title}</h1>
        <p>${ecoDefault.description}</p>
      `

      buildWorkflowMenu();
      renderWireframe();
    });
}
else {
  Promise.all([
    d3.json(projectId),
  ]).then(([ecoDefault]) => {
    const localEco = localStorage.getItem("ecosystemData");
    const localFlows = localStorage.getItem("workflows");

    ecosystemData = localEco ? JSON.parse(localEco) : ecoDefault.ecosystem;
    workflows = localFlows ? JSON.parse(localFlows) : ecoDefault.workflows;

    document.getElementById('ecosystemdescx ').innerHTML = `
      <h1>${ecoDefault.title}</h1>
      <p>${ecoDefault.description}</p>
    `

    buildWorkflowMenu();
    renderWireframe();
  });

}
const svg = d3.select("svg"), width = window.innerWidth, height = window.innerHeight, maxTextWidth = 140;

function buildWorkflowMenu() {
  const ul = document.getElementById("workflowList");
  ul.innerHTML = '';
  workflows.forEach(wf => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span onclick="filterByWorkflow('${wf.workflowId}')" style="cursor:pointer">${wf.workflowName}</span>
    `;
    ul.appendChild(li);
  });
}

function renderWireframe(filterWorkflowId = null) {
  if (!filterWorkflowId) {
    document.getElementById("ecosystemdesc").innerHTML = `
      <h1>${ecoMeta.title}</h1>
      <p>${ecoMeta.description}</p>
    `
  }
  persistData();
  svg.selectAll("*").remove();

  let nodes;
  if (currentViewMode === 'connected' && selectedEntityId) {
    const selected = ecosystemData.find(e => e.entityId === selectedEntityId);
    const connectedIds = new Set([selectedEntityId, ...(selected.connectors || [])]);
    nodes = ecosystemData.filter(e => connectedIds.has(e.entityId));
  } else {
    nodes = ecosystemData;
  }

  if (filterWorkflowId) {
    nodes = nodes.filter(d => d.workflows && d.workflows.includes(filterWorkflowId));
  }

  const nodeById = Object.fromEntries(nodes.map(d => [d.entityId, d]));
  const links = [];
  nodes.forEach(node => {
    (node.connectors || []).forEach(targetId => {
      if (nodeById[targetId]) links.push({ source: node.entityId, target: targetId });
    });
  });

  const container = svg.append("g").attr("class", "container");

  const simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id(d => d.entityId).distance(200))
    .force("charge", d3.forceManyBody().strength(-500))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collide", d3.forceCollide(100));

  const link = container.append("g").selectAll("line")
    .data(links)
    .join("line")
    .attr("class", "link");

  const node = container.append("g").selectAll("g")
    .data(nodes)
    .join("g")
    .attr("class", "node")
    .on("click", function (event, d) {
      event.stopPropagation();
      currentViewMode = 'connected';
      selectedEntityId = d.entityId;
      renderWireframe();
    });

  node.call(d3.drag()
    .on("start", (event, d) => {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x; d.fy = d.y;
    })
    .on("drag", (event, d) => {
      d.fx = event.x; d.fy = event.y;
    })
    .on("end", (event, d) => {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null; d.fy = null;
    }));

  node.each(function (d) {
    const group = d3.select(this);
    const tempText = group.append("text").attr("class", "title-text")
      .attr("text-anchor", "middle").text(d.title);
    wrapText(tempText, maxTextWidth);
    const tspans = tempText.selectAll("tspan");
    const lineCount = tspans.size();
    const ry = 20 + (lineCount - 1) * 10;
    const lineHeight = 1.2;
    const offset = -((lineCount - 1) / 2) * lineHeight;
    tspans.each(function (_, i) {
      d3.select(this).attr("x", 0).attr("dy", `${i === 0 ? offset : lineHeight}em`);
    });
    group.append("ellipse").lower()
      .attr("rx", maxTextWidth / 2 + 10).attr("ry", ry + 5)
      .attr("stroke", d.entityId === selectedEntityId ? "#0000ff" : "#222")
      .attr("stroke-width", d.entityId === selectedEntityId ? 4 : 2);

    group.append("rect")
      .attr("class", "description-box")
      .attr("x", -maxTextWidth / 2)
      .attr("y", 45)
      .attr("width", 200)
      .attr("height", 0)
      .attr("rx", 8)
      .attr("ry", 8)
      .attr("fill", "#f2f2f2")
      .attr("stroke", "#505050")
      .attr("stroke-width", 1);

    if (d.entityId === selectedEntityId) {
      const foWidth = 200;
      const yOffset = 45;
      const foreignObject = group.append("foreignObject")
        .attr("x", -foWidth / 2)
        .attr("y", yOffset)
        .attr("width", foWidth)
        .attr("height", 1)
        .raise();

      const div = foreignObject.append("xhtml:div")
        .attr("xmlns", "http://www.w3.org/1999/xhtml")
        .style("box-sizing", "border-box")
        .style("width", `${foWidth}px`)
        .style("padding", "10px")
        .style("background", "#f2f2f2")
        .style("border", "1px solid #505050")
        .style("border-radius", "8px")
        .style("font-size", "14px")
        .style("color", "#000")
        .style("cursor", "default")
        .style("z-index", 10000)
        .html(`
          <span style="float: right; cursor: pointer;" id="close-${d.entityId}">
          [x]
         </span><br/>${d.description}<br/><br/><br/>
        `);

      setTimeout(() => {
        const domElement = div.node();
        const actualHeight = domElement.scrollHeight;
        foreignObject.attr("height", actualHeight + 10);
      }, 0);

      setTimeout(() => {
        const closeme = document.getElementById(`close-${d.entityId}`);
        if (closeme) {
          closeme.onclick = (event) => {
            event.stopPropagation();
            closeme.parentNode.style.display = 'none';
          };
        }
      }, 0);
    }
  });

  simulation.on("tick", () => {
    link
      .attr("x1", d => d.source.x)
      .attr("y1", d => Math.max(50, d.source.y))
      .attr("x2", d => d.target.x)
      .attr("y2", d => Math.max(50, d.target.y));

    node.attr("transform", d => {
      d.y = Math.max(50, d.y);
      return `translate(${d.x},${d.y})`;
    });
  });

  // 🔁 When simulation ends, fit to canvas
  simulation.on("end", () => {
    const allX = nodes.map(d => d.x);
    const allY = nodes.map(d => d.y);
    const minX = Math.min(...allX);
    const maxX = Math.max(...allX);
    const minY = Math.min(...allY);
    const maxY = Math.max(...allY);

    const boundsWidth = maxX - minX;
    const boundsHeight = maxY - minY;

    const scale = Math.min(
      width / (boundsWidth + 100),
      height / (boundsHeight + 100),
      1
    );

    const translateX = (width - boundsWidth * scale) / 2 - minX * scale;
    const translateY = (height - boundsHeight * scale) / 2 - minY * scale;

    container.attr("transform", `translate(${translateX},${translateY}) scale(${scale})`);
  });
}

function wrapText(text, width) {
  text.each(function () {
    const words = d3.select(this).text().split(/\s+/).reverse();
    let word, line = [], lineNumber = 0;
    const y = d3.select(this).attr("y") || 0;
    let tspan = d3.select(this).text(null).append("tspan").attr("x", 0).attr("y", y);
    while (word = words.pop()) {
      line.push(word);
      tspan.text(line.join(" "));
      if (tspan.node().getComputedTextLength() > width) {
        line.pop();
        tspan.text(line.join(" "));
        line = [word];
        tspan = d3.select(this).append("tspan").attr("x", 0).attr("y", y).text(word);
      }
    }
  });
}

function viewAllEntities() {
  currentViewMode = 'all';
  selectedEntityId = null;
  renderWireframe();
}

function persistData() {
  localStorage.setItem("ecosystemData", JSON.stringify(ecosystemData));
  localStorage.setItem("workflows", JSON.stringify(workflows));
}

function filterByWorkflow(workflowId) {
  const index = workflows.findIndex(e => e.workflowId === workflowId);
  if (index === -1) return;
  let html = `
    <h1>${workflows[index].workflowName}</h1>
    <p>${workflows[index].workflowDescription}</p>
  `
  document.getElementById('ecosystemdesc').innerHTML = html
  renderWireframe(workflowId);
}

function showAddWorkflow() {
  const name = prompt("Enter workflow name:");
  if (!name) return;
  const owner = prompt("Enter owner:");
  const id = uuid.v4();
  workflows.push({ workflowId: id, workflowName: name, owner });
  buildWorkflowMenu();
}

function saveEntityEdits() {
  const id = document.getElementById('editEntityId').value;
  const index = ecosystemData.findIndex(e => e.entityId === id);
  if (index === -1) return;

  const updatedEntity = {
    entityId: id,
    title: document.getElementById('editTitle').value,
    description: document.getElementById('editDescription').value,
    connectors: Array.from(document.querySelectorAll('#editConnectors input:checked')).map(cb => cb.value),
    workflows: Array.from(document.querySelectorAll('#editWorkflows input:checked')).map(cb => cb.value)
  };

  ecosystemData[index] = updatedEntity;
  document.getElementById('editEntityModal').style.display = 'none';
  renderWireframe();
}


function deleteEntity() {
  const id = document.getElementById('editEntityId').value;
  if (!confirm("Delete this entity?")) return;
  const index = ecosystemData.findIndex(e => e.entityId === id);
  if (index > -1) ecosystemData.splice(index, 1);
  document.getElementById('editEntityModal').style.display = 'none';
  renderWireframe();
}

function addEntity() {
  const newEntity = {
    entityId: uuid.v4(),
    title: '',
    description: '',
    connectors: [],
    workflows: []
  };

  ecosystemData.push(newEntity);
  showEditEntityModal(newEntity);
}

function showJSON(type) {
  const content = document.getElementById("jsonContent");
    const cleanEcosystem = ecosystemData.map(e => ({
      entityId: e.entityId,
      title: e.title,
      description: e.description,
      connectors: Array.isArray(e.connectors) ? e.connectors : [],
      workflows: Array.isArray(e.workflows) ? e.workflows : []
    }));
    const cleanWorkflows = workflows.map(w => ({
      workflowId: w.workflowId,
      workflowName: w.workflowName,
      owner: w.owner
    }));
    let tmp = {
      ecosystem: cleanEcosystem,
      workflows: cleanWorkflows
    }
    content.textContent = JSON.stringify(tmp, null, 2);
  document.getElementById("jsonModal").style.display = 'block';
}

function refreshFromFile() {
  if (confirm("Are you sure you want to discard your local changes and refresh from the default template?")) {
    console.log(projectId)
    $.when(
      $.getJSON(projectId)
    ).done(function(ecoDefault) {
      ecosystemData = ecoDefault.ecosystem;
      workflows = ecoDefault.workflows;

      localStorage.setItem("ecosystemData", JSON.stringify(ecosystemData));
      localStorage.setItem("workflows", JSON.stringify(workflows));

      buildWorkflowMenu();
      renderWireframe();
    });


  }
}

function toggleSidebar() {
  const sidebar = document.getElementById('workflowSidebar');
  const toggleBtn = document.getElementById('toggleSidebarBtn');
  sidebar.classList.toggle('collapsed');
  toggleBtn.innerHTML = sidebar.classList.contains('collapsed') ? '⏵' : '⏴';
}

function refreshFromJson() {
  document.getElementById('uploadJsonModal').style.display = 'block';
  document.getElementById('uploadJsonModal').innerHTML=`
    <span class="close" onclick="document.getElementById('uploadJsonModal').style.display='none'">&times;</span><Br />
    <div style="width:100%;padding:20px">
      <B>Paste your JSON here</b><br/>
      <textarea id="customJson" style="width:80%;height:400px"></textarea><br />
      <button onclick="uploadJson()">Upload</button>
    </div>
  `
}

function uploadJson() {
  let jsontxt = document.getElementById('customJson').value
  try {
    let jsondata = JSON.parse(jsontxt)
    if (jsondata.ecosystem[0].entityId) {
      ecosystemData = jsondata.ecosystem
    }
    if (jsondata.workflows[0].workflowId) {
      workflows = jsondata.workflows
    }
    buildWorkflowMenu();
    renderWireframe();
    document.getElementById('uploadJsonModal').style.display = 'none';
  }
  catch(err) {
    alert('Invalid or unrecognized JSON payload' + err)
    console.log(err)
  }
}

function showEditEntityModal(entity) {
  document.getElementById('editEntityModal').style.display = 'block';
  document.getElementById('editEntityId').value = entity.entityId;
  document.getElementById('editTitle').value = entity.title;
  document.getElementById('editDescription').value = entity.description;

  const connectorsDiv = document.getElementById('editConnectors');
  connectorsDiv.innerHTML = '';
  ecosystemData.forEach(e => {
    if (e.entityId !== entity.entityId) {
      const checked = entity.connectors?.includes(e.entityId) ? 'checked' : '';
      connectorsDiv.innerHTML += `
        <label><input type="checkbox" value="${e.entityId}" ${checked}/> ${e.title}</label><br>
      `;
    }
  });

  const workflowsDiv = document.getElementById('editWorkflows');
  workflowsDiv.innerHTML = '';
  workflows.forEach(w => {
    const checked = entity.workflows?.includes(w.workflowId) ? 'checked' : '';
    workflowsDiv.innerHTML += `
      <label><input type="checkbox" value="${w.workflowId}" ${checked}/> ${w.workflowName}</label><br>
    `;
  });
}

function copyTextToClibpoard(divId) {
  let text = document.getElementById(divId).innerHTML
  navigator.clipboard.writeText(text)
    .then(() => {
      alert("Text copied to clipboard");
    })
    .catch(err => {
      alert("Failed to copy text: ", err);
    });
}
