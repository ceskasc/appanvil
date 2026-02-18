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

export type GenerateTab = 'ps1' | 'winget' | 'choco' | 'scoop' | 'json'

export interface GeneratorOutput {
  ps1: string
  winget: string
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
  wingetPlan: WingetPlanItem[],
  options: GeneratorOptions,
  skippedMsStore: WingetPlanItem[],
): string => {
  const installPlanLines =
    wingetPlan.length === 0
      ? ['$installPlan = @()']
      : [
          '$installPlan = @(',
          ...wingetPlan.flatMap((item) => [
            '  @{',
            `    Name = '${escapePowerShellString(item.app.name)}'`,
            `    Id = '${escapePowerShellString(item.provider.packageId)}'`,
            `    Source = '${escapePowerShellString(item.provider.source)}'`,
            `    UseSilent = ${toPsBoolean(options.silentInstall && item.provider.supportsSilent)}`,
            `    NeedsVerification = ${toPsBoolean(item.app.needsVerification)}`,
            '  },',
          ]),
          ')',
        ]

  const lines = [
    '# AppAnvil generated script',
    '# Review scripts before running.',
    '# This website does not execute installers.',
    '',
    'Set-StrictMode -Version Latest',
    "$ErrorActionPreference = 'Continue'",
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
    "  Write-Host 'Open PowerShell as Administrator, then run this script again.'",
    '}',
    '',
    'if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {',
    "  Write-Error 'winget was not found on this machine.'",
    "  Write-Host 'Install Microsoft App Installer from the Store or visit https://aka.ms/getwinget.'",
    '  exit 1',
    '}',
    '',
    `$useSilentInstall = ${toPsBoolean(options.silentInstall)}`,
    `$continueOnError = ${toPsBoolean(options.continueOnError)}`,
    `$includeMsStoreApps = ${toPsBoolean(options.includeMsStoreApps)}`,
    '',
    'if (-not $includeMsStoreApps) {',
    "  Write-Warning 'MS Store sourced apps are excluded by option.'",
    '}',
    '',
    '$success = [System.Collections.Generic.List[string]]::new()',
    '$failed = [System.Collections.Generic.List[string]]::new()',
    '',
    ...installPlanLines,
  ]

  if (!options.includeMsStoreApps && skippedMsStore.length > 0) {
    lines.push(
      '',
      `# Skipped msstore apps: ${skippedMsStore.map((item) => item.app.name).join(', ')}`,
    )
  }

  lines.push(
    '',
    'if ($installPlan.Count -eq 0) {',
    "  Write-Warning 'No winget-compatible apps were generated for this selection.'",
    '} else {',
    '  foreach ($item in $installPlan) {',
    "    if (-not $includeMsStoreApps -and $item.Source -eq 'msstore') {",
    "      Write-Warning ('Skipping {0} because msstore packages are disabled.' -f $item.Name)",
    '      continue',
    '    }',
    '',
    '    if ($item.NeedsVerification) {',
    "      Write-Warning ('{0} is marked for verification. Confirm the package mapping before install.' -f $item.Name)",
    '    }',
    '',
    '    $args = @(',
    "      'install'",
    "      '--id'",
    '      $item.Id',
    "      '--exact'",
    "      '--accept-source-agreements'",
    "      '--accept-package-agreements'",
    '    )',
    '',
    "    if ($item.Source -and $item.Source -ne 'winget') {",
    "      $args += @('--source', $item.Source)",
    '    }',
    '',
    '    if ($useSilentInstall -and $item.UseSilent) {',
    "      $args += '--silent'",
    '    }',
    '',
    "    Write-Host ('Installing {0} ({1})' -f $item.Name, $item.Id)",
    "    ('winget ' + ($args -join ' ')) | Out-File -FilePath $logFile -Encoding utf8 -Append",
    '',
    '    try {',
    '      & winget @args 2>&1 | Tee-Object -FilePath $logFile -Append',
    '      if ($LASTEXITCODE -eq 0) {',
    '        $success.Add($item.Name) | Out-Null',
    '      } else {',
    '        $failed.Add($item.Name) | Out-Null',
    "        Write-Warning ('Install failed for {0} with exit code {1}.' -f $item.Name, $LASTEXITCODE)",
    '        if (-not $continueOnError) {',
    '          break',
    '        }',
    '      }',
    '    } catch {',
    '      $failed.Add($item.Name) | Out-Null',
    "      Write-Error ('Unexpected error while installing {0}: {1}' -f $item.Name, $_)",
    '      if (-not $continueOnError) {',
    '        break',
    '      }',
    '    }',
    '  }',
    '}',
    '',
    "Write-Host ''",
    "Write-Host 'Install summary:'",
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

  const wingetAll = apps
    .filter((app): app is CatalogApp & { providers: { winget: WingetProvider } } => Boolean(app.providers.winget))
    .map((app) => ({ app, provider: app.providers.winget }))

  const wingetPlan = wingetAll.filter(
    (item) => options.includeMsStoreApps || !isMsStoreSource(item.provider.source),
  )
  const skippedMsStore = wingetAll.filter((item) =>
    isMsStoreSource(item.provider.source),
  )

  const chocoPlan: ChocoPlanItem[] = apps
    .filter((app): app is CatalogApp & { providers: { choco: ChocoProvider } } => Boolean(app.providers.choco))
    .map((app) => ({ app, provider: app.providers.choco }))

  const scoopPlan: ScoopPlanItem[] = apps
    .filter((app): app is CatalogApp & { providers: { scoop: ScoopProvider } } => Boolean(app.providers.scoop))
    .map((app) => ({ app, provider: app.providers.scoop }))

  return {
    ps1: buildPowerShellScript(wingetPlan, options, skippedMsStore),
    winget: buildWingetOutput(wingetPlan, options, skippedMsStore),
    choco: buildChocoOutput(chocoPlan),
    scoop: buildScoopOutput(scoopPlan),
    selectionJson: buildSelectionJson(apps, options),
  }
}
