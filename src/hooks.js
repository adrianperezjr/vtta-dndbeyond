import utils from "./utils.js";

import EventPort from "./messaging/index.js";
import OutgoingCommunication from "./messaging/outgoing.js";

// init hooks
import setupLogging from "./hooks/init/setupLogging.js";

// ready hooks
import registerSheets from "./hooks/ready/registerSheets.js";
import checkCompendiums from "./hooks/ready/checkCompendiums.js";
import repairGameSettings from "./hooks/ready/repairGameSettings.js";
import registerGameSettings from "./hooks/ready/registerGameSettings.js";

// other hooks
import addFolderLabel from "./hooks/renderSidebarTab/addFolderLabel.js";
import linkImages from "./hooks/renderJournalSheet/linkImages.js";

// socket messaging
import onSocketMessage from "./hooks/socket/onSocketMessage.js";

// foundry is initializing
export function init() {
  setupLogging();
  CONFIG.debug.hooks = false;
  utils.log("Init");
}

// foundry is ready
export function onceReady() {
  // register the game settings
  registerGameSettings();

  // repair corrupted game settings
  repairGameSettings();

  // check for valid compendiums
  checkCompendiums();

  // delay the startup just a tiny little bit
  setTimeout(() => {
    utils.log("Starting EventPort", "messaging");
    let port = new EventPort();
    port.start();

    let com = OutgoingCommunication(port);

    // register the D&DBeyond Button on the character sheets
    registerSheets();

    // send a notification to dndbeyond that it should update the actor data
    Hooks.on("preUpdateActor", com.updateActorHP);
  }, 500);
}

export function onReady() {
  game.socket.on("module.vtta-dndbeyond", (data) => {
    console.log("Socket Message received");
    if (data.sender === game.user.data._id) {
      console.log("I sent this");
      return;
    }

    const sender = game.users.get(data.sender);
    delete data.sender;
    onSocketMessage(sender, data);
  });
}

export function renderSidebarTab(directory, html, user) {
  addFolderLabel(directory, html, user);
}

export function renderJournalSheet(sheet, html, data) {
  linkImages(sheet, html, data);
}
