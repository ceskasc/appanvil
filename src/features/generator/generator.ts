import type {
  CatalogApp,
  ChocoProvider,
  ScoopProvider,
  WingetProvider,
} from '../../data/schema'

export interface GeneratorOptions {
  silentInstall: boolean
  continueOnError: boolean
  includeMsStoreApps: boolean
}

export const DEFAULT_GENERATOR_OPTIONS: GeneratorOptions = {
  silentInstall: true,
  continueOnError: true,
  includeMsStoreApps: false,
}

export type GenerateTab =
  | 'ps1'
  | 'winget'
  | 'installer'
  | 'choco'
  | 'scoop'
  | 'json'

export interface GeneratorOutput {
  ps1: string
  winget: string
  installerCmd: string
  choco?: string
  scoop?: string
  selectionJson: string
}

interface WingetPlanItem {
  app: CatalogApp
  provider: WingetProvider
}

interface ChocoPlanItem {
  app: CatalogApp
  provider: ChocoProvider
}

interface ScoopPlanItem {
  app: CatalogApp
  provider: ScoopProvider
}

type InstallPlanItem =
  | {
      app: CatalogApp
      method: 'winget'
      provider: WingetProvider
    }
  | {
      app: CatalogApp
      method: 'choco'
      provider: ChocoProvider
    }
  | {
      app: CatalogApp
      method: 'scoop'
      provider: ScoopProvider
    }

const dedupeAndSortApps = (apps: CatalogApp[]): CatalogApp[] => {
  const byId = new Map<string, CatalogApp>()
  for (const app of apps) {
    byId.set(app.id, app)
  }

  return [...byId.values()].sort((left, right) => left.name.localeCompare(right.name))
}

const normalizeOptions = (options: GeneratorOptions): GeneratorOptions => ({
  silentInstall: options.silentInstall,
  continueOnError: options.continueOnError,
  includeMsStoreApps: options.includeMsStoreApps,
})

const toPsBoolean = (value: boolean): string => (value ? '$true' : '$false')

const escapePowerShellString = (value: string): string =>
  value.replaceAll("'", "''")

const isMsStoreSource = (source: string | undefined): boolean =>
  typeof source === 'string' && source.toLowerCase() === 'msstore'

const buildInstallPlan = (
  apps: CatalogApp[],
  options: GeneratorOptions,
): {
  plan: InstallPlanItem[]
  skippedMsStoreWithoutFallback: WingetPlanItem[]
} => {
  const plan: InstallPlanItem[] = []
  const skippedMsStoreWithoutFallback: WingetPlanItem[] = []

  for (const app of apps) {
    const winget = app.providers.winget
    const choco = app.providers.choco
    const scoop = app.providers.scoop

    if (
      winget &&
      (options.includeMsStoreApps || !isMsStoreSource(winget.source))
    ) {
      plan.push({ app, method: 'winget', provider: winget })
      continue
    }

    if (winget && !options.includeMsStoreApps && isMsStoreSource(winget.source)) {
      if (choco) {
        plan.push({ app, method: 'choco', provider: choco })
        continue
      }

      if (scoop) {
        plan.push({ app, method: 'scoop', provider: scoop })
        continue
      }

      skippedMsStoreWithoutFallback.push({ app, provider: winget })
      continue
    }

    if (choco) {
      plan.push({ app, method: 'choco', provider: choco })
      continue
    }

    if (scoop) {
      plan.push({ app, method: 'scoop', provider: scoop })
    }
  }

  return { plan, skippedMsStoreWithoutFallback }
}

const toWingetArgs = (
  item: WingetPlanItem,
  options: GeneratorOptions,
): string[] => {
  const source = item.provider.source.trim()
  const args = [
    'install',
    '--id',
    item.provider.packageId,
    '--exact',
    '--accept-source-agreements',
    '--accept-package-agreements',
  ]

  if (source.length > 0 && source !== 'winget') {
    args.push('--source', source)
  }

  if (options.silentInstall && item.provider.supportsSilent) {
    args.push('--silent')
  }

  return args
}

const toWingetCommand = (
  item: WingetPlanItem,
  options: GeneratorOptions,
): string => {
  const args = toWingetArgs(item, options).map((part) =>
    part.includes(' ') ? `"${part}"` : part,
  )
  return `winget ${args.join(' ')}`
}

const buildWingetOutput = (
  wingetPlan: WingetPlanItem[],
  options: GeneratorOptions,
  skippedMsStore: WingetPlanItem[],
): string => {
  const lines = ['# AppAnvil Winget commands', '# Review scripts before running.']

  if (!options.includeMsStoreApps && skippedMsStore.length > 0) {
    lines.push(
      `# Skipped msstore apps (${skippedMsStore.length}): ${skippedMsStore.map((item) => item.app.name).join(', ')}`,
    )
  }

  if (wingetPlan.length === 0) {
    lines.push('# No winget-compatible apps in this selection.')
    return lines.join('\n')
  }

  for (const item of wingetPlan) {
    if (item.app.needsVerification) {
      lines.push(`# VERIFY: ${item.app.name} mapping may need manual confirmation.`)
    }
    lines.push(toWingetCommand(item, options))
  }

  return lines.join('\n')
}

const buildChocoOutput = (plan: ChocoPlanItem[]): string | undefined => {
  if (plan.length === 0) {
    return undefined
  }

  const lines = [
    '# AppAnvil Chocolatey commands',
    '# Only apps with Chocolatey mappings are included.',
  ]

  for (const item of plan) {
    if (item.app.needsVerification) {
      lines.push(`# VERIFY: ${item.app.name} mapping may need manual confirmation.`)
    }
    lines.push(`choco install ${item.provider.packageId} -y`)
  }

  return lines.join('\n')
}

const buildScoopOutput = (plan: ScoopPlanItem[]): string | undefined => {
  if (plan.length === 0) {
    return undefined
  }

  const lines = [
    '# AppAnvil Scoop commands',
    '# Only apps with Scoop mappings are included.',
  ]

  const buckets = [...new Set(plan.map((item) => item.provider.bucket).filter((bucket) => bucket !== 'main'))]
  for (const bucket of buckets) {
    lines.push(`scoop bucket add ${bucket}`)
  }

  for (const item of plan) {
    if (item.app.needsVerification) {
      lines.push(`# VERIFY: ${item.app.name} mapping may need manual confirmation.`)
    }
    lines.push(`scoop install ${item.provider.packageId}`)
  }

  return lines.join('\n')
}

const buildPowerShellScript = (
  installPlan: InstallPlanItem[],
  options: GeneratorOptions,
  skippedMsStore: WingetPlanItem[],
): string => {
  const installPlanLines =
    installPlan.length === 0
      ? ['$installPlan = @()']
      : [
          '$installPlan = @(',
          ...installPlan.flatMap((item) => {
            const packageId = item.provider.packageId
            let source = ''
            let bucket = ''
            let useSilent = false

            if (item.method === 'winget') {
              source = item.provider.source
              useSilent = options.silentInstall && item.provider.supportsSilent
            }

            if (item.method === 'scoop') {
              source = item.provider.bucket
              bucket = item.provider.bucket
            }

            return [
              '  @{',
              `    Name = '${escapePowerShellString(item.app.name)}'`,
              `    Method = '${item.method}'`,
              `    Id = '${escapePowerShellString(packageId)}'`,
              `    Source = '${escapePowerShellString(source)}'`,
              `    Bucket = '${escapePowerShellString(bucket)}'`,
              `    UseSilent = ${toPsBoolean(useSilent)}`,
              `    NeedsVerification = ${toPsBoolean(item.app.needsVerification)}`,
              '  },',
            ]
          }),
          ')',
        ]

  const lines = [
    '# AppAnvil generated PowerShell installer',
    '# Review scripts before running.',
    '# This website does not execute installers.',
    '',
    'Set-StrictMode -Version Latest',
    "$ErrorActionPreference = 'Continue'",
    "$host.UI.RawUI.WindowTitle = 'AppAnvil Installer'",
    '',
    "$esc = [char]27",
    'function Paint([string]$Text, [string]$ColorCode) {',
    '  return "$esc[$ColorCode`m$Text$esc[0m"',
    '}',
    '',
    'function Banner {',
    "  Write-Host (Paint '========================================' '96')",
    "  Write-Host (Paint '      APPANVIL VISUAL INSTALLER        ' '96')",
    "  Write-Host (Paint '========================================' '96')",
    "  Write-Host (Paint 'This script installs selected apps one by one.' '90')",
    "  Write-Host ''",
    '}',
    '',
    'Banner',
    '',
    "$logRoot = Join-Path $env:TEMP 'AppAnvil'",
    "$logFile = Join-Path $logRoot 'appanvil-install.log'",
    'New-Item -ItemType Directory -Path $logRoot -Force | Out-Null',
    "'=== AppAnvil run ' + (Get-Date -Format s) + ' ===' | Out-File -FilePath $logFile -Encoding utf8 -Append",
    '',
    '$identity = [Security.Principal.WindowsIdentity]::GetCurrent()',
    '$principal = New-Object Security.Principal.WindowsPrincipal($identity)',
    '$isAdmin = $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)',
    'if (-not $isAdmin) {',
    "  Write-Warning 'Run PowerShell as Administrator for best results.'",
    "  Write-Host (Paint 'Tip: Right-click PowerShell and choose Run as administrator.' '33')",
    '} else {',
    "  Write-Host (Paint 'Administrator privileges detected.' '32')",
    '}',
    '',
    '$success = [System.Collections.Generic.List[string]]::new()',
    '$failed = [System.Collections.Generic.List[string]]::new()',
    '$statusRows = [System.Collections.Generic.List[object]]::new()',
    '$addedBuckets = [System.Collections.Generic.HashSet[string]]::new()',
    '',
    ...installPlanLines,
  ]

  if (!options.includeMsStoreApps && skippedMsStore.length > 0) {
    lines.push(
      '',
      `# Skipped msstore apps without fallback: ${skippedMsStore.map((item) => item.app.name).join(', ')}`,
    )
  }

  lines.push(
    '',
    '$needsWinget = ($installPlan | Where-Object { $_.Method -eq "winget" }).Count -gt 0',
    '$needsChoco = ($installPlan | Where-Object { $_.Method -eq "choco" }).Count -gt 0',
    '$needsScoop = ($installPlan | Where-Object { $_.Method -eq "scoop" }).Count -gt 0',
    '',
    'if ($needsWinget -and -not (Get-Command winget -ErrorAction SilentlyContinue)) {',
    "  Write-Error 'winget was not found on this machine.'",
    "  Write-Host 'Install Microsoft App Installer from https://aka.ms/getwinget'",
    '  exit 1',
    '}',
    'if ($needsChoco -and -not (Get-Command choco -ErrorAction SilentlyContinue)) {',
    "  Write-Error 'Chocolatey (choco) is required for selected apps but was not found.'",
    "  Write-Host 'Install Chocolatey from https://chocolatey.org/install'",
    '  exit 1',
    '}',
    'if ($needsScoop -and -not (Get-Command scoop -ErrorAction SilentlyContinue)) {',
    "  Write-Error 'Scoop is required for selected apps but was not found.'",
    "  Write-Host 'Install Scoop from https://scoop.sh/'",
    '  exit 1',
    '}',
    '',
    `$continueOnError = ${toPsBoolean(options.continueOnError)}`,
    '',
    'if ($installPlan.Count -eq 0) {',
    "  Write-Warning 'No installable apps were generated for this selection.'",
    '  exit 0',
    '}',
    '',
    '$total = $installPlan.Count',
    '$current = 0',
    '',
    'foreach ($item in $installPlan) {',
    '  $current += 1',
    "  $progressStart = [Math]::Round((($current - 1) / $total) * 100)",
    "  Write-Progress -Id 1 -Activity 'AppAnvil installing selected apps' -Status ('Preparing ' + $item.Name) -PercentComplete $progressStart",
    '',
    '  if ($item.NeedsVerification) {',
    "    Write-Warning ('{0} is marked for verification. Confirm package mapping if needed.' -f $item.Name)",
    '  }',
    '',
    "  Write-Host (Paint ('[{0}/{1}] Installing {2}' -f $current, $total, $item.Name) '96')",
    '',
    "  $runner = ''",
    '  $args = @()',
    '',
    '  switch ($item.Method) {',
    "    'winget' {",
    "      $runner = 'winget'",
    "      $args = @('install', '--id', $item.Id, '--exact', '--accept-source-agreements', '--accept-package-agreements')",
    "      if ($item.Source -and $item.Source -ne 'winget') {",
    "        $args += @('--source', $item.Source)",
    '      }',
    '      if ($item.UseSilent) {',
    "        $args += '--silent'",
    '      }',
    '    }',
    "    'choco' {",
    "      $runner = 'choco'",
    "      $args = @('install', $item.Id, '-y')",
    '    }',
    "    'scoop' {",
    "      $runner = 'scoop'",
    "      if ($item.Bucket -and $item.Bucket -ne 'main' -and -not $addedBuckets.Contains($item.Bucket)) {",
    "        Write-Host (Paint ('Adding Scoop bucket: {0}' -f $item.Bucket) '90')",
    "        & scoop bucket add $item.Bucket 2>&1 | Tee-Object -FilePath $logFile -Append",
    '        if ($LASTEXITCODE -ne 0) {',
    '          throw "Failed to add Scoop bucket $($item.Bucket)."',
    '        }',
    '        $addedBuckets.Add($item.Bucket) | Out-Null',
    '      }',
    "      $args = @('install', $item.Id)",
    '    }',
    '  }',
    '',
    "  (($runner + ' ' + ($args -join ' '))) | Out-File -FilePath $logFile -Encoding utf8 -Append",
    '',
    '  try {',
    '    & $runner @args 2>&1 | Tee-Object -FilePath $logFile -Append',
    '    if ($LASTEXITCODE -eq 0) {',
    '      $success.Add($item.Name) | Out-Null',
    "      $statusRows.Add([pscustomobject]@{ App = $item.Name; Method = $item.Method; Status = 'OK' }) | Out-Null",
    "      Write-Host (Paint ('OK: ' + $item.Name) '32')",
    '    } else {',
    '      $failed.Add($item.Name) | Out-Null',
    "      $statusRows.Add([pscustomobject]@{ App = $item.Name; Method = $item.Method; Status = ('Fail (' + $LASTEXITCODE + ')') }) | Out-Null",
    "      Write-Host (Paint ('FAIL: ' + $item.Name + ' (exit ' + $LASTEXITCODE + ')') '31')",
    '      if (-not $continueOnError) {',
    '        break',
    '      }',
    '    }',
    '  } catch {',
    '    $failed.Add($item.Name) | Out-Null',
    "    $statusRows.Add([pscustomobject]@{ App = $item.Name; Method = $item.Method; Status = 'Error' }) | Out-Null",
    "    Write-Error ('Unexpected error while installing {0}: {1}' -f $item.Name, $_)",
    '    if (-not $continueOnError) {',
    '      break',
    '    }',
    '  }',
    '',
    "  $progressEnd = [Math]::Round(($current / $total) * 100)",
    "  Write-Progress -Id 1 -Activity 'AppAnvil installing selected apps' -Status ('Completed ' + $item.Name) -PercentComplete $progressEnd",
    '}',
    '',
    "Write-Progress -Id 1 -Activity 'AppAnvil installing selected apps' -Completed",
    '',
    "Write-Host ''",
    "Write-Host (Paint 'Install summary' '96')",
    "Write-Host (Paint '--------------' '96')",
    '$statusRows | Format-Table -AutoSize | Out-String | Write-Host',
    "Write-Host ('Succeeded: {0}' -f $success.Count)",
    'if ($success.Count -gt 0) {',
    "  Write-Host ('  ' + ($success -join ', '))",
    '}',
    "Write-Host ('Failed: {0}' -f $failed.Count)",
    'if ($failed.Count -gt 0) {',
    "  Write-Host ('  ' + ($failed -join ', '))",
    '}',
    "Write-Host ('Log file: {0}' -f $logFile)",
  )

  return lines.join('\n')
}

const escapeCmdArg = (value: string): string => value.replaceAll('"', '""')

const buildInstallerCmd = (
  installPlan: InstallPlanItem[],
  options: GeneratorOptions,
  skippedMsStore: WingetPlanItem[],
): string => {
  const needsWinget = installPlan.some((item) => item.method === 'winget')
  const needsChoco = installPlan.some((item) => item.method === 'choco')
  const needsScoop = installPlan.some((item) => item.method === 'scoop')

  const commandLines = installPlan.flatMap((item) => {
    const packageId = item.provider.packageId
    let source = ''
    let bucket = ''
    let useSilent = false

    if (item.method === 'winget') {
      source = item.provider.source
      useSilent = options.silentInstall && item.provider.supportsSilent
    }

    if (item.method === 'scoop') {
      source = item.provider.bucket
      bucket = item.provider.bucket
    }

    const needsVerification = item.app.needsVerification

    return [
      `call :install "${escapeCmdArg(item.app.name)}" "${item.method}" "${escapeCmdArg(packageId)}" "${escapeCmdArg(source)}" "${escapeCmdArg(bucket)}" "${useSilent ? '1' : '0'}" "${needsVerification ? '1' : '0'}"`,
      'if errorlevel 2 goto :summary',
    ]
  })

  const lines = [
    '@echo off',
    'setlocal EnableExtensions EnableDelayedExpansion',
    'title AppAnvil Installer',
    '',
    'echo AppAnvil installer launcher',
    'echo Review scripts before running.',
    'echo This installer runs selected app installs sequentially.',
    'echo.',
    '',
    'net session >nul 2>&1',
    'if not "%ERRORLEVEL%"=="0" (',
    '  echo [WARNING] Administrator privileges not detected.',
    '  echo [INFO] Right-click and "Run as administrator" for best results.',
    '  echo.',
    ')',
    '',
    'set "HAS_WINGET=0"',
    'set "HAS_CHOCO=0"',
    'set "HAS_SCOOP=0"',
    'where winget >nul 2>&1 && set "HAS_WINGET=1"',
    'where choco >nul 2>&1 && set "HAS_CHOCO=1"',
    'where scoop >nul 2>&1 && set "HAS_SCOOP=1"',
    '',
    `set "NEEDS_WINGET=${needsWinget ? '1' : '0'}"`,
    `set "NEEDS_CHOCO=${needsChoco ? '1' : '0'}"`,
    `set "NEEDS_SCOOP=${needsScoop ? '1' : '0'}"`,
    '',
    'if "%NEEDS_WINGET%"=="1" if "%HAS_WINGET%"=="0" (',
    '  echo [ERROR] winget is required but was not found.',
    '  echo [INFO] Install App Installer: https://aka.ms/getwinget',
    '  pause',
    '  exit /b 1',
    ')',
    'if "%NEEDS_CHOCO%"=="1" if "%HAS_CHOCO%"=="0" (',
    '  echo [ERROR] Chocolatey is required but was not found.',
    '  echo [INFO] Install Chocolatey: https://chocolatey.org/install',
    '  pause',
    '  exit /b 1',
    ')',
    'if "%NEEDS_SCOOP%"=="1" if "%HAS_SCOOP%"=="0" (',
    '  echo [ERROR] Scoop is required but was not found.',
    '  echo [INFO] Install Scoop: https://scoop.sh/',
    '  pause',
    '  exit /b 1',
    ')',
    '',
    'set "LOGDIR=%TEMP%\\AppAnvil"',
    'set "LOGFILE=%LOGDIR%\\appanvil-install.log"',
    'if not exist "%LOGDIR%" mkdir "%LOGDIR%"',
    'echo === AppAnvil run %DATE% %TIME% ===>>"%LOGFILE%"',
    '',
    `set "CONTINUE_ON_ERROR=${options.continueOnError ? '1' : '0'}"`,
    'set /a SUCCESS=0',
    'set /a FAIL=0',
    'set "FAILED_LIST="',
    'set "ADDED_BUCKETS=;"',
    '',
  ]

  if (!options.includeMsStoreApps && skippedMsStore.length > 0) {
    lines.push(
      `echo [INFO] Skipped MS Store apps without fallback: ${skippedMsStore.map((item) => item.app.name).join(', ')}`,
      'echo.',
    )
  }

  if (commandLines.length === 0) {
    lines.push(
      'echo [INFO] No installable apps in this selection.',
      'goto :summary',
      '',
    )
  } else {
    lines.push(...commandLines, '')
  }

  lines.push(
    'goto :summary',
    '',
    ':ensureBucket',
    'set "TARGET_BUCKET=%~1"',
    'echo !ADDED_BUCKETS! | find /I ";!TARGET_BUCKET!;" >nul && exit /b 0',
    'echo [INFO] Adding Scoop bucket !TARGET_BUCKET!...',
    'scoop bucket add "!TARGET_BUCKET!" >>"%LOGFILE%" 2>&1',
    'if errorlevel 1 (',
    '  echo [FAIL] Could not add Scoop bucket !TARGET_BUCKET!',
    '  exit /b 1',
    ')',
    'set "ADDED_BUCKETS=!ADDED_BUCKETS!!TARGET_BUCKET!;"',
    'exit /b 0',
    '',
    ':install',
    'set "APPNAME=%~1"',
    'set "METHOD=%~2"',
    'set "PKG=%~3"',
    'set "SOURCE=%~4"',
    'set "BUCKET=%~5"',
    'set "USESILENT=%~6"',
    'set "NEEDSVERIFY=%~7"',
    '',
    'if "%NEEDSVERIFY%"=="1" echo [VERIFY] %APPNAME% mapping should be reviewed.',
    '',
    'echo Installing %APPNAME% ...',
    'echo [INSTALL] %APPNAME%>>"%LOGFILE%"',
    '',
    'if /I "%METHOD%"=="winget" (',
    '  if not "%SOURCE%"=="" if /I not "%SOURCE%"=="winget" (',
    '    if "%USESILENT%"=="1" (',
    '      winget install --id "%PKG%" --exact --accept-source-agreements --accept-package-agreements --source "%SOURCE%" --silent >>"%LOGFILE%" 2>&1',
    '    ) else (',
    '      winget install --id "%PKG%" --exact --accept-source-agreements --accept-package-agreements --source "%SOURCE%" >>"%LOGFILE%" 2>&1',
    '    )',
    '  ) else (',
    '    if "%USESILENT%"=="1" (',
    '      winget install --id "%PKG%" --exact --accept-source-agreements --accept-package-agreements --silent >>"%LOGFILE%" 2>&1',
    '    ) else (',
    '      winget install --id "%PKG%" --exact --accept-source-agreements --accept-package-agreements >>"%LOGFILE%" 2>&1',
    '    )',
    '  )',
    ') else if /I "%METHOD%"=="choco" (',
    '  choco install "%PKG%" -y >>"%LOGFILE%" 2>&1',
    ') else if /I "%METHOD%"=="scoop" (',
    '  if not "%BUCKET%"=="" if /I not "%BUCKET%"=="main" (',
    '    call :ensureBucket "%BUCKET%"',
    '    if errorlevel 1 goto :install_fail',
    '  )',
    '  scoop install "%PKG%" >>"%LOGFILE%" 2>&1',
    ') else (',
    '  echo [FAIL] Unknown installer method for %APPNAME%',
    '  goto :install_fail_stop',
    ')',
    '',
    'if errorlevel 1 goto :install_fail',
    '',
    'echo [OK] %APPNAME%',
    'set /a SUCCESS+=1',
    'exit /b 0',
    '',
    ':install_fail',
    'echo [FAIL] %APPNAME%',
    'set /a FAIL+=1',
    'set "FAILED_LIST=!FAILED_LIST!%APPNAME%, "',
    'if "%CONTINUE_ON_ERROR%"=="1" exit /b 0',
    ':install_fail_stop',
    'exit /b 2',
    '',
    ':summary',
    'echo.',
    'echo ===============================',
    'echo AppAnvil install summary',
    'echo Succeeded: %SUCCESS%',
    'echo Failed: %FAIL%',
    'if not "%FAILED_LIST%"=="" echo Failed apps: %FAILED_LIST%',
    'echo Log file: %LOGFILE%',
    'echo ===============================',
    'pause',
    'exit /b %FAIL%',
  )

  return lines.join('\n')
}

const buildSelectionJson = (
  apps: CatalogApp[],
  options: GeneratorOptions,
): string => {
  const payload = {
    version: 1,
    selectedIds: apps.map((app) => app.id),
    options,
  }

  return JSON.stringify(payload, null, 2)
}

export const generateInstallOutputs = (
  selectedApps: CatalogApp[],
  rawOptions: GeneratorOptions,
): GeneratorOutput => {
  const apps = dedupeAndSortApps(selectedApps)
  const options = normalizeOptions(rawOptions)
  const { plan: installPlan, skippedMsStoreWithoutFallback } = buildInstallPlan(
    apps,
    options,
  )

  const wingetAll = apps
    .filter(
      (
        app,
      ): app is CatalogApp & { providers: { winget: WingetProvider } } =>
        Boolean(app.providers.winget),
    )
    .map((app) => ({ app, provider: app.providers.winget }))

  const wingetPlan = wingetAll.filter(
    (item) =>
      options.includeMsStoreApps || !isMsStoreSource(item.provider.source),
  )
  const skippedMsStore = options.includeMsStoreApps
    ? []
    : wingetAll.filter((item) => isMsStoreSource(item.provider.source))

  const chocoPlan: ChocoPlanItem[] = apps
    .filter(
      (
        app,
      ): app is CatalogApp & { providers: { choco: ChocoProvider } } =>
        Boolean(app.providers.choco),
    )
    .map((app) => ({ app, provider: app.providers.choco }))

  const scoopPlan: ScoopPlanItem[] = apps
    .filter(
      (
        app,
      ): app is CatalogApp & { providers: { scoop: ScoopProvider } } =>
        Boolean(app.providers.scoop),
    )
    .map((app) => ({ app, provider: app.providers.scoop }))

  return {
    ps1: buildPowerShellScript(
      installPlan,
      options,
      skippedMsStoreWithoutFallback,
    ),
    winget: buildWingetOutput(wingetPlan, options, skippedMsStore),
    installerCmd: buildInstallerCmd(
      installPlan,
      options,
      skippedMsStoreWithoutFallback,
    ),
    choco: buildChocoOutput(chocoPlan),
    scoop: buildScoopOutput(scoopPlan),
    selectionJson: buildSelectionJson(apps, options),
  }
}
