// ==UserScript==
// @name         Browserherd
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Manage a herd of browsers
// @author       Mikko Nirkko
// @match        *
// @icon         https://www.google.com/s2/favicons?domain=mozilla.org
// @grant        none
// ==/UserScript==

(async function() {
  'use strict';

  // Escape if running within iframe on page
  if (window.top !== window.self) {
      return;
  }

  const server_port = 6501;
  const ms_interval = 500;
  let base_url = "http://127.0.0.1:" + server_port;
  localStorage.setItem("base_url", base_url);
  try {
      await pingAPI(base_url);
  } catch (e) {
      drawServerError(base_url);
      return;
  }
  drawOverlay();

  setInterval(performActionLoop, ms_interval, base_url);

})();

async function performActionLoop(base_url) {

  // Do nothing if the tool is in stopped state
  const active = getToggleStatus("active");
  if(!active){
      return;
  }

  // Do the necessary API operation based on selected mode
  const leader = getToggleStatus("mode");
  if(leader){
      const payload = generateRequestPayload();
      await performUpdateRequest(base_url, payload);
  } else {
      getLocation(base_url);
  }

}

function generateRequestPayload() {
  const payload = { "location": window.location.href, "scroll": window.scrollY };
  return payload;
}

async function performUpdateRequest(base_url, payload) {
  await fetch(base_url + "/update_location",
              {
      method:"put",
      body:JSON.stringify(payload),
      headers: {
          "Content-Type": "application/json"
      }
  });
}

async function performGetRequest(url) {
  const response = await fetch(url);
  return response.json();
}

function sendManualSync() {
  const payload = generateRequestPayload();
  const base_url = localStorage.getItem("base_url");
  performUpdateRequest(base_url, payload);
}

async function pingAPI(base_url) {
  await performGetRequest(base_url + "/get_location");
}

async function getLocation(base_url) {
  const url = base_url + "/get_location";
  let resdata = await performGetRequest(url);

  // Set new window location & position if changed since last time

  if(resdata.active === true) {
      if(window.location.href !== resdata.location){
          window.location.href = resdata.location;
      } else if(window.scrollY !== resdata.scroll) {
          window.scrollTo({
              top: resdata.scroll,
              left: 0,
              behavior: 'smooth'
          });
      }
  }
}

function drawServerError(base_url) {
  let containerdiv = generateContainerDiv();
  containerdiv.innerHTML = `Could not connect to Browserherd server at ${base_url} <br> Make sure the server is on and refresh the page.`;
}

function drawOverlay() {

  let containerdiv = generateContainerDiv();

  drawDragIcon(containerdiv);

  drawName(containerdiv);

  drawBullet(containerdiv);

  generateButton(containerdiv, getButtonSettings("modeselektor"));

  drawBullet(containerdiv);

  generateButton(containerdiv, getButtonSettings("startbutton"));

  drawBullet(containerdiv);

  generateButton(containerdiv, getButtonSettings("syncbutton"));

  addListeners();

}

function generateContainerDiv() {

  let container = document.createElement("div");
  container.setAttribute("id", "container");

  container.style.outline = "none";
  container.style.backgroundColor = "white";
  container.style.borderRadius = "3px";
  container.style.padding = "2px";
  container.style.zIndex = "99999";
  container.style.boxShadow = "1px 1px 3px black";
  container.style.display = "table";

  document.body.appendChild(container);
  setContainerLocation(container);
  makeTextUnselectable(container);

  return container;
}

function setContainerLocation(container) {
  container.style.position = "fixed";
  const x = localStorage.getItem("xlocation");
  const y = localStorage.getItem("ylocation");
  if(x !== null && x !== "" && y !== null && y !== "") {
      container.style.left = x;
      container.style.top = y;
  } else {
      container.style.left = "30px";
      container.style.top = "30px";
  }
}

function makeTextUnselectable(elem) {
  elem.style.webkitUserDelect = "none";
  elem.style.mozUserSelect = "none";
  elem.style.msUserSelect = "none";
  elem.style.userSelect = "none";
}

function drawDragIcon(container) {
  let icon = document.createElement("span");
  icon.setAttribute("id", "drag");
  icon.innerHTML = "✥";

  icon.style.width = "15px";
  icon.style.height ="15px";
  icon.style.cursor = "grab";
  icon.style.display = "table-cell";
  icon.style.verticalAlign = "middle";

  container.appendChild(icon);
}

// The little separator symbol in between buttons
function drawBullet(container) {
  let bullet = document.createElement("span");
  bullet.innerHTML = "•";
  bullet.style.marginLeft = "6px";
  bullet.style.marginRight = "6px";
  container.appendChild(bullet);
}

// Contains the title and the browser name
function drawName(containerdiv) {
  let namespan = document.createElement("span");

  namespan.style.fontSize = "15px";
  namespan.style.verticalAlign = "top";
  namespan.style.display = "table-cell";
  namespan.style.verticalAlign = "middle";
  namespan.innerHTML = `Browserherd  - ${parseBrowserName()}`;

  containerdiv.appendChild(namespan);
}

// Copy checkbox state to localStorage and then redraw button style
function onToggle(buttonId, lsName) {
  let checked = document.getElementById(buttonId).checked;
  localStorage.setItem(lsName, checked);
  drawButton(getButtonSettings(buttonId));
}

// This function handles the different button types
function generateButton(container, settings){

  if( settings.type === "toggle" ) {
      let labelElement = document.createElement("label");
      labelElement.setAttribute("id", settings.labelId);
      container.appendChild(labelElement);
  }

  let buttonElement = document.createElement("input");
  buttonElement.setAttribute("id", settings.buttonId);
  container.appendChild(buttonElement);

  drawButton(settings);
}

function drawButton(buttonSpecs) {

  const buttonElement = document.getElementById(buttonSpecs.buttonId);
  const type = buttonSpecs.type;

  if(type==="toggle"){
      const labelElement = document.getElementById(buttonSpecs.labelId);

      const marginHorizontal = "5px";
      const marginVertical = "20px";
      labelElement.setAttribute("for", buttonSpecs.buttonId);
      labelElement.style.outline = "none";
      labelElement.style.borderRadius = "10px";
      labelElement.style.margin = `${marginVertical} ${marginHorizontal} ${marginVertical} ${marginHorizontal}`;
      labelElement.style.fontSize = "13px";
      labelElement.style.cursor = "pointer";
      labelElement.style.padding = "4px";
      labelElement.style.boxShadow = "1px 1px 0px grey";
      labelElement.style.display = "table-cell";
      labelElement.style.verticalAlign = "middle";

      buttonElement.style.display = "none";
      buttonElement.setAttribute("type", "checkbox");

      const checked = getToggleStatus(buttonSpecs.storageName);
      buttonElement.addEventListener ("click", function() {onToggle(buttonSpecs.buttonId, buttonSpecs.storageName);}, false);
      buttonElement.checked = checked;

      if(checked) {
          labelElement.innerHTML = buttonSpecs.labelTitleOn;
          labelElement.style.backgroundColor = buttonSpecs.labelColorOn;
      } else {
          labelElement.innerHTML = buttonSpecs.labelTitleOff;
          labelElement.style.backgroundColor = buttonSpecs.labelColorOff;
      }

  } else if(type==="simple") {

      const marginHorizontal = "5px";
      buttonElement.setAttribute("type", "button");
      buttonElement.addEventListener ("click", function() {buttonSpecs.function();}, false);
      buttonElement.setAttribute("value", buttonSpecs.labelTitle);

      buttonElement.style.outline = "none";
      buttonElement.style.border = "none";
      buttonElement.style.background = "none";
      buttonElement.style.marginLeft = marginHorizontal;
      buttonElement.style.marginRight = marginHorizontal;
      buttonElement.style.fontSize = "13px";
      buttonElement.style.cursor = "pointer";
      buttonElement.style.padding = "4px";
      buttonElement.style.borderRadius = "10px";
      buttonElement.style.boxShadow = "1px 1px 0px grey";
      buttonElement.style.backgroundColor = buttonSpecs.labelColor;
      buttonElement.style.display = "table-cell";
      buttonElement.style.verticalAlign = "middle";
  }

}

function getToggleStatus(lsName) {
  let checked = localStorage.getItem(lsName) === "true";

  if(checked === null){
      checked = false;
      localStorage.setItem(lsName, checked);
  }

  return checked;
}

function parseBrowserName() {

  var browserName = (function (agent) {
      switch (true) {
          case agent.indexOf("edge") > -1: return "MS Edge Legacy";
          case agent.indexOf("edg/") > -1: return "Edge";
          case agent.indexOf("opr") > -1 && !!window.opr: return "Opera";
          case agent.indexOf("chrome") > -1 && !!window.chrome: return "Chrome";
          case agent.indexOf("trident") > -1: return "MS IE";
          case agent.indexOf("firefox") > -1: return "Firefox";
          case agent.indexOf("safari") > -1: return "Safari";
          default: return "other";
      }
  })(window.navigator.userAgent.toLowerCase());

  return browserName;

}

function getButtonSettings(key) {
  const buttonSettings =
        {
            "modeselektor": {
                "labelId": "modelabel",
                "buttonId": "modeselektor",
                "labelTitleOn": "Leader",
                "labelTitleOff": "Follower",
                "labelColorOn": "#ffcf69",
                "labelColorOff": "#b5c6ff",
                "type": "toggle",
                "storageName": "mode"
            },

            "startbutton": {
                "labelId": "startlabel",
                "buttonId": "startbutton",
                "labelTitleOn": "Stop",
                "labelTitleOff": "Start",
                "labelColorOn": "#ff5454",
                "labelColorOff": "#bcffa3",
                "storageName": "active",
                "type": "toggle"
            },

            "syncbutton": {
                "labelId": "synclabel",
                "buttonId": "syncbutton",
                "labelTitle": "Sync",
                "labelColor": "#9ceeff",
                "type": "simple",
                "function": sendManualSync
            }
        };
  return buttonSettings[key];
}


// The drag & drop for overlay window

function addListeners(){
  document.getElementById('drag').addEventListener('mousedown', mouseDown, false);
  window.addEventListener('mouseup', mouseUp, false);
}

function mouseUp()
{
  window.removeEventListener('mousemove', divMove, true);
  let div = document.getElementById("container");
  localStorage.setItem("xlocation", div.style.left);
  localStorage.setItem("ylocation", div.style.top);
}

function mouseDown(e){
  window.addEventListener('mousemove', divMove, true);
}

function divMove(e){
  var div = document.getElementById('container');
  var drag = document.getElementById('drag');
  div.style.top = (e.clientY - drag.offsetHeight / 2) + 'px';
  div.style.left = (e.clientX - drag.offsetWidth / 2) + 'px';
}
