import { windowsController } from "@/controllers/windows-controller";
import { ipcMain, BrowserWindow, screen } from "electron";

// 图标拖动
ipcMain.handle("floating-widget:move-icon", (_event, deltaX: number, deltaY: number) => {
  const floatingWidget = windowsController.floatingWidget.getAll()[0];
  if (floatingWidget) {
    const [currentX, currentY] = floatingWidget.browserWindow.getPosition();
    floatingWidget.browserWindow.setPosition(
      Math.round(currentX + deltaX),
      Math.round(currentY + deltaY)
    );
    
    // 同步移动菜单窗口
    const menuWindow = BrowserWindow.getAllWindows().find(
      (win) => win.webContents.getURL().includes("mode=menu")
    );
    if (menuWindow && menuWindow.isVisible()) {
      const [menuX, menuY] = menuWindow.getPosition();
      menuWindow.setPosition(
        Math.round(menuX + deltaX),
        Math.round(menuY + deltaY)
      );
    }
    
    // 同步移动背景窗口（无论是否可见都要移动）
    const backgroundWindow = BrowserWindow.getAllWindows().find(
      (win) => win.webContents.getURL().includes("mode=background")
    );
    if (backgroundWindow) {
      const [bgX, bgY] = backgroundWindow.getPosition();
      backgroundWindow.setPosition(
        Math.round(bgX + deltaX),
        Math.round(bgY + deltaY)
      );
    }
  }
});

// 图标拖动结束，检查是否需要吸附边缘
ipcMain.handle("floating-widget:snap-icon", () => {
  const floatingWidget = windowsController.floatingWidget.getAll()[0];
  if (floatingWidget) {
    const [x, y] = floatingWidget.browserWindow.getPosition();
    const [width] = floatingWidget.browserWindow.getSize();
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth } = primaryDisplay.workAreaSize;

    const snapDistance = 120;
    let newX = x;

    // 检查左边缘
    if (x < snapDistance) {
      newX = 10;
    }
    // 检查右边缘
    else if (x + width > screenWidth - snapDistance) {
      newX = screenWidth;
    }

    // 如果位置有变化，应用吸附
    if (newX !== x) {
      console.log(`[FLOATING_WIDGET] Snapping icon from x=${x} to x=${newX}`);
      const deltaX = newX - x;
      floatingWidget.browserWindow.setPosition(Math.round(newX), y);
      
      // 同步移动菜单窗口
      const menuWindow = BrowserWindow.getAllWindows().find(
        (win) => win.webContents.getURL().includes("mode=menu")
      );
      if (menuWindow && menuWindow.isVisible()) {
        const [menuX, menuY] = menuWindow.getPosition();
        menuWindow.setPosition(
          Math.round(menuX + deltaX),
          menuY
        );
      }
      
      // 同步移动背景窗口（无论是否可见都要移动）
      const backgroundWindow = BrowserWindow.getAllWindows().find(
        (win) => win.webContents.getURL().includes("mode=background")
      );
      if (backgroundWindow) {
        const [bgX, bgY] = backgroundWindow.getPosition();
        backgroundWindow.setPosition(
          Math.round(bgX + deltaX),
          bgY
        );
      }
    }
  }
});

// 浮层调整尺寸
ipcMain.handle("floating-widget:resize-panel", (_event, width: number, height: number) => {
  const floatingWidget = windowsController.floatingWidget.getAll()[0];
  if (floatingWidget) {
    // 获取panelWindow
    const panelWindow = BrowserWindow.getAllWindows().find(
      (win) => win.webContents.getURL().includes("mode=panel")
    );
    if (panelWindow) {
      panelWindow.setSize(width, height);
    }
  }
});

// 浮层拖动
ipcMain.handle("floating-widget:move-panel", (_event, deltaX: number, deltaY: number) => {
  const floatingWidget = windowsController.floatingWidget.getAll()[0];
  if (floatingWidget) {
    const panelWindow = BrowserWindow.getAllWindows().find(
      (win) => win.webContents.getURL().includes("mode=panel")
    );
    if (panelWindow) {
      const [currentX, currentY] = panelWindow.getPosition();
      panelWindow.setPosition(
        Math.round(currentX + deltaX),
        Math.round(currentY + deltaY)
      );
    }
  }
});
