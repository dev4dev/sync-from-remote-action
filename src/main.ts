import * as core from '@actions/core'
import * as github from '@actions/github'
import * as exec from '@actions/exec'
import {getRemoteVersion, getLocalVersion} from './helpers'
import {env} from 'process'
import {gt} from 'semver'

const remoteRepoDirName = '__remote__source__'

async function run(): Promise<void> {
  try {
    const source: string = core.getInput('source')
    const githubToken = env['ACTIONS_RUNTIME_TOKEN'] as string
    const octokit = github.getOctokit(githubToken)
    // for (const [key, value] of Object.entries(env)) {
    //   core.info(`${key}: ${value}`)
    // }

    core.info(`${octokit}, ${source}`)

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
    const needsSync = gt(remoteVersion, localVersion)
    core.info(`Needs sync: ${needsSync}`)
    core.endGroup()

    if (!needsSync) {
      core.setOutput('synced', false)
      return
    }

    // Quit if in test mode, we don't want to delete working files
    const repo = github.context.repo
    const path = `${repo.owner}/${repo.repo}`
    const testing = path === 'dev4dev/sync-from-remote-action'
    if (testing) {
      core.info('Stopping in testing mode...')
      return
    }

    return

    core.startGroup('Syncing...')
    // SYNC IF NEEDED

    // Delete nonhidden local files (??)
    await exec.exec(`rm -rf *`)

    // Clone remote repo
    await exec.exec(`git clone ${source} ${remoteRepoDirName}`)
    const ls = await exec.getExecOutput(`ls -ahl`, [], {
      cwd: remoteRepoDirName
    })
    core.info(`remote content ${ls.stdout}`)

    // Copy remote nonhidden files (??)
    await exec.exec(`cp -R ${remoteRepoDirName}/* ./`)

    // Delete parent repo
    await exec.exec(`rm -rf ${remoteRepoDirName}`)

    // git add --all && git commit with version name && git push
    await exec.exec(`git add --all`)
    await exec.exec(`git commot -m "${remoteVersion.format()}"`)
    await exec.exec(`git push`)

    core.endGroup()
    core.setOutput('synced', true)
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
