/**
 * Main entrypoint after conditions met in index.ts
 */

// Import everything
import "@/controllers";
import "@/ipc";
import "@/modules/content-blocker";
import "@/modules/extensions/main";
import { setupPlatformIntegration } from "@/app/platform";
import { processInitialUrl } from "@/app/urls";
import { setupSecondInstanceHandling } from "@/app/instance";
import { runOnboardingOrInitialWindow } from "@/app/onboarding";
import { setupAppLifecycle } from "@/app/lifecycle";
import { windowsController } from "@/controllers/windows-controller";
import { app } from "electron";

// Handle initial URL (runs asynchronously)
processInitialUrl();

// Setup second instance handler
setupSecondInstanceHandling();

// Setup platform specific features
setupPlatformIntegration();

// Open onboarding / create initial window
runOnboardingOrInitialWindow();

// Show floating widget after app is ready
app.whenReady().then(() => {
  windowsController.floatingWidget.getSingletonWindow();
});

// App lifecycle events
setupAppLifecycle();
