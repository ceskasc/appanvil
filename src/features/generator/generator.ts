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

const buildInstallerCmd = (ps1: string): string => {
  const psLines = ps1.split('\n')
  const lines = [
    '@echo off',
    'setlocal',
    'title AppAnvil Visual Installer',
    '',
    'set "SELF=%~f0"',
    'echo AppAnvil installer launcher',
    'echo Starting embedded visual PowerShell installer...',
    'echo.',
    'powershell -NoProfile -ExecutionPolicy Bypass -Command "$raw = Get-Content -LiteralPath $env:SELF -Raw; $marker = ' +
      "'::APPANVIL_PS::'" +
      '; $idx = $raw.IndexOf($marker); if ($idx -lt 0) { Write-Error ' +
      "'Embedded installer payload not found.'" +
      '; exit 1 }; $script = $raw.Substring($idx + $marker.Length).TrimStart(' +
      "'`r','`n'" +
      '); $tempDir = Join-Path $env:TEMP ' +
      "'AppAnvil'" +
      '; New-Item -ItemType Directory -Path $tempDir -Force | Out-Null; $tempPs = Join-Path $tempDir ' +
      "'appanvil-install.ps1'" +
      '; Set-Content -LiteralPath $tempPs -Value $script -Encoding UTF8; & powershell -NoProfile -ExecutionPolicy Bypass -File $tempPs; exit $LASTEXITCODE"',
    'set "EXITCODE=%ERRORLEVEL%"',
    'echo.',
    'if not "%EXITCODE%"=="0" (',
    '  echo Installer finished with errors. Check %%TEMP%%\\AppAnvil\\appanvil-install.log',
    ') else (',
    '  echo Installer completed.',
    ')',
    'pause',
    'exit /b %EXITCODE%',
    '::APPANVIL_PS::',
    ...psLines,
  ]

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

  const ps1 = buildPowerShellScript(
    installPlan,
    options,
    skippedMsStoreWithoutFallback,
  )

  return {
    ps1,
    winget: buildWingetOutput(wingetPlan, options, skippedMsStore),
    installerCmd: buildInstallerCmd(ps1),
    choco: buildChocoOutput(chocoPlan),
    scoop: buildScoopOutput(scoopPlan),
    selectionJson: buildSelectionJson(apps, options),
  }
}
