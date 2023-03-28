import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as io from '@actions/io'
import * as glob from '@actions/glob'
import {getRemoteVersion, getLocalVersion} from './helpers'
import {gt} from 'semver'

const remoteRepoDirName = '__remote__source__'

async function run(): Promise<void> {
  try {
    const source: string = core.getInput('source')

    // 0. Clone current repo
    // uses: actions/checkout@v3

    core.startGroup('Precheck')
    // 1. Get remote version
    const remoteVersion = await getRemoteVersion(source)
    core.info(`Remote version: ${remoteVersion}`)

    // 2. Get local version
    const localVersion = await getLocalVersion()
    core.info(`Local version: ${localVersion}`)

    // 3. Compare version
    const needsSync = gt(remoteVersion.version, localVersion)
    core.info(`Needs sync: ${needsSync}`)
    core.endGroup()

    if (!needsSync) {
      core.setOutput('synced', false)
      return
    }

    core.startGroup('Syncing...')
    // SYNC IF NEEDED

    // Delete nonhidden local files (??)
    const localItems = await glob.create('*', {
      implicitDescendants: false
    })
    const allLocal = await localItems.glob()
    const visibleLocal = allLocal.filter(file => {
      const parts = file.split('/')
      const hidden = parts.pop()?.startsWith('.') ?? false
      return !hidden
    })

    core.info('Removing local stuff...')
    for (const file of visibleLocal) {
      core.info(`Deleting ${file}...`)
      await io.rmRF(file)
    }

    // check local content
    core.info(`local content ${(await exec.getExecOutput(`ls -ahl`)).stdout}`)

    // Clone remote repo
    await exec.exec(`git clone ${source} ${remoteRepoDirName}`)
    await exec.getExecOutput(`git checkout ${remoteVersion.tag}`, [], {
      cwd: remoteRepoDirName
    })
    const rls = await exec.getExecOutput(`ls -ahl`, [], {
      cwd: remoteRepoDirName
    })
    core.info(`remote content ${rls.stdout}`)

    // Copy remote files
    const remoteItems = await glob.create(`./${remoteRepoDirName}/*`, {
      implicitDescendants: false
    })
    const allRemote = await remoteItems.glob()
    const visibleRemote = allRemote.filter(file => {
      const parts = file.split('/')
      const hidden = parts.pop()?.startsWith('.') ?? false
      return !hidden
    })
    core.info('Copying remote files...')
    for (const file of visibleRemote) {
      core.info(`Copying ${file}...`)
      await io.cp(file, './', {
        recursive: true,
        force: true
      })
    }

    // Delete parent repo
    await io.rmRF(`./${remoteRepoDirName}`)

    // check local content
    core.info(`local content ${(await exec.getExecOutput(`ls -ahl`)).stdout}`)

    core.endGroup()
    core.setOutput('synced', true)
    core.setOutput('version', remoteVersion.version.format())
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
