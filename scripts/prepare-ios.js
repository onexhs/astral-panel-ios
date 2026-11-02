/**
 * 在 `cap add ios` 之后运行，给生成的 Xcode 工程打上品牌化补丁：
 *  1. App 图标换成星骇 logo（不透明正方形，系统自动切圆角）
 *  2. 启动图改成深色底 + 居中 logo（用 iOS 14+ 的 UILaunchScreen，不改 storyboard）
 *  3. 状态栏改为浅色文字（配合深色界面）
 */
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const iosApp = path.join(root, 'ios', 'App', 'App');
const assets = path.join(iosApp, 'Assets.xcassets');
const iconSrc = path.join(root, 'assets', 'icon-1024.png');
const logoSrc = path.join(root, 'assets', 'launch-logo.png');

function ensure(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function main() {
  if (!fs.existsSync(iosApp)) {
    console.error('找不到 iOS 工程，先执行 npx cap add ios');
    process.exit(1);
  }

  // 1) App 图标：覆盖 appiconset 里所有 png
  const iconDir = path.join(assets, 'AppIcon.appiconset');
  if (fs.existsSync(iconDir) && fs.existsSync(iconSrc)) {
    for (const file of fs.readdirSync(iconDir)) {
      if (file.endsWith('.png')) {
        fs.copyFileSync(iconSrc, path.join(iconDir, file));
        console.log('icon ->', file);
      }
    }
    if (!fs.readdirSync(iconDir).some(f => f.endsWith('.png'))) {
      fs.copyFileSync(iconSrc, path.join(iconDir, 'AppIcon-512@2x.png'));
      fs.writeFileSync(path.join(iconDir, 'Contents.json'), JSON.stringify({
        images: [{ filename: 'AppIcon-512@2x.png', idiom: 'universal', platform: 'ios', size: '1024x1024' }],
        info: { author: 'xcode', version: 1 }
      }, null, 2));
      console.log('icon -> AppIcon-512@2x.png (新建)');
    }
  }

  // 2) 启动背景色
  const colorDir = path.join(assets, 'LaunchBackground.colorset');
  ensure(colorDir);
  fs.writeFileSync(path.join(colorDir, 'Contents.json'), JSON.stringify({
    colors: [{
      color: {
        colorSpace: 'srgb',
        components: { red: '0.039', green: '0.047', blue: '0.071', alpha: '1.000' }
      },
      idiom: 'universal'
    }],
    info: { author: 'xcode', version: 1 }
  }, null, 2));

  // 3) 启动 logo
  if (fs.existsSync(logoSrc)) {
    const logoDir = path.join(assets, 'LaunchLogo.imageset');
    ensure(logoDir);
    fs.copyFileSync(logoSrc, path.join(logoDir, 'launch-logo.png'));
    fs.writeFileSync(path.join(logoDir, 'Contents.json'), JSON.stringify({
      images: [{ filename: 'launch-logo.png', idiom: 'universal', scale: '1x' }],
      info: { author: 'xcode', version: 1 }
    }, null, 2));
    console.log('launch logo ok');
  }

  // 4) Info.plist：UILaunchScreen + 状态栏
  const plistPath = path.join(iosApp, 'Info.plist');
  let plist = fs.readFileSync(plistPath, 'utf8');
  plist = plist.replace(/<key>UILaunchStoryboardName<\/key>\s*<string>[^<]*<\/string>\s*/g, '');
  if (!plist.includes('UILaunchScreen')) {
    const block = [
      '\t<key>UILaunchScreen</key>',
      '\t<dict>',
      '\t\t<key>UIColorName</key>',
      '\t\t<string>LaunchBackground</string>',
      '\t\t<key>UIImageName</key>',
      '\t\t<string>LaunchLogo</string>',
      '\t\t<key>UIImageRespectsSafeAreaInsets</key>',
      '\t\t<true/>',
      '\t</dict>',
      '\t<key>UIViewControllerBasedStatusBarAppearance</key>',
      '\t<false/>',
      '\t<key>UIStatusBarStyle</key>',
      '\t<string>UIStatusBarStyleLightContent</string>',
      ''
    ].join('\n');
    const index = plist.lastIndexOf('</dict>');
    plist = plist.slice(0, index) + block + plist.slice(index);
  }
  fs.writeFileSync(plistPath, plist);
  console.log('Info.plist patched');

  console.log('prepare-ios 完成');
}

main();
