from pathlib import Path
import os
import plistlib
import re

APP_ID = os.environ.get('ADMOB_APP_ID', 'ca-app-pub-8174756915786797~5894309090')
plist_path = Path('ios/App/App/Info.plist')
if not plist_path.exists():
    raise SystemExit(f'Missing {plist_path}')

with plist_path.open('rb') as f:
    plist = plistlib.load(f)

plist['GADApplicationIdentifier'] = APP_ID

# This app uses AdMob (not Google Ad Manager).
plist.pop('GADIsAdManagerApp', None)

# This app does not use App Tracking Transparency.
# Remove NSUserTrackingUsageDescription if it exists so App Store Connect
# does not interpret this binary as requesting tracking permission.
plist.pop('NSUserTrackingUsageDescription', None)

# Google's SKAdNetwork identifier. Additional partner IDs can be added later if mediation is enabled.
plist['SKAdNetworkItems'] = [
    {'SKAdNetworkIdentifier': 'cstr6suwn9.skadnetwork'}
]

with plist_path.open('wb') as f:
    plistlib.dump(plist, f, sort_keys=False)

# Ensure iPhone-only target and a conservative deployment target.
pbx = Path('ios/App/App.xcodeproj/project.pbxproj')
if pbx.exists():
    s = pbx.read_text(encoding='utf-8')
    s = re.sub(r'TARGETED_DEVICE_FAMILY = "[^"]+";', 'TARGETED_DEVICE_FAMILY = "1";', s)
    s = re.sub(r'IPHONEOS_DEPLOYMENT_TARGET = [0-9.]+;', 'IPHONEOS_DEPLOYMENT_TARGET = 15.0;', s)
    pbx.write_text(s, encoding='utf-8')

print('Configured Info.plist with AdMob App ID:', APP_ID)
print('Removed NSUserTrackingUsageDescription (ATT not used).')
print('Configured iPhone-only target.')

# Replace generated Capacitor app icon with the approved HowMuchQuiz icon.
icon_src = Path('assets/AppIcon-1024.png')
appicon = Path('ios/App/App/Assets.xcassets/AppIcon.appiconset')
if icon_src.exists() and appicon.exists():
    import json
    import subprocess

    specs = [
        ('iphone', '20x20', '2x', 40),
        ('iphone', '20x20', '3x', 60),
        ('iphone', '29x29', '2x', 58),
        ('iphone', '29x29', '3x', 87),
        ('iphone', '40x40', '2x', 80),
        ('iphone', '40x40', '3x', 120),
        ('iphone', '60x60', '2x', 120),
        ('iphone', '60x60', '3x', 180),
        ('ios-marketing', '1024x1024', '1x', 1024),
    ]

    images = []
    for idiom, size, scale, px in specs:
        filename = f'AppIcon-{px}.png' if idiom != 'ios-marketing' else 'AppIcon-1024.png'
        dst = appicon / filename
        subprocess.run(
            ['sips', '-z', str(px), str(px), str(icon_src), '--out', str(dst)],
            check=True,
            stdout=subprocess.DEVNULL
        )
        images.append({
            'idiom': idiom,
            'size': size,
            'scale': scale,
            'filename': filename
        })

    (appicon / 'Contents.json').write_text(
        json.dumps({'images': images, 'info': {'author': 'xcode', 'version': 1}}, indent=2),
        encoding='utf-8'
    )
    print('Configured AppIcon set.')
