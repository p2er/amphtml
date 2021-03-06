/**
 * Copyright 2016 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * The entry point for AMP Runtime (v0.js) when AMP Runtime may support
 * multiple AMP Docs in Shadow DOM.
 */

import './polyfills';
import {Services} from './services';
import {
  installDocService,
  installShadowDocForShell,
} from './service/ampdoc-impl';
import {
  adoptShadowMode,
  installBuiltins,
  installRuntimeServices,
  installAmpdocServices,
} from './runtime';
import {
  installStylesForDoc,
  makeBodyVisible,
  bodyAlwaysVisible,
} from './style-installer';
import {deactivateChunking} from './chunk';
import {doNotTrackImpression} from './impression';
import {cssText} from '../build/css';
import {isExperimentOn} from './experiments';
import {installPerformanceService} from './service/performance-impl';
import {stubElementsForDoc} from './custom-element';

// This feature doesn't make sense in shadow mode as it only applies to
// background rendered iframes;
deactivateChunking();

// Declare that this runtime will support multiple shadow-root docs.
installDocService(self, /* isSingleDoc */ false);

// Core services.
installRuntimeServices(self);

// Impression tracking for PWA is not meaningful, but the dependent code
// has to be unblocked.
doNotTrackImpression();

if (isExperimentOn(self, 'ampdoc-shell')) {
  //Shadow mode with an Ampdoc for the shell
  installPerformanceService(self);
  const ampdocService = Services.ampdocServiceFor(self);
  const ampdocShell = installShadowDocForShell(ampdocService);
  installStylesForDoc(ampdocShell, cssText, () => {
    installAmpdocServices(ampdocShell);

    // Builtins.
    installBuiltins(self);

    // Final configuration and stubbing.
    adoptShadowMode(self);

    // Pre-stub already known elements.
    stubElementsForDoc(ampdocShell);

    makeBodyVisible(self.document, /* waitForServices */ true);
    Services.resourcesForDoc(ampdocShell).ampInitComplete();
  }, /* opt_isRuntimeCss */ true, /* opt_ext */ 'amp-runtime');
} else {
  // PWA shell manages its own visibility and shadow ampdocs their own.
  bodyAlwaysVisible(self);

  // Builtins.
  installBuiltins(self);

  // Final configuration and stubbing.
  adoptShadowMode(self);
}

// Output a message to the console and add an attribute to the <html>
// tag to give some information that can be used in error reports.
// (At least by sophisticated users).
if (self.console) {
  (console.info || console.log).call(console,
      'Powered by AMP ⚡ HTML shadows – Version $internalRuntimeVersion$');
}
self.document.documentElement.setAttribute('amp-version',
    '$internalRuntimeVersion$');
