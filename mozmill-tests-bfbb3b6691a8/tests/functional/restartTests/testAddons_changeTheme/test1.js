/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is MozMill Test code.
 *
 * The Initial Developer of the Original Code is the Mozilla Foundation.
 * Portions created by the Initial Developer are Copyright (C) 2011
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Vlad Maniac <vlad.maniac@softvisioninc.eu> (original author)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

// Include required modules
var addons = require("../../../../lib/addons");
var {assert} = require("../../../../lib/assertions");
var modalDialog = require("../../../../lib/modal-dialog");
var prefs = require("../../../../lib/prefs");
var tabs = require("../../../../lib/tabs");

const LOCAL_TEST_FOLDER = collector.addHttpResource("../../../../data/");

const THEME = [
  {name: "Theme (Plain)",
   id: "plain.theme@quality.mozilla.org",
   url: LOCAL_TEST_FOLDER + "addons/install.html?addon=themes/plain.jar"},
  {name: "Default",
   id: "{972ce4c6-7e08-4474-a285-3208198ce6fd}"}
];

const PREF_INSTALL_DIALOG = "security.dialog_enable_delay";
const INSTALL_DIALOG_DELAY = 1000;
const TIMEOUT_DOWNLOAD = 25000;
const TIMEOUT_USER_SHUTDOWN = 2000;

function setupModule() {
  controller = mozmill.getBrowserController();
  addonsManager = new addons.AddonsManager(controller);

  // Set pref for add-on installation dialog timer 
  prefs.preferences.setPref(PREF_INSTALL_DIALOG, INSTALL_DIALOG_DELAY);  
                
  // Whitelist add the local test folder
  addons.addToWhiteList(LOCAL_TEST_FOLDER);

  // Store the theme in the persisted object
  persisted.theme = THEME; 

  tabs.closeAllTabs(controller);
}

/**
 * Test installing a theme
 */
function testInstallTheme() {
  // Go to theme url and perform install
  controller.open(persisted.theme[0].url);
  controller.waitForPageLoad();
    
  var installLink = new elementslib.Selector(controller.tabs.activeTab, 
                                             "#addon");
  var md = new modalDialog.modalDialog(addonsManager.controller.window);
  
  md.start(addons.handleInstallAddonDialog);
  controller.click(installLink);
  md.waitForDialog(TIMEOUT_DOWNLOAD); 

  addonsManager.open();
  
  // Set category to 'Appearance'
  addonsManager.setCategory({
    category: addonsManager.getCategoryById({id: "theme"})
  });

  var plainTheme = addonsManager.getAddons({attribute: "value", 
                                            value: persisted.theme[0].id})[0];

  // Verify that plain-theme is marked to be enabled
  assert.equal(plainTheme.getNode().getAttribute("pending"), "enable");

  // Restart the browser using restart prompt
  var restartLink = addonsManager.getElement({type: "listView_restartLink", 
                                              parent: plainTheme});

  controller.startUserShutdown(TIMEOUT_USER_SHUTDOWN, true);
  controller.click(restartLink); 
}
