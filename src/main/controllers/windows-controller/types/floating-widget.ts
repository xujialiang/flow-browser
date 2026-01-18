import { BaseWindow } from "@/controllers/windows-controller/types/base";
import { PATHS } from "@/modules/paths";
import { BrowserWindow, screen, ipcMain } from "electron";

export class FloatingWidgetWindow extends BaseWindow {
  private panelWindow: BrowserWindow | null = null;
  private isPanelVisible = false;
  private menuWindow: BrowserWindow | null = null;
  private isMenuVisible = false;
  private menuHideTimeout: NodeJS.Timeout | null = null;
  private backgroundWindow: BrowserWindow | null = null;
  private isBackgroundVisible = false;
  private backgroundHideTimeout: NodeJS.Timeout | null = null;

  constructor() {
    // 获取屏幕尺寸
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

    console.log("[FLOATING_WIDGET] Screen size:", screenWidth, "x", screenHeight);

    // 图标窗口尺寸
    const iconWidth = 40;
    const iconHeight = 40;

    // 图标位置（屏幕右下角）
    const iconX = screenWidth - iconWidth - 50;
    const iconY = screenHeight - iconHeight - 50;

    console.log("[FLOATING_WIDGET] Icon position:", iconX, iconY);

    // 创建图标窗口
    const iconWindow = new BrowserWindow({
      width: iconWidth,
      height: iconHeight,
      x: iconX,
      y: iconY,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      show: false,
      webPreferences: {
        preload: PATHS.PRELOAD,
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    // 设置窗口层级为屏幕保护级别，确保始终在最顶层
    iconWindow.setAlwaysOnTop(true, 'screen-saver');

    iconWindow.loadURL("flow-internal://floating-widget/?mode=icon");

    iconWindow.webContents.on("did-finish-load", () => {
      console.log("[FLOATING_WIDGET] Icon loaded, showing");
      iconWindow.show();
      // 确保 icon 在所有窗口之上
      iconWindow.moveTop();
    });

    // 监听图标点击事件
    ipcMain.on("floating-widget:toggle-panel", () => {
      this.togglePanel();
    });

    // 监听 hover 事件
    ipcMain.on("floating-widget:icon-hover-enter", () => {
      this.showMenu();
      this.showBackground();
    });

    ipcMain.on("floating-widget:icon-hover-leave", () => {
      this.scheduleHideMenu();
      this.scheduleHideBackground();
    });

    ipcMain.on("floating-widget:menu-hover-enter", () => {
      this.cancelHideMenu();
      this.cancelHideBackground();
    });

    ipcMain.on("floating-widget:menu-hover-leave", () => {
      this.scheduleHideMenu();
      this.scheduleHideBackground();
    });

    super("floating-widget", iconWindow, {
      showAfterLoad: false,
    });
  }

  private togglePanel() {
    if (!this.panelWindow) {
      this.createPanel();
    } else if (this.isPanelVisible) {
      this.panelWindow.hide();
      this.isPanelVisible = false;
      console.log("[FLOATING_WIDGET] Panel hidden");
    } else {
      this.panelWindow.show();
      this.isPanelVisible = true;
      console.log("[FLOATING_WIDGET] Panel shown");
    }
  }

  private createPanel() {
    // 获取图标窗口位置
    const [iconX, iconY] = this.browserWindow.getPosition();
    const [iconWidth] = this.browserWindow.getSize();

    // 浮层尺寸（默认小尺寸）
    const panelWidth = 440;
    const panelHeight = 106;

    // 浮层位置（图标上方）
    const panelX = iconX + iconWidth / 2 - panelWidth / 2;
    const panelY = iconY - panelHeight - 10;

    console.log("[FLOATING_WIDGET] Creating panel at:", panelX, panelY);

    this.panelWindow = new BrowserWindow({
      width: panelWidth,
      height: panelHeight,
      x: Math.max(0, panelX),
      y: Math.max(0, panelY),
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      show: false,
      webPreferences: {
        preload: PATHS.PRELOAD,
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    // 设置窗口层级为屏幕保护级别
    this.panelWindow.setAlwaysOnTop(true, 'screen-saver');

    this.panelWindow.loadURL("flow-internal://floating-widget/?mode=panel");

    this.panelWindow.webContents.on("did-finish-load", () => {
      console.log("[FLOATING_WIDGET] Panel loaded, showing");
      this.panelWindow!.show();
      this.isPanelVisible = true;
    });

    this.panelWindow.on("closed", () => {
      this.panelWindow = null;
      this.isPanelVisible = false;
    });
  }

  private showMenu() {
    console.log("[FLOATING_WIDGET] Showing hover menu");
    
    // 取消隐藏定时器
    this.cancelHideMenu();

    if (!this.menuWindow) {
      this.createMenu();
    } else if (!this.isMenuVisible) {
      this.menuWindow.show();
      this.isMenuVisible = true;
      // 确保 icon 在菜单之上
      this.browserWindow.moveTop();
    }
  }

  private hideMenu() {
    console.log("[FLOATING_WIDGET] Hiding hover menu");
    
    if (this.menuWindow && this.isMenuVisible) {
      this.menuWindow.hide();
      this.isMenuVisible = false;
    }
  }

  private scheduleHideMenu() {
    console.log("[FLOATING_WIDGET] Scheduling menu hide");
    
    // 延迟隐藏，给用户时间移动到菜单上
    this.menuHideTimeout = setTimeout(() => {
      this.hideMenu();
    }, 200);
  }

  private cancelHideMenu() {
    if (this.menuHideTimeout) {
      console.log("[FLOATING_WIDGET] Canceling menu hide");
      clearTimeout(this.menuHideTimeout);
      this.menuHideTimeout = null;
    }
  }

  private createMenu() {
    // 获取图标窗口位置和尺寸
    const [iconX, iconY] = this.browserWindow.getPosition();
    const [iconWidth] = this.browserWindow.getSize();

    // 菜单尺寸
    const menuWidth = 180;
    const menuHeight = 200;

    // 菜单位置（图标正上方，右侧对齐）
    const menuX = iconX + iconWidth - menuWidth; // 右侧对齐
    const menuY = iconY - menuHeight - 12; // 图标上方，留12px间距

    console.log("[FLOATING_WIDGET] Creating menu at:", menuX, menuY);

    this.menuWindow = new BrowserWindow({
      width: menuWidth,
      height: menuHeight,
      x: Math.max(0, menuX),
      y: Math.max(0, menuY),
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      show: false,
      webPreferences: {
        preload: PATHS.PRELOAD,
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    // 设置窗口层级为屏幕保护级别
    this.menuWindow.setAlwaysOnTop(true, 'screen-saver');

    this.menuWindow.loadURL("flow-internal://floating-widget/?mode=menu");

    this.menuWindow.webContents.on("did-finish-load", () => {
      console.log("[FLOATING_WIDGET] Menu loaded, showing");
      this.menuWindow!.show();
      this.isMenuVisible = true;
      // 确保 icon 在菜单之上
      this.browserWindow.moveTop();
    });

    this.menuWindow.on("closed", () => {
      this.menuWindow = null;
      this.isMenuVisible = false;
      this.cancelHideMenu();
    });
  }

  private showBackground() {
    console.log("[FLOATING_WIDGET] Showing background");
    
    // 取消隐藏定时器
    this.cancelHideBackground();

    if (!this.backgroundWindow) {
      this.createBackground();
    } else if (!this.isBackgroundVisible) {
      this.backgroundWindow.show();
      this.isBackgroundVisible = true;
    }
    
    // 无论哪种情况，都确保 icon 始终在最上层
    this.browserWindow.moveTop();
  }

  private hideBackground() {
    console.log("[FLOATING_WIDGET] Hiding background");
    
    if (this.backgroundWindow && this.isBackgroundVisible) {
      this.backgroundWindow.hide();
      this.isBackgroundVisible = false;
    }
  }

  private scheduleHideBackground() {
    console.log("[FLOATING_WIDGET] Scheduling background hide");
    
    // 延迟隐藏，给用户时间移动到菜单上
    this.backgroundHideTimeout = setTimeout(() => {
      this.hideBackground();
    }, 200);
  }

  private cancelHideBackground() {
    if (this.backgroundHideTimeout) {
      console.log("[FLOATING_WIDGET] Canceling background hide");
      clearTimeout(this.backgroundHideTimeout);
      this.backgroundHideTimeout = null;
    }
  }

  private createBackground() {
    // 获取图标窗口位置和尺寸
    const [iconX, iconY] = this.browserWindow.getPosition();
    const [iconWidth] = this.browserWindow.getSize();

    // 背景尼寸
    const bgWidth = 180;
    const bgHeight = 42;

    // 背景位置（与图标同高，右侧对齐）
    const bgX = iconX + iconWidth - bgWidth; // 右侧对齐
    const bgY = iconY;

    console.log("[FLOATING_WIDGET] Creating background at:", bgX, bgY);

    this.backgroundWindow = new BrowserWindow({
      width: bgWidth,
      height: bgHeight,
      x: Math.max(0, bgX),
      y: bgY,
      frame: false,
      transparent: true,
      alwaysOnTop: false,
      skipTaskbar: true,
      resizable: false,
      show: false,
      webPreferences: {
        preload: PATHS.PRELOAD,
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    // 设置窗口层级为屏幕保护级别（但低于icon）
    this.backgroundWindow.setAlwaysOnTop(true, 'screen-saver');

    // 设置背景窗口忽略鼠标事件，避免干扰 icon 的 hover 事件
    this.backgroundWindow.setIgnoreMouseEvents(true);

    this.backgroundWindow.loadURL("flow-internal://floating-widget/?mode=background");

    this.backgroundWindow.webContents.on("did-finish-load", () => {
      console.log("[FLOATING_WIDGET] Background loaded, showing");
      this.backgroundWindow!.show();
      this.isBackgroundVisible = true;
      // 确保 icon 在背景之上
      this.browserWindow.moveTop();
    });

    this.backgroundWindow.on("closed", () => {
      this.backgroundWindow = null;
      this.isBackgroundVisible = false;
    });
  }
}
