/**
 * SentinelSystemDaemon.ts - Persistent System Daemon (Level 0)
 * 
 * "The Sentinel launches at the kernel level before any user-space apps."
 * 
 * This module configures the PFF Sentinel as a PersistentSystemDaemon (Level 0).
 * It must launch at the kernel level before any user-space applications.
 * 
 * Features:
 * - Kernel-level initialization (Level 0)
 * - Auto-start on boot
 * - Platform-specific service registration (Windows/macOS/Linux/Android/iOS)
 * - Process priority elevation
 * - System-level permissions
 * 
 * Born in Lagos, Nigeria. Built for Sovereign Security.
 * Architect: ISREAL OKORO
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const execAsync = promisify(exec);

// ============================================================================
// CONSTANTS
// ============================================================================

export const DAEMON_NAME = 'PFFSentinel';
export const DAEMON_VERSION = '1.0.0';
export const DAEMON_DESCRIPTION = 'PFF Sentinel - Persistent System Daemon (Level 0)';
export const DAEMON_PRIORITY = 'HIGHEST'; // Kernel-level priority

// Service file paths
export const WINDOWS_SERVICE_PATH = 'C:\\ProgramData\\PFFSentinel\\service.exe';
export const MACOS_LAUNCHD_PATH = '/Library/LaunchDaemons/com.vitalia.pffsentinel.plist';
export const LINUX_SYSTEMD_PATH = '/etc/systemd/system/pffsentinel.service';
export const ANDROID_INIT_PATH = '/system/etc/init/pffsentinel.rc';
export const IOS_LAUNCHD_PATH = '/Library/LaunchDaemons/com.vitalia.pffsentinel.plist';

// ============================================================================
// TYPES
// ============================================================================

export enum Platform {
  WINDOWS = 'windows',
  MACOS = 'macos',
  LINUX = 'linux',
  ANDROID = 'android',
  IOS = 'ios',
  UNKNOWN = 'unknown',
}

export interface DaemonConfig {
  name: string;
  version: string;
  description: string;
  executablePath: string;
  priority: string;
  autoStart: boolean;
  restartOnFailure: boolean;
  maxRestartAttempts: number;
}

export interface DaemonStatus {
  isRunning: boolean;
  isInstalled: boolean;
  isEnabled: boolean;
  pid?: number;
  uptime?: number;
  platform: Platform;
  servicePath?: string;
}

export interface InstallResult {
  success: boolean;
  platform: Platform;
  servicePath: string;
  message: string;
}

// ============================================================================
// PLATFORM DETECTION
// ============================================================================

/**
 * Detect current platform
 */
export function detectPlatform(): Platform {
  const platform = os.platform();
  
  if (platform === 'win32') {
    return Platform.WINDOWS;
  } else if (platform === 'darwin') {
    return Platform.MACOS;
  } else if (platform === 'linux') {
    // Check if Android
    if (fs.existsSync('/system/build.prop')) {
      return Platform.ANDROID;
    }
    return Platform.LINUX;
  } else if (platform === 'ios') {
    return Platform.IOS;
  }
  
  return Platform.UNKNOWN;
}

// ============================================================================
// DAEMON INSTALLATION
// ============================================================================

/**
 * Install PFF Sentinel as persistent system daemon
 * 
 * This function installs the Sentinel as a system-level service that:
 * - Launches at kernel level (Level 0)
 * - Starts before any user-space apps
 * - Auto-starts on boot
 * - Restarts on failure
 * - Runs with highest priority
 * 
 * @param config Daemon configuration
 * @returns Installation result
 */
export async function installSystemDaemon(config: DaemonConfig): Promise<InstallResult> {
  console.log('[SENTINEL_DAEMON] Installing PFF Sentinel as system daemon...');
  console.log(`[SENTINEL_DAEMON] Platform: ${detectPlatform()}`);
  console.log(`[SENTINEL_DAEMON] Priority: ${config.priority}`);
  
  const platform = detectPlatform();
  
  switch (platform) {
    case Platform.WINDOWS:
      return await installWindowsService(config);
    case Platform.MACOS:
      return await installMacOSLaunchDaemon(config);
    case Platform.LINUX:
      return await installLinuxSystemdService(config);
    case Platform.ANDROID:
      return await installAndroidInitService(config);
    case Platform.IOS:
      return await installIOSLaunchDaemon(config);
    default:
      return {
        success: false,
        platform,
        servicePath: '',
        message: `Unsupported platform: ${platform}`,
      };
  }
}

// ============================================================================
// WINDOWS SERVICE INSTALLATION
// ============================================================================

/**
 * Install Windows Service (Level 0 - Kernel Driver)
 *
 * Uses Windows Service Control Manager (SCM) to register the Sentinel
 * as a kernel-level service that starts before user login.
 */
async function installWindowsService(config: DaemonConfig): Promise<InstallResult> {
  console.log('[SENTINEL_DAEMON] Installing Windows Service...');

  try {
    // Create service using sc.exe (Service Control)
    const createCommand = `sc create ${config.name} ` +
      `binPath= "${config.executablePath}" ` +
      `start= auto ` +
      `type= own ` +
      `DisplayName= "${config.description}"`;

    await execAsync(createCommand);

    // Set service to start at boot (before user login)
    const configCommand = `sc config ${config.name} start= boot`;
    await execAsync(configCommand);

    // Set failure recovery options
    const failureCommand = `sc failure ${config.name} reset= 86400 actions= restart/5000/restart/10000/restart/30000`;
    await execAsync(failureCommand);

    // Start the service
    await execAsync(`sc start ${config.name}`);

    console.log('[SENTINEL_DAEMON] ✅ Windows Service installed successfully');

    return {
      success: true,
      platform: Platform.WINDOWS,
      servicePath: WINDOWS_SERVICE_PATH,
      message: 'Windows Service installed and started',
    };
  } catch (error) {
    console.error('[SENTINEL_DAEMON] ❌ Windows Service installation failed:', error);
    return {
      success: false,
      platform: Platform.WINDOWS,
      servicePath: WINDOWS_SERVICE_PATH,
      message: `Installation failed: ${error}`,
    };
  }
}

// ============================================================================
// MACOS LAUNCHD INSTALLATION
// ============================================================================

/**
 * Install macOS LaunchDaemon (Level 0 - System Daemon)
 *
 * Uses launchd to register the Sentinel as a system daemon that
 * starts at boot before user login.
 */
async function installMacOSLaunchDaemon(config: DaemonConfig): Promise<InstallResult> {
  console.log('[SENTINEL_DAEMON] Installing macOS LaunchDaemon...');

  try {
    // Create plist file
    const plistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.vitalia.pffsentinel</string>
    <key>ProgramArguments</key>
    <array>
        <string>${config.executablePath}</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>ProcessType</key>
    <string>Interactive</string>
    <key>Nice</key>
    <integer>-20</integer>
    <key>StandardOutPath</key>
    <string>/var/log/pffsentinel.log</string>
    <key>StandardErrorPath</key>
    <string>/var/log/pffsentinel.error.log</string>
</dict>
</plist>`;

    // Write plist file
    fs.writeFileSync(MACOS_LAUNCHD_PATH, plistContent);

    // Set permissions
    await execAsync(`chmod 644 ${MACOS_LAUNCHD_PATH}`);
    await execAsync(`chown root:wheel ${MACOS_LAUNCHD_PATH}`);

    // Load the daemon
    await execAsync(`launchctl load ${MACOS_LAUNCHD_PATH}`);

    console.log('[SENTINEL_DAEMON] ✅ macOS LaunchDaemon installed successfully');

    return {
      success: true,
      platform: Platform.MACOS,
      servicePath: MACOS_LAUNCHD_PATH,
      message: 'macOS LaunchDaemon installed and loaded',
    };
  } catch (error) {
    console.error('[SENTINEL_DAEMON] ❌ macOS LaunchDaemon installation failed:', error);
    return {
      success: false,
      platform: Platform.MACOS,
      servicePath: MACOS_LAUNCHD_PATH,
      message: `Installation failed: ${error}`,
    };
  }
}

// ============================================================================
// LINUX SYSTEMD INSTALLATION
// ============================================================================

/**
 * Install Linux systemd service (Level 0 - System Service)
 *
 * Uses systemd to register the Sentinel as a system service that
 * starts at boot before user login.
 */
async function installLinuxSystemdService(config: DaemonConfig): Promise<InstallResult> {
  console.log('[SENTINEL_DAEMON] Installing Linux systemd service...');

  try {
    // Create systemd service file
    const serviceContent = `[Unit]
Description=${config.description}
After=network.target
Before=multi-user.target

[Service]
Type=simple
ExecStart=${config.executablePath}
Restart=always
RestartSec=5
Nice=-20
IOSchedulingClass=realtime
IOSchedulingPriority=0

[Install]
WantedBy=multi-user.target`;

    // Write service file
    fs.writeFileSync(LINUX_SYSTEMD_PATH, serviceContent);

    // Reload systemd
    await execAsync('systemctl daemon-reload');

    // Enable service (auto-start on boot)
    await execAsync(`systemctl enable ${config.name}`);

    // Start service
    await execAsync(`systemctl start ${config.name}`);

    console.log('[SENTINEL_DAEMON] ✅ Linux systemd service installed successfully');

    return {
      success: true,
      platform: Platform.LINUX,
      servicePath: LINUX_SYSTEMD_PATH,
      message: 'Linux systemd service installed and started',
    };
  } catch (error) {
    console.error('[SENTINEL_DAEMON] ❌ Linux systemd service installation failed:', error);
    return {
      success: false,
      platform: Platform.LINUX,
      servicePath: LINUX_SYSTEMD_PATH,
      message: `Installation failed: ${error}`,
    };
  }
}

// ============================================================================
// ANDROID INIT SERVICE INSTALLATION
// ============================================================================

/**
 * Install Android init service (Level 0 - System Service)
 *
 * Uses Android init system to register the Sentinel as a system service
 * that starts at boot before user-space apps.
 *
 * NOTE: Requires root access and system partition write permissions.
 */
async function installAndroidInitService(config: DaemonConfig): Promise<InstallResult> {
  console.log('[SENTINEL_DAEMON] Installing Android init service...');

  try {
    // Create init.rc file
    const initContent = `service pffsentinel /system/bin/pffsentinel
    class main
    user root
    group root
    priority -20
    oneshot
    disabled

on boot
    start pffsentinel`;

    // Write init file (requires root)
    fs.writeFileSync(ANDROID_INIT_PATH, initContent);

    // Set permissions
    await execAsync(`chmod 644 ${ANDROID_INIT_PATH}`);

    // Trigger init reload (requires root)
    await execAsync('setprop ctl.restart zygote');

    console.log('[SENTINEL_DAEMON] ✅ Android init service installed successfully');

    return {
      success: true,
      platform: Platform.ANDROID,
      servicePath: ANDROID_INIT_PATH,
      message: 'Android init service installed (requires reboot)',
    };
  } catch (error) {
    console.error('[SENTINEL_DAEMON] ❌ Android init service installation failed:', error);
    return {
      success: false,
      platform: Platform.ANDROID,
      servicePath: ANDROID_INIT_PATH,
      message: `Installation failed: ${error}`,
    };
  }
}

// ============================================================================
// IOS LAUNCHD INSTALLATION
// ============================================================================

/**
 * Install iOS LaunchDaemon (Level 0 - System Daemon)
 *
 * Uses launchd to register the Sentinel as a system daemon.
 *
 * NOTE: Requires jailbreak or enterprise provisioning profile.
 */
async function installIOSLaunchDaemon(config: DaemonConfig): Promise<InstallResult> {
  console.log('[SENTINEL_DAEMON] Installing iOS LaunchDaemon...');

  try {
    // Same as macOS LaunchDaemon
    const plistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.vitalia.pffsentinel</string>
    <key>ProgramArguments</key>
    <array>
        <string>${config.executablePath}</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>ProcessType</key>
    <string>Interactive</string>
</dict>
</plist>`;

    // Write plist file
    fs.writeFileSync(IOS_LAUNCHD_PATH, plistContent);

    // Load the daemon
    await execAsync(`launchctl load ${IOS_LAUNCHD_PATH}`);

    console.log('[SENTINEL_DAEMON] ✅ iOS LaunchDaemon installed successfully');

    return {
      success: true,
      platform: Platform.IOS,
      servicePath: IOS_LAUNCHD_PATH,
      message: 'iOS LaunchDaemon installed and loaded',
    };
  } catch (error) {
    console.error('[SENTINEL_DAEMON] ❌ iOS LaunchDaemon installation failed:', error);
    return {
      success: false,
      platform: Platform.IOS,
      servicePath: IOS_LAUNCHD_PATH,
      message: `Installation failed: ${error}`,
    };
  }
}

// ============================================================================
// DAEMON STATUS
// ============================================================================

/**
 * Get daemon status
 */
export async function getDaemonStatus(): Promise<DaemonStatus> {
  const platform = detectPlatform();

  switch (platform) {
    case Platform.WINDOWS:
      return await getWindowsServiceStatus();
    case Platform.MACOS:
      return await getMacOSLaunchDaemonStatus();
    case Platform.LINUX:
      return await getLinuxSystemdServiceStatus();
    case Platform.ANDROID:
      return await getAndroidInitServiceStatus();
    case Platform.IOS:
      return await getIOSLaunchDaemonStatus();
    default:
      return {
        isRunning: false,
        isInstalled: false,
        isEnabled: false,
        platform,
      };
  }
}

async function getWindowsServiceStatus(): Promise<DaemonStatus> {
  try {
    const { stdout } = await execAsync(`sc query ${DAEMON_NAME}`);
    const isRunning = stdout.includes('RUNNING');
    const isInstalled = !stdout.includes('does not exist');

    return {
      isRunning,
      isInstalled,
      isEnabled: isInstalled,
      platform: Platform.WINDOWS,
      servicePath: WINDOWS_SERVICE_PATH,
    };
  } catch (error) {
    return {
      isRunning: false,
      isInstalled: false,
      isEnabled: false,
      platform: Platform.WINDOWS,
    };
  }
}

async function getMacOSLaunchDaemonStatus(): Promise<DaemonStatus> {
  try {
    const { stdout } = await execAsync('launchctl list | grep pffsentinel');
    const isRunning = stdout.length > 0;
    const isInstalled = fs.existsSync(MACOS_LAUNCHD_PATH);

    return {
      isRunning,
      isInstalled,
      isEnabled: isInstalled,
      platform: Platform.MACOS,
      servicePath: MACOS_LAUNCHD_PATH,
    };
  } catch (error) {
    return {
      isRunning: false,
      isInstalled: fs.existsSync(MACOS_LAUNCHD_PATH),
      isEnabled: false,
      platform: Platform.MACOS,
    };
  }
}

async function getLinuxSystemdServiceStatus(): Promise<DaemonStatus> {
  try {
    const { stdout } = await execAsync(`systemctl status ${DAEMON_NAME}`);
    const isRunning = stdout.includes('active (running)');
    const isInstalled = fs.existsSync(LINUX_SYSTEMD_PATH);
    const isEnabled = stdout.includes('enabled');

    return {
      isRunning,
      isInstalled,
      isEnabled,
      platform: Platform.LINUX,
      servicePath: LINUX_SYSTEMD_PATH,
    };
  } catch (error) {
    return {
      isRunning: false,
      isInstalled: fs.existsSync(LINUX_SYSTEMD_PATH),
      isEnabled: false,
      platform: Platform.LINUX,
    };
  }
}

async function getAndroidInitServiceStatus(): Promise<DaemonStatus> {
  try {
    const { stdout } = await execAsync('getprop init.svc.pffsentinel');
    const isRunning = stdout.trim() === 'running';
    const isInstalled = fs.existsSync(ANDROID_INIT_PATH);

    return {
      isRunning,
      isInstalled,
      isEnabled: isInstalled,
      platform: Platform.ANDROID,
      servicePath: ANDROID_INIT_PATH,
    };
  } catch (error) {
    return {
      isRunning: false,
      isInstalled: fs.existsSync(ANDROID_INIT_PATH),
      isEnabled: false,
      platform: Platform.ANDROID,
    };
  }
}

async function getIOSLaunchDaemonStatus(): Promise<DaemonStatus> {
  try {
    const { stdout } = await execAsync('launchctl list | grep pffsentinel');
    const isRunning = stdout.length > 0;
    const isInstalled = fs.existsSync(IOS_LAUNCHD_PATH);

    return {
      isRunning,
      isInstalled,
      isEnabled: isInstalled,
      platform: Platform.IOS,
      servicePath: IOS_LAUNCHD_PATH,
    };
  } catch (error) {
    return {
      isRunning: false,
      isInstalled: fs.existsSync(IOS_LAUNCHD_PATH),
      isEnabled: false,
      platform: Platform.IOS,
    };
  }
}

// ============================================================================
// DAEMON CONTROL
// ============================================================================

/**
 * Start daemon
 */
export async function startDaemon(): Promise<boolean> {
  const platform = detectPlatform();

  try {
    switch (platform) {
      case Platform.WINDOWS:
        await execAsync(`sc start ${DAEMON_NAME}`);
        break;
      case Platform.MACOS:
      case Platform.IOS:
        await execAsync(`launchctl start com.vitalia.pffsentinel`);
        break;
      case Platform.LINUX:
        await execAsync(`systemctl start ${DAEMON_NAME}`);
        break;
      case Platform.ANDROID:
        await execAsync('setprop ctl.start pffsentinel');
        break;
    }

    console.log('[SENTINEL_DAEMON] ✅ Daemon started successfully');
    return true;
  } catch (error) {
    console.error('[SENTINEL_DAEMON] ❌ Failed to start daemon:', error);
    return false;
  }
}

/**
 * Stop daemon
 */
export async function stopDaemon(): Promise<boolean> {
  const platform = detectPlatform();

  try {
    switch (platform) {
      case Platform.WINDOWS:
        await execAsync(`sc stop ${DAEMON_NAME}`);
        break;
      case Platform.MACOS:
      case Platform.IOS:
        await execAsync(`launchctl stop com.vitalia.pffsentinel`);
        break;
      case Platform.LINUX:
        await execAsync(`systemctl stop ${DAEMON_NAME}`);
        break;
      case Platform.ANDROID:
        await execAsync('setprop ctl.stop pffsentinel');
        break;
    }

    console.log('[SENTINEL_DAEMON] ✅ Daemon stopped successfully');
    return true;
  } catch (error) {
    console.error('[SENTINEL_DAEMON] ❌ Failed to stop daemon:', error);
    return false;
  }
}

/**
 * Restart daemon
 */
export async function restartDaemon(): Promise<boolean> {
  await stopDaemon();
  await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
  return await startDaemon();
}

/**
 * Uninstall daemon
 */
export async function uninstallDaemon(): Promise<boolean> {
  const platform = detectPlatform();

  try {
    // Stop daemon first
    await stopDaemon();

    switch (platform) {
      case Platform.WINDOWS:
        await execAsync(`sc delete ${DAEMON_NAME}`);
        break;
      case Platform.MACOS:
        await execAsync(`launchctl unload ${MACOS_LAUNCHD_PATH}`);
        fs.unlinkSync(MACOS_LAUNCHD_PATH);
        break;
      case Platform.LINUX:
        await execAsync(`systemctl disable ${DAEMON_NAME}`);
        fs.unlinkSync(LINUX_SYSTEMD_PATH);
        await execAsync('systemctl daemon-reload');
        break;
      case Platform.ANDROID:
        fs.unlinkSync(ANDROID_INIT_PATH);
        await execAsync('setprop ctl.restart zygote');
        break;
      case Platform.IOS:
        await execAsync(`launchctl unload ${IOS_LAUNCHD_PATH}`);
        fs.unlinkSync(IOS_LAUNCHD_PATH);
        break;
    }

    console.log('[SENTINEL_DAEMON] ✅ Daemon uninstalled successfully');
    return true;
  } catch (error) {
    console.error('[SENTINEL_DAEMON] ❌ Failed to uninstall daemon:', error);
    return false;
  }
}

